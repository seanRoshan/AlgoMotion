/**
 * Animated GIF exporter using modern-gif 2.x.
 *
 * Captures frames from the animation and encodes them
 * into an animated GIF with configurable FPS and quality.
 *
 * Spec reference: Section 6.9 (Export System)
 */

import type { ExportResolution, FrameSource } from './export-types';
import { RESOLUTION_MAP } from './export-types';

export interface GifSettings {
	resolution: ExportResolution;
	fps: number;
	/** Quality 1-30, lower = better quality but larger file */
	quality: number;
}

export interface GifExportCallbacks {
	onProgress: (frame: number, totalFrames: number) => void;
	onComplete: (gifData: Uint8Array) => void;
	onError: (error: Error) => void;
}

/**
 * Interface for the GIF encoder — injectable for testing.
 */
export interface GifEncoder {
	encode(frames: GifFrame[], width: number, height: number): Promise<Uint8Array>;
}

export interface GifFrame {
	data: Uint8Array;
	delay: number;
}

/**
 * Export an animation as an animated GIF.
 */
export async function exportGif(
	frameSource: FrameSource,
	settings: GifSettings,
	encoder: GifEncoder,
	callbacks: GifExportCallbacks,
): Promise<void> {
	const { width, height } = RESOLUTION_MAP[settings.resolution];
	const duration = frameSource.totalDuration();
	const totalFrames = Math.ceil(duration * settings.fps);
	const delay = Math.round(1000 / settings.fps);

	if (totalFrames === 0) {
		callbacks.onError(new Error('Animation has no duration'));
		return;
	}

	const frames: GifFrame[] = [];

	for (let i = 0; i < totalFrames; i++) {
		const time = i / settings.fps;
		frameSource.seekTo(time);
		const frameData = frameSource.captureFrame(width, height);
		frames.push({ data: frameData, delay });
		callbacks.onProgress(i + 1, totalFrames);
	}

	try {
		const gifData = await encoder.encode(frames, width, height);
		callbacks.onComplete(gifData);
	} catch (err) {
		callbacks.onError(err instanceof Error ? err : new Error(String(err)));
	}
}

/**
 * Create a real GIF encoder using modern-gif.
 */
export function createGifEncoder(): GifEncoder {
	return {
		async encode(frames: GifFrame[], width: number, height: number): Promise<Uint8Array> {
			const { encode } = await import('modern-gif');

			const gifFrames = frames.map((f) => ({
				data: f.data as unknown as ArrayBuffer,
				delay: f.delay,
			}));

			const result = await encode({
				width,
				height,
				frames: gifFrames,
			});

			return new Uint8Array(result);
		},
	};
}
