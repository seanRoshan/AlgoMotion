/**
 * Tests for GIF exporter.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FrameSource } from './export-types';
import type { GifEncoder } from './gif-exporter';
import { createGifEncoder, exportGif } from './gif-exporter';

function createMockFrameSource(duration = 1.0): FrameSource {
	return {
		seekTo: vi.fn(),
		captureFrame: vi.fn(() => new Uint8Array(1280 * 720 * 4)),
		totalDuration: vi.fn(() => duration),
	};
}

function createMockGifEncoder(): GifEncoder {
	return {
		encode: vi.fn(async () => new Uint8Array([0x47, 0x49, 0x46])),
	};
}

describe('exportGif', () => {
	it('captures correct number of frames', async () => {
		const source = createMockFrameSource(1.0);
		const encoder = createMockGifEncoder();
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 10, quality: 10 }, encoder, callbacks);

		expect(source.captureFrame).toHaveBeenCalledTimes(10);
		expect(encoder.encode).toHaveBeenCalled();
	});

	it('reports progress for each frame', async () => {
		const source = createMockFrameSource(0.5);
		const encoder = createMockGifEncoder();
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 10, quality: 10 }, encoder, callbacks);

		expect(callbacks.onProgress).toHaveBeenCalledTimes(5);
		expect(callbacks.onProgress).toHaveBeenLastCalledWith(5, 5);
	});

	it('calls onComplete with GIF data', async () => {
		const source = createMockFrameSource(0.1);
		const encoder = createMockGifEncoder();
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 10, quality: 10 }, encoder, callbacks);

		expect(callbacks.onComplete).toHaveBeenCalledWith(new Uint8Array([0x47, 0x49, 0x46]));
	});

	it('calls onError for zero-duration animation', async () => {
		const source = createMockFrameSource(0);
		const encoder = createMockGifEncoder();
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 10, quality: 10 }, encoder, callbacks);

		expect(callbacks.onError).toHaveBeenCalled();
		expect(callbacks.onError.mock.calls[0][0].message).toContain('no duration');
	});

	it('calls onError when encoder fails', async () => {
		const source = createMockFrameSource(0.1);
		const encoder: GifEncoder = {
			encode: vi.fn(async () => {
				throw new Error('Encoding failed');
			}),
		};
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 10, quality: 10 }, encoder, callbacks);

		expect(callbacks.onError).toHaveBeenCalled();
		expect(callbacks.onError.mock.calls[0][0].message).toBe('Encoding failed');
	});

	it('passes correct frame delay based on FPS', async () => {
		const source = createMockFrameSource(0.1);
		const encoder = createMockGifEncoder();
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 24, quality: 10 }, encoder, callbacks);

		// delay = Math.round(1000 / 24) = 42ms
		const frames = (encoder.encode as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(frames[0].delay).toBe(42);
	});

	it('seeks to correct times', async () => {
		const source = createMockFrameSource(0.5);
		const encoder = createMockGifEncoder();
		const callbacks = { onProgress: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };

		await exportGif(source, { resolution: '720p', fps: 10, quality: 10 }, encoder, callbacks);

		expect(source.seekTo).toHaveBeenNthCalledWith(1, 0);
		expect(source.seekTo).toHaveBeenNthCalledWith(2, 0.1);
		expect(source.seekTo).toHaveBeenNthCalledWith(3, 0.2);
	});
});

describe('createGifEncoder', () => {
	it('creates encoder with encode method', () => {
		const encoder = createGifEncoder();
		expect(typeof encoder.encode).toBe('function');
	});
});
