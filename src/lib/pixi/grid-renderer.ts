import type { Graphics } from 'pixi.js';
import type { CameraState } from '@/types';
import type { BackgroundMode } from './scene-manager';

export interface GridRenderOptions {
	mode: BackgroundMode;
	viewportWidth: number;
	viewportHeight: number;
	camera: CameraState;
	gridSize: number;
	color: number;
}

/**
 * Renders the canvas background grid (dots or lines).
 * Grid is drawn in screen space but aligned to world-space grid lines,
 * so it moves with the camera and scales with zoom.
 *
 * The Graphics object is created by SceneManager (which owns the pixi.js
 * dynamic import) and passed in via setGraphics().
 *
 * Spec reference: Section 6.1 (grid system)
 */
export class GridRenderer {
	private graphics: Graphics | null = null;

	/**
	 * Set the Graphics display object. Called by SceneManager after
	 * pixi.js is dynamically imported.
	 */
	setGraphics(graphics: Graphics): void {
		this.graphics = graphics;
	}

	/**
	 * Render the grid onto the stored Graphics object and return it.
	 */
	render(options: GridRenderOptions): Graphics {
		const g = this.graphics;
		if (!g) throw new Error('Graphics not set. Call setGraphics() first.');

		g.clear();

		if (options.mode === 'none') return g;

		if (options.mode === 'dots') {
			this.renderDots(g, options);
		} else {
			this.renderLines(g, options);
		}

		return g;
	}

	private renderDots(g: Graphics, options: GridRenderOptions): void {
		const { viewportWidth, viewportHeight, camera, gridSize, color } = options;

		const effectiveSpacing = this.getEffectiveSpacing(gridSize, camera.zoom);
		const dotRadius = Math.max(1, 1.5 * Math.min(1, camera.zoom));

		// Calculate visible grid bounds in world coordinates
		const startX = Math.floor(-camera.x / camera.zoom / effectiveSpacing) * effectiveSpacing;
		const startY = Math.floor(-camera.y / camera.zoom / effectiveSpacing) * effectiveSpacing;
		const endX = startX + viewportWidth / camera.zoom + effectiveSpacing;
		const endY = startY + viewportHeight / camera.zoom + effectiveSpacing;

		for (let wx = startX; wx <= endX; wx += effectiveSpacing) {
			for (let wy = startY; wy <= endY; wy += effectiveSpacing) {
				const sx = wx * camera.zoom + camera.x;
				const sy = wy * camera.zoom + camera.y;
				g.circle(sx, sy, dotRadius);
			}
		}

		g.fill({ color, alpha: 0.4 });
	}

	private renderLines(g: Graphics, options: GridRenderOptions): void {
		const { viewportWidth, viewportHeight, camera, gridSize, color } = options;

		const effectiveSpacing = this.getEffectiveSpacing(gridSize, camera.zoom);
		const lineAlpha = Math.min(0.3, 0.15 * camera.zoom);

		const startX = Math.floor(-camera.x / camera.zoom / effectiveSpacing) * effectiveSpacing;
		const startY = Math.floor(-camera.y / camera.zoom / effectiveSpacing) * effectiveSpacing;
		const endX = startX + viewportWidth / camera.zoom + effectiveSpacing;
		const endY = startY + viewportHeight / camera.zoom + effectiveSpacing;

		// Vertical lines
		for (let wx = startX; wx <= endX; wx += effectiveSpacing) {
			const sx = wx * camera.zoom + camera.x;
			g.moveTo(sx, 0);
			g.lineTo(sx, viewportHeight);
		}

		// Horizontal lines
		for (let wy = startY; wy <= endY; wy += effectiveSpacing) {
			const sy = wy * camera.zoom + camera.y;
			g.moveTo(0, sy);
			g.lineTo(viewportWidth, sy);
		}

		g.stroke({ width: 1, color, alpha: lineAlpha });
	}

	/**
	 * Adaptive grid spacing — doubles spacing when grid lines
	 * would be too close together on screen.
	 */
	private getEffectiveSpacing(baseSize: number, zoom: number): number {
		let spacing = baseSize;

		while (spacing * zoom < 10) {
			spacing *= 2;
		}

		return spacing;
	}
}
