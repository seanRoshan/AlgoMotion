/**
 * Video export orchestrator.
 *
 * Captures frames from the animation renderer and feeds them
 * to an FFmpeg encoder to produce MP4 or WebM video files.
 * Uses dependency injection for both the frame source and
 * encoder, enabling unit tests without real canvas/FFmpeg.
 *
 * Spec reference: Section 6.9 (Export System)
 */

import type { ExportSettings, FFmpegEncoder, FrameSource } from './export-types';
import { RESOLUTION_MAP } from './export-types';

export interface ExportCallbacks {
	onProgress: (frame: number, totalFrames: number, etaSeconds: number | null) => void;
	onStatusChange: (status: string) => void;
	onComplete: (videoData: Uint8Array) => void;
	onError: (error: Error) => void;
}

export class VideoExporter {
	private encoder: FFmpegEncoder;
	private frameSource: FrameSource;
	private cancelled = false;

	constructor(encoder: FFmpegEncoder, frameSource: FrameSource) {
		this.encoder = encoder;
		this.frameSource = frameSource;
	}

	/**
	 * Run the full export pipeline:
	 * 1. Load FFmpeg (if needed)
	 * 2. Capture frames at target FPS
	 * 3. Encode to video
	 * 4. Return video data
	 */
	async export(settings: ExportSettings, callbacks: ExportCallbacks): Promise<void> {
		this.cancelled = false;
		const { width, height } = RESOLUTION_MAP[settings.resolution];
		const duration = this.frameSource.totalDuration();
		const totalFrames = Math.ceil(duration * settings.fps);

		if (totalFrames === 0) {
			callbacks.onError(new Error('Animation has no duration'));
			return;
		}

		// Step 1: Load FFmpeg
		if (!this.encoder.isLoaded()) {
			callbacks.onStatusChange('loading');
			await this.encoder.load();
		}

		if (this.cancelled) {
			callbacks.onStatusChange('cancelled');
			return;
		}

		// Step 2: Capture frames
		callbacks.onStatusChange('capturing');
		const startTime = Date.now();

		for (let i = 0; i < totalFrames; i++) {
			if (this.cancelled) {
				callbacks.onStatusChange('cancelled');
				return;
			}

			const time = i / settings.fps;
			this.frameSource.seekTo(time);
			const frameData = this.frameSource.captureFrame(width, height);
			await this.encoder.writeFrame(frameData, i);

			const elapsed = (Date.now() - startTime) / 1000;
			const framesPerSecond = (i + 1) / elapsed;
			const remainingFrames = totalFrames - (i + 1);
			const eta = framesPerSecond > 0 ? remainingFrames / framesPerSecond : null;

			callbacks.onProgress(i + 1, totalFrames, eta);
		}

		if (this.cancelled) {
			callbacks.onStatusChange('cancelled');
			return;
		}

		// Step 3: Encode
		callbacks.onStatusChange('encoding');
		const videoData = await this.encoder.encode(settings, width, height, totalFrames);

		if (this.cancelled) {
			callbacks.onStatusChange('cancelled');
			return;
		}

		callbacks.onStatusChange('done');
		callbacks.onComplete(videoData);
	}

	/**
	 * Cancel the current export.
	 */
	cancel(): void {
		this.cancelled = true;
		this.encoder.cancel();
	}

	/**
	 * Check if the export has been cancelled.
	 */
	isCancelled(): boolean {
		return this.cancelled;
	}
}
