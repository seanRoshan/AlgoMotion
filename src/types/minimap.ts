import type { Position } from './common';

/** Default minimap dimensions and styling */
export const MINIMAP_DEFAULTS = {
	width: 200,
	height: 150,
	padding: 0.1,
	margin: 16,
	backgroundColor: 0x111122,
	borderColor: 0x3a3a5a,
	viewportColor: 0x4488ff,
	elementColor: 0x6a6a8a,
	opacity: 0.9,
	borderWidth: 1,
	viewportBorderWidth: 1.5,
} as const;

/** Result of a hit test on the minimap */
export type MinimapHit =
	| { type: 'viewport' }
	| { type: 'map'; worldPosition: Position }
	| { type: 'none' };

/** Cached bounds used by the minimap renderer */
export interface MinimapBounds {
	/** Bounding box of all elements in world space (with padding) */
	worldBounds: { x: number; y: number; width: number; height: number };
	/** Scale factor from world to minimap coordinates */
	scale: number;
	/** Offset for centering content in the minimap */
	offsetX: number;
	offsetY: number;
}
