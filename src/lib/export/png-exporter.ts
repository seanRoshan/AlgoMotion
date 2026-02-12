/**
 * PNG sequence exporter.
 *
 * Captures each frame as a PNG and provides them
 * as a collection for zip download.
 *
 * Spec reference: Section 6.9 (Export System)
 */

import type { ExportResolution, FrameSource } from './export-types';
import { RESOLUTION_MAP } from './export-types';

export interface PngSequenceSettings {
	resolution: ExportResolution;
	fps: number;
}

export interface PngFrame {
	filename: string;
	data: Uint8Array;
}

export interface PngExportCallbacks {
	onProgress: (frame: number, totalFrames: number) => void;
	onComplete: (frames: PngFrame[]) => void;
	onError: (error: Error) => void;
}

/**
 * Export an animation as a sequence of PNG frames.
 * Returns individual frame data for zip packaging.
 */
export function exportPngSequence(
	frameSource: FrameSource,
	settings: PngSequenceSettings,
	callbacks: PngExportCallbacks,
): void {
	const { width, height } = RESOLUTION_MAP[settings.resolution];
	const duration = frameSource.totalDuration();
	const totalFrames = Math.ceil(duration * settings.fps);

	if (totalFrames === 0) {
		callbacks.onError(new Error('Animation has no duration'));
		return;
	}

	const frames: PngFrame[] = [];

	for (let i = 0; i < totalFrames; i++) {
		const time = i / settings.fps;
		frameSource.seekTo(time);
		const frameData = frameSource.captureFrame(width, height);

		const paddedIndex = String(i + 1).padStart(4, '0');
		frames.push({
			filename: `frame_${paddedIndex}.png`,
			data: frameData,
		});

		callbacks.onProgress(i + 1, totalFrames);
	}

	callbacks.onComplete(frames);
}

/**
 * Export a single frame as a PNG snapshot.
 */
export function exportPngSnapshot(
	frameSource: FrameSource,
	resolution: ExportResolution,
	time: number,
): PngFrame {
	const { width, height } = RESOLUTION_MAP[resolution];
	frameSource.seekTo(time);
	const data = frameSource.captureFrame(width, height);

	return {
		filename: 'snapshot.png',
		data,
	};
}
