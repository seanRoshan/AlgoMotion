/**
 * FFmpeg.wasm encoder — real implementation.
 *
 * Wraps FFmpeg.wasm 0.12+ for client-side video encoding.
 * Lazy-loaded on first use (~25MB download).
 *
 * Spec reference: Section 6.9 (Export System)
 */

import type { ExportSettings, FFmpegEncoder } from './export-types';

/**
 * Create an FFmpeg encoder that lazily loads FFmpeg.wasm.
 *
 * Uses dynamic import to avoid bundling FFmpeg.wasm until needed.
 * The encoder writes raw RGBA frames to the virtual filesystem
 * and then invokes FFmpeg to encode them into a video file.
 */
export function createFFmpegEncoder(): FFmpegEncoder {
	// biome-ignore lint/suspicious/noExplicitAny: FFmpeg types loaded dynamically
	let ffmpeg: any = null;
	let loaded = false;
	let cancelled = false;

	return {
		async load() {
			if (loaded) return;

			const { FFmpeg } = await import('@ffmpeg/ffmpeg');
			const { toBlobURL } = await import('@ffmpeg/util');

			ffmpeg = new FFmpeg();

			const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
			await ffmpeg.load({
				coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
				wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
			});

			loaded = true;
		},

		async writeFrame(frameData: Uint8Array, frameIndex: number) {
			if (!ffmpeg || cancelled) return;

			const paddedIndex = String(frameIndex).padStart(6, '0');
			await ffmpeg.writeFile(`frame_${paddedIndex}.rgba`, frameData);
		},

		async encode(
			settings: ExportSettings,
			width: number,
			height: number,
			totalFrames: number,
		): Promise<Uint8Array> {
			if (!ffmpeg) throw new Error('FFmpeg not loaded');
			if (cancelled) return new Uint8Array();

			const outputFile = settings.format === 'mp4' ? 'output.mp4' : 'output.webm';

			const args = [
				'-f',
				'rawvideo',
				'-pixel_format',
				'rgba',
				'-video_size',
				`${width}x${height}`,
				'-framerate',
				String(settings.fps),
				'-i',
				'frame_%06d.rgba',
			];

			if (settings.format === 'mp4') {
				args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '23');
			} else {
				args.push('-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-crf', '30', '-b:v', '0');
			}

			args.push('-frames:v', String(totalFrames), outputFile);

			await ffmpeg.run(args);

			const data = await ffmpeg.readFile(outputFile);

			// Clean up virtual filesystem
			for (let i = 0; i < totalFrames; i++) {
				const paddedIndex = String(i).padStart(6, '0');
				try {
					await ffmpeg.deleteFile(`frame_${paddedIndex}.rgba`);
				} catch {
					// File may already be cleaned up
				}
			}
			try {
				await ffmpeg.deleteFile(outputFile);
			} catch {
				// OK if already cleaned
			}

			return data instanceof Uint8Array ? data : new Uint8Array(data);
		},

		cancel() {
			cancelled = true;
			if (ffmpeg) {
				try {
					ffmpeg.terminate();
				} catch {
					// FFmpeg may already be terminated
				}
			}
		},

		isLoaded() {
			return loaded;
		},
	};
}
