/**
 * Tests for export store.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { useExportStore } from './export-store';

describe('export-store', () => {
	afterEach(() => {
		useExportStore.getState().reset();
		useExportStore.getState().setDialogOpen(false);
	});

	it('has correct initial state', () => {
		const state = useExportStore.getState();
		expect(state.settings.format).toBe('mp4');
		expect(state.settings.resolution).toBe('1080p');
		expect(state.settings.fps).toBe(30);
		expect(state.progress.status).toBe('idle');
		expect(state.progress.percentage).toBe(0);
		expect(state.resultUrl).toBeNull();
		expect(state.dialogOpen).toBe(false);
	});

	it('sets format', () => {
		useExportStore.getState().setFormat('webm');
		expect(useExportStore.getState().settings.format).toBe('webm');
	});

	it('sets resolution', () => {
		useExportStore.getState().setResolution('720p');
		expect(useExportStore.getState().settings.resolution).toBe('720p');
	});

	it('sets fps', () => {
		useExportStore.getState().setFps(60);
		expect(useExportStore.getState().settings.fps).toBe(60);
	});

	it('sets status', () => {
		useExportStore.getState().setStatus('capturing');
		expect(useExportStore.getState().progress.status).toBe('capturing');
	});

	it('updates progress with percentage and ETA', () => {
		useExportStore.getState().updateProgress(30, 90, 15.5);
		const progress = useExportStore.getState().progress;

		expect(progress.currentFrame).toBe(30);
		expect(progress.totalFrames).toBe(90);
		expect(progress.percentage).toBe(33);
		expect(progress.etaSeconds).toBe(15.5);
	});

	it('calculates percentage correctly at boundaries', () => {
		useExportStore.getState().updateProgress(90, 90, null);
		expect(useExportStore.getState().progress.percentage).toBe(100);

		useExportStore.getState().updateProgress(0, 90, null);
		expect(useExportStore.getState().progress.percentage).toBe(0);
	});

	it('handles zero total frames', () => {
		useExportStore.getState().updateProgress(0, 0, null);
		expect(useExportStore.getState().progress.percentage).toBe(0);
	});

	it('sets error with message', () => {
		useExportStore.getState().setError('FFmpeg failed to load');
		const progress = useExportStore.getState().progress;

		expect(progress.status).toBe('error');
		expect(progress.errorMessage).toBe('FFmpeg failed to load');
	});

	it('sets result URL', () => {
		useExportStore.getState().setResultUrl('blob:http://localhost/video.mp4');
		expect(useExportStore.getState().resultUrl).toBe('blob:http://localhost/video.mp4');
	});

	it('toggles dialog open state', () => {
		useExportStore.getState().setDialogOpen(true);
		expect(useExportStore.getState().dialogOpen).toBe(true);

		useExportStore.getState().setDialogOpen(false);
		expect(useExportStore.getState().dialogOpen).toBe(false);
	});

	it('resets progress and result but preserves settings', () => {
		useExportStore.getState().setFormat('webm');
		useExportStore.getState().setStatus('encoding');
		useExportStore.getState().updateProgress(50, 100, 10);
		useExportStore.getState().setResultUrl('blob:test');

		useExportStore.getState().reset();

		const state = useExportStore.getState();
		expect(state.progress.status).toBe('idle');
		expect(state.progress.percentage).toBe(0);
		expect(state.resultUrl).toBeNull();
		// Settings preserved
		expect(state.settings.format).toBe('webm');
	});
});
