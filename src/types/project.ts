/**
 * User's theme preference.
 *
 * Spec reference: Section 8.1 (ProjectSettings.theme)
 */
export type ThemePreference = 'dark' | 'light' | 'system';

/**
 * Canvas background style options.
 */
export type BackgroundStyle = 'solid' | 'grid' | 'dots' | 'none';

/**
 * Per-project settings controlling canvas, playback, and display defaults.
 *
 * Spec reference: Section 8.1
 */
export interface ProjectSettings {
	canvasWidth: number;
	canvasHeight: number;
	backgroundColor: string;
	backgroundStyle: BackgroundStyle;
	gridSize: number;
	snapToGrid: boolean;
	/** Frames per second: 24, 30, or 60 */
	fps: number;
	defaultEasing: string;
	theme: ThemePreference;
}

/**
 * Top-level project metadata.
 * Dates stored as ISO 8601 strings for JSON serialization.
 *
 * Spec reference: Section 8.1
 */
export interface Project {
	id: string;
	name: string;
	description: string;
	/** Base64 data URL or remote URL */
	thumbnail: string;
	/** ISO 8601 timestamp */
	createdAt: string;
	/** ISO 8601 timestamp */
	updatedAt: string;
	userId: string;
	isPublic: boolean;
	tags: string[];
	settings: ProjectSettings;
	/** Ordered scene IDs — scenes stored separately in scene store */
	sceneIds: string[];
}
