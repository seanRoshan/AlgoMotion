import {
	GUIDE_ALPHA,
	GUIDE_COLOR,
	GUIDE_DASH_LENGTH,
	GUIDE_GAP_LENGTH,
} from './interaction-constants';
import type { AlignmentGuide } from './snap-engine';

/**
 * Minimal Pixi.js interfaces for dependency injection (same pattern as SelectionRenderer).
 */
interface PixiGraphics {
	clear(): PixiGraphics;
	moveTo(x: number, y: number): PixiGraphics;
	lineTo(x: number, y: number): PixiGraphics;
	stroke(opts: { width: number; color: number; alpha?: number }): PixiGraphics;
	destroy(): void;
}

interface PixiContainer {
	addChild(...children: unknown[]): void;
	removeChild(...children: unknown[]): void;
	children: unknown[];
}

interface PixiModule {
	Graphics: new () => PixiGraphics;
}

/**
 * Renders alignment guide lines on the selection layer during drag.
 * Uses manual dashed-line drawing since Pixi.js 8 has no native dash support.
 *
 * Follows the same Pixi.js DI pattern as SelectionRenderer.
 *
 * Spec reference: Section 6.1 (alignment guides — thin blue dashed lines)
 */
export class AlignmentGuideRenderer {
	private pixi: PixiModule;
	private selectionLayer: PixiContainer;
	private graphics: PixiGraphics | null = null;

	constructor(pixi: PixiModule, selectionLayer: PixiContainer) {
		this.pixi = pixi;
		this.selectionLayer = selectionLayer;
	}

	/**
	 * Render alignment guide lines. Called every frame during drag.
	 */
	render(guides: AlignmentGuide[], cameraZoom: number): void {
		this.clear();

		if (guides.length === 0) return;

		this.graphics = new this.pixi.Graphics();
		const g = this.graphics;
		const strokeWidth = 1 / cameraZoom;
		const dashLength = GUIDE_DASH_LENGTH / cameraZoom;
		const gapLength = GUIDE_GAP_LENGTH / cameraZoom;

		for (const guide of guides) {
			if (guide.axis === 'vertical') {
				this.drawDashedLine(
					g,
					guide.position,
					guide.start,
					guide.position,
					guide.end,
					dashLength,
					gapLength,
				);
			} else {
				this.drawDashedLine(
					g,
					guide.start,
					guide.position,
					guide.end,
					guide.position,
					dashLength,
					gapLength,
				);
			}
		}

		g.stroke({ width: strokeWidth, color: GUIDE_COLOR, alpha: GUIDE_ALPHA });
		this.selectionLayer.addChild(g);
	}

	/**
	 * Clear all guide graphics.
	 */
	clear(): void {
		if (this.graphics) {
			this.selectionLayer.removeChild(this.graphics);
			this.graphics.destroy();
			this.graphics = null;
		}
	}

	/**
	 * Destroy and clean up.
	 */
	destroy(): void {
		this.clear();
	}

	/**
	 * Draw a dashed line between two points using moveTo/lineTo segments.
	 */
	private drawDashedLine(
		g: PixiGraphics,
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		dashLen: number,
		gapLen: number,
	): void {
		const dx = x1 - x0;
		const dy = y1 - y0;
		const totalLength = Math.sqrt(dx * dx + dy * dy);

		if (totalLength === 0) return;

		const ux = dx / totalLength;
		const uy = dy / totalLength;
		let drawn = 0;
		let drawing = true;

		while (drawn < totalLength) {
			const segLen = drawing
				? Math.min(dashLen, totalLength - drawn)
				: Math.min(gapLen, totalLength - drawn);

			if (drawing) {
				g.moveTo(x0 + ux * drawn, y0 + uy * drawn);
				g.lineTo(x0 + ux * (drawn + segLen), y0 + uy * (drawn + segLen));
			}

			drawn += segLen;
			drawing = !drawing;
		}
	}
}
