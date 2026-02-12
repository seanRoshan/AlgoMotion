/**
 * Tests for VideoExporter — full export pipeline.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FFmpegEncoder, FrameSource } from './export-types';
import { VideoExporter } from './video-exporter';

function createMockEncoder(overrides: Partial<FFmpegEncoder> = {}): FFmpegEncoder {
	return {
		load: vi.fn(async () => {}),
		writeFrame: vi.fn(async () => {}),
		encode: vi.fn(async () => new Uint8Array([1, 2, 3, 4])),
		cancel: vi.fn(),
		isLoaded: vi.fn(() => false),
		...overrides,
	};
}

function createMockFrameSource(duration = 1.0): FrameSource {
	return {
		seekTo: vi.fn(),
		captureFrame: vi.fn(() => new Uint8Array(1920 * 1080 * 4)),
		totalDuration: vi.fn(() => duration),
	};
}

function createCallbacks() {
	return {
		onProgress: vi.fn(),
		onStatusChange: vi.fn(),
		onComplete: vi.fn(),
		onError: vi.fn(),
	};
}

describe('VideoExporter', () => {
	it('loads FFmpeg if not loaded', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '1080p', fps: 30 }, callbacks);

		expect(encoder.load).toHaveBeenCalled();
	});

	it('skips loading if FFmpeg already loaded', async () => {
		const encoder = createMockEncoder({ isLoaded: vi.fn(() => true) });
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '1080p', fps: 30 }, callbacks);

		expect(encoder.load).not.toHaveBeenCalled();
	});

	it('captures correct number of frames', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(1.0);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		// 1 second at 30fps = 30 frames
		expect(encoder.writeFrame).toHaveBeenCalledTimes(30);
	});

	it('seeks to correct frame times', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		// 0.1s at 30fps = 3 frames: t=0, t=1/30, t=2/30
		expect(source.seekTo).toHaveBeenCalledTimes(3);
		expect(source.seekTo).toHaveBeenNthCalledWith(1, 0);
	});

	it('reports progress for each frame', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		// 3 frames total
		expect(callbacks.onProgress).toHaveBeenCalledTimes(3);
		// Last call should have frame = totalFrames
		const lastCall = callbacks.onProgress.mock.calls[2];
		expect(lastCall[0]).toBe(3); // current frame
		expect(lastCall[1]).toBe(3); // total frames
	});

	it('transitions through status stages', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		const statuses = callbacks.onStatusChange.mock.calls.map((c: string[]) => c[0]);
		expect(statuses).toContain('loading');
		expect(statuses).toContain('capturing');
		expect(statuses).toContain('encoding');
		expect(statuses).toContain('done');
	});

	it('calls encode with correct settings', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		const settings = { format: 'webm' as const, resolution: '4k' as const, fps: 60 as const };
		await exporter.export(settings, callbacks);

		expect(encoder.encode).toHaveBeenCalledWith(settings, 3840, 2160, expect.any(Number));
	});

	it('calls onComplete with video data', async () => {
		const videoData = new Uint8Array([10, 20, 30]);
		const encoder = createMockEncoder({
			encode: vi.fn(async () => videoData),
		});
		const source = createMockFrameSource(0.1);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		expect(callbacks.onComplete).toHaveBeenCalledWith(videoData);
	});

	it('calls onError for zero-duration animation', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(0);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		expect(callbacks.onError).toHaveBeenCalled();
		expect(callbacks.onError.mock.calls[0][0].message).toContain('no duration');
	});

	it('can be cancelled during frame capture', async () => {
		let frameCount = 0;
		const encoder = createMockEncoder({
			writeFrame: vi.fn(async () => {
				frameCount++;
			}),
		});
		const source = createMockFrameSource(10.0); // Long duration
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		// Cancel after a few frames
		callbacks.onProgress.mockImplementation((frame: number) => {
			if (frame >= 3) exporter.cancel();
		});

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		expect(frameCount).toBeLessThan(300); // Would be 300 frames for 10s
		expect(callbacks.onStatusChange).toHaveBeenCalledWith('cancelled');
	});

	it('isCancelled returns correct state', () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(1);
		const exporter = new VideoExporter(encoder, source);

		expect(exporter.isCancelled()).toBe(false);
		exporter.cancel();
		expect(exporter.isCancelled()).toBe(true);
	});

	it('calls encoder.cancel on cancel', () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(1);
		const exporter = new VideoExporter(encoder, source);

		exporter.cancel();
		expect(encoder.cancel).toHaveBeenCalled();
	});

	it('reports ETA based on frame processing rate', async () => {
		const encoder = createMockEncoder();
		const source = createMockFrameSource(1.0);
		const callbacks = createCallbacks();
		const exporter = new VideoExporter(encoder, source);

		await exporter.export({ format: 'mp4', resolution: '720p', fps: 30 }, callbacks);

		// Last frame should have ETA close to 0
		const lastCall = callbacks.onProgress.mock.calls[29];
		const eta = lastCall[2];
		// ETA at last frame should be very small or zero
		expect(eta).toBeLessThanOrEqual(1);
	});
});
