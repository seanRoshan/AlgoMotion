/**
 * Zustand store for video export state.
 *
 * Tracks export progress, settings, and the exported file.
 * Uses Record<> (not Map/Set) per project conventions.
 *
 * Spec reference: Section 6.9 (Export System)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
	ExportFormat,
	ExportProgress,
	ExportResolution,
	ExportSettings,
	ExportStatus,
} from '@/lib/export/export-types';

interface ExportState {
	settings: ExportSettings;
	progress: ExportProgress;
	/** URL of the exported file (blob URL or signed URL) */
	resultUrl: string | null;
	/** Whether the export dialog is open */
	dialogOpen: boolean;
}

interface ExportActions {
	setFormat: (format: ExportFormat) => void;
	setResolution: (resolution: ExportResolution) => void;
	setFps: (fps: 24 | 30 | 60) => void;
	setStatus: (status: ExportStatus) => void;
	updateProgress: (frame: number, totalFrames: number, etaSeconds: number | null) => void;
	setError: (message: string) => void;
	setResultUrl: (url: string | null) => void;
	setDialogOpen: (open: boolean) => void;
	reset: () => void;
}

const initialProgress: ExportProgress = {
	status: 'idle',
	percentage: 0,
	currentFrame: 0,
	totalFrames: 0,
	etaSeconds: null,
	errorMessage: null,
};

const initialSettings: ExportSettings = {
	format: 'mp4',
	resolution: '1080p',
	fps: 30,
};

export const useExportStore = create<ExportState & ExportActions>()(
	devtools(
		immer((set) => ({
			settings: { ...initialSettings },
			progress: { ...initialProgress },
			resultUrl: null,
			dialogOpen: false,

			setFormat: (format) => {
				set((state) => {
					state.settings.format = format;
				});
			},

			setResolution: (resolution) => {
				set((state) => {
					state.settings.resolution = resolution;
				});
			},

			setFps: (fps) => {
				set((state) => {
					state.settings.fps = fps;
				});
			},

			setStatus: (status) => {
				set((state) => {
					state.progress.status = status;
				});
			},

			updateProgress: (frame, totalFrames, etaSeconds) => {
				set((state) => {
					state.progress.currentFrame = frame;
					state.progress.totalFrames = totalFrames;
					state.progress.percentage = totalFrames > 0 ? Math.round((frame / totalFrames) * 100) : 0;
					state.progress.etaSeconds = etaSeconds;
				});
			},

			setError: (message) => {
				set((state) => {
					state.progress.status = 'error';
					state.progress.errorMessage = message;
				});
			},

			setResultUrl: (url) => {
				set((state) => {
					state.resultUrl = url;
				});
			},

			setDialogOpen: (open) => {
				set((state) => {
					state.dialogOpen = open;
				});
			},

			reset: () => {
				set((state) => {
					state.progress = { ...initialProgress };
					state.resultUrl = null;
				});
			},
		})),
		{ name: 'export-store' },
	),
);
