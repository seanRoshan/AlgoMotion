/**
 * Tests for PNG sequence and snapshot exporter.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FrameSource } from './export-types';
import { exportPngSequence, exportPngSnapshot } from './png-exporter';

function createMockFrameSource(duration = 1.0): FrameSource {
	return {
		seekTo: vi.fn(),
		captureFrame: vi.fn(() => new Uint8Array(4)),
		totalDuration: vi.fn(() => duration),
	};
}

describe('exportPngSequence', () => {
	it('captures correct number of frames', () => {
		const source = createMockFrameSource(1.0);
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		exportPngSequence(source, { resolution: '720p', fps: 10 }, callbacks);

		expect(source.captureFrame).toHaveBeenCalledTimes(10);
	});

	it('generates correctly numbered filenames', () => {
		const source = createMockFrameSource(0.3);
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		exportPngSequence(source, { resolution: '720p', fps: 10 }, callbacks);

		const frames = callbacks.onComplete.mock.calls[0][0];
		expect(frames[0].filename).toBe('frame_0001.png');
		expect(frames[1].filename).toBe('frame_0002.png');
		expect(frames[2].filename).toBe('frame_0003.png');
	});

	it('reports progress for each frame', () => {
		const source = createMockFrameSource(0.5);
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		exportPngSequence(source, { resolution: '720p', fps: 10 }, callbacks);

		expect(callbacks.onProgress).toHaveBeenCalledTimes(5);
		expect(callbacks.onProgress).toHaveBeenLastCalledWith(5, 5);
	});

	it('calls onComplete with frame array', () => {
		const source = createMockFrameSource(0.2);
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		exportPngSequence(source, { resolution: '720p', fps: 10 }, callbacks);

		expect(callbacks.onComplete).toHaveBeenCalled();
		const frames = callbacks.onComplete.mock.calls[0][0];
		expect(frames).toHaveLength(2);
	});

	it('calls onError for zero-duration animation', () => {
		const source = createMockFrameSource(0);
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		exportPngSequence(source, { resolution: '720p', fps: 10 }, callbacks);

		expect(callbacks.onError).toHaveBeenCalled();
		expect(callbacks.onError.mock.calls[0][0].message).toContain('no duration');
	});

	it('uses correct resolution dimensions', () => {
		const source = createMockFrameSource(0.1);
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		exportPngSequence(source, { resolution: '1080p', fps: 10 }, callbacks);

		expect(source.captureFrame).toHaveBeenCalledWith(1920, 1080);
	});
});

describe('exportPngSnapshot', () => {
	it('captures a single frame at the specified time', () => {
		const source = createMockFrameSource(5.0);

		const frame = exportPngSnapshot(source, '1080p', 2.5);

		expect(source.seekTo).toHaveBeenCalledWith(2.5);
		expect(source.captureFrame).toHaveBeenCalledWith(1920, 1080);
		expect(frame.filename).toBe('snapshot.png');
	});

	it('returns frame data', () => {
		const source = createMockFrameSource(1.0);
		const frame = exportPngSnapshot(source, '720p', 0);

		expect(frame.data).toBeInstanceOf(Uint8Array);
	});
});
