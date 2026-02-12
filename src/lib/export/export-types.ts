/**
 * Types for the video/image export pipeline.
 *
 * Spec reference: Section 6.9 (Export System)
 */

export type ExportFormat = 'mp4' | 'webm';

export type ExportResolution = '720p' | '1080p' | '4k';

export type ExportStatus =
	| 'idle'
	| 'loading'
	| 'capturing'
	| 'encoding'
	| 'uploading'
	| 'done'
	| 'error'
	| 'cancelled';

export interface ExportSettings {
	format: ExportFormat;
	resolution: ExportResolution;
	fps: 24 | 30 | 60;
}

export interface ExportProgress {
	status: ExportStatus;
	/** 0-100 percentage */
	percentage: number;
	/** Current frame being processed */
	currentFrame: number;
	/** Total frames to process */
	totalFrames: number;
	/** Estimated time remaining in seconds */
	etaSeconds: number | null;
	/** Error message if status is 'error' */
	errorMessage: string | null;
}

export const RESOLUTION_MAP: Record<ExportResolution, { width: number; height: number }> = {
	'720p': { width: 1280, height: 720 },
	'1080p': { width: 1920, height: 1080 },
	'4k': { width: 3840, height: 2160 },
};

/**
 * Interface for the FFmpeg encoder — injectable for testing.
 * The real implementation wraps FFmpeg.wasm.
 */
export interface FFmpegEncoder {
	/** Load the FFmpeg.wasm binary (lazy, one-time) */
	load(): Promise<void>;
	/** Write a single frame (raw RGBA pixels) */
	writeFrame(frameData: Uint8Array, frameIndex: number): Promise<void>;
	/** Encode all written frames into a video file */
	encode(
		settings: ExportSettings,
		width: number,
		height: number,
		totalFrames: number,
	): Promise<Uint8Array>;
	/** Cancel the current operation */
	cancel(): void;
	/** Whether FFmpeg is loaded */
	isLoaded(): boolean;
}

/**
 * Interface for capturing frames from the renderer.
 * Injectable for testing without a real canvas.
 */
export interface FrameSource {
	/** Seek the animation to a specific time */
	seekTo(time: number): void;
	/** Render the current frame and return raw RGBA pixel data */
	captureFrame(width: number, height: number): Uint8Array;
	/** Total animation duration in seconds */
	totalDuration(): number;
}
