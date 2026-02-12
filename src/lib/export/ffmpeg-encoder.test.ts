/**
 * Tests for FFmpeg encoder factory.
 */

import { describe, expect, it } from 'vitest';
import { createFFmpegEncoder } from './ffmpeg-encoder';

describe('createFFmpegEncoder', () => {
	it('creates an encoder with required interface', () => {
		const encoder = createFFmpegEncoder();

		expect(typeof encoder.load).toBe('function');
		expect(typeof encoder.writeFrame).toBe('function');
		expect(typeof encoder.encode).toBe('function');
		expect(typeof encoder.cancel).toBe('function');
		expect(typeof encoder.isLoaded).toBe('function');
	});

	it('starts as not loaded', () => {
		const encoder = createFFmpegEncoder();
		expect(encoder.isLoaded()).toBe(false);
	});

	it('cancel does not throw when not loaded', () => {
		const encoder = createFFmpegEncoder();
		expect(() => encoder.cancel()).not.toThrow();
	});

	it('writeFrame does not throw when not loaded', async () => {
		const encoder = createFFmpegEncoder();
		await expect(encoder.writeFrame(new Uint8Array(4), 0)).resolves.toBeUndefined();
	});

	it('encode throws when not loaded', async () => {
		const encoder = createFFmpegEncoder();
		await expect(
			encoder.encode({ format: 'mp4', resolution: '720p', fps: 30 }, 1280, 720, 1),
		).rejects.toThrow('FFmpeg not loaded');
	});
});
