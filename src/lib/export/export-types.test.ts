/**
 * Tests for export types and constants.
 */

import { describe, expect, it } from 'vitest';
import type {
	ExportFormat,
	ExportProgress,
	ExportResolution,
	ExportSettings,
	ExportStatus,
	FFmpegEncoder,
	FrameSource,
} from './export-types';
import { RESOLUTION_MAP } from './export-types';

describe('export-types', () => {
	it('exports RESOLUTION_MAP with 720p dimensions', () => {
		expect(RESOLUTION_MAP['720p']).toEqual({ width: 1280, height: 720 });
	});

	it('exports RESOLUTION_MAP with 1080p dimensions', () => {
		expect(RESOLUTION_MAP['1080p']).toEqual({ width: 1920, height: 1080 });
	});

	it('exports RESOLUTION_MAP with 4k dimensions', () => {
		expect(RESOLUTION_MAP['4k']).toEqual({ width: 3840, height: 2160 });
	});

	it('allows valid ExportFormat values', () => {
		const formats: ExportFormat[] = ['mp4', 'webm'];
		expect(formats).toHaveLength(2);
	});

	it('allows valid ExportResolution values', () => {
		const resolutions: ExportResolution[] = ['720p', '1080p', '4k'];
		expect(resolutions).toHaveLength(3);
	});

	it('allows valid ExportStatus values', () => {
		const statuses: ExportStatus[] = [
			'idle',
			'loading',
			'capturing',
			'encoding',
			'uploading',
			'done',
			'error',
			'cancelled',
		];
		expect(statuses).toHaveLength(8);
	});

	it('defines ExportSettings shape', () => {
		const settings: ExportSettings = {
			format: 'mp4',
			resolution: '1080p',
			fps: 30,
		};
		expect(settings.format).toBe('mp4');
		expect(settings.resolution).toBe('1080p');
		expect(settings.fps).toBe(30);
	});

	it('defines ExportProgress shape', () => {
		const progress: ExportProgress = {
			status: 'capturing',
			percentage: 50,
			currentFrame: 45,
			totalFrames: 90,
			etaSeconds: 12.5,
			errorMessage: null,
		};
		expect(progress.percentage).toBe(50);
		expect(progress.currentFrame).toBe(45);
	});

	it('defines FFmpegEncoder interface', () => {
		const encoder: FFmpegEncoder = {
			load: async () => {},
			writeFrame: async () => {},
			encode: async () => new Uint8Array(),
			cancel: () => {},
			isLoaded: () => false,
		};
		expect(encoder.isLoaded()).toBe(false);
	});

	it('defines FrameSource interface', () => {
		const source: FrameSource = {
			seekTo: () => {},
			captureFrame: () => new Uint8Array(4),
			totalDuration: () => 10,
		};
		expect(source.totalDuration()).toBe(10);
	});
});
