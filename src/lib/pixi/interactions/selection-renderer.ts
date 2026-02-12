import type { SceneElement } from '@/types';
import {
	HANDLE_FILL_COLOR,
	HANDLE_SIZE,
	HANDLE_STROKE_COLOR,
	MARQUEE_FILL_ALPHA,
	MARQUEE_FILL_COLOR,
	MARQUEE_STROKE_ALPHA,
	MARQUEE_STROKE_COLOR,
	ROTATION_HANDLE_DISTANCE,
	SELECTION_STROKE_COLOR,
} from './interaction-constants';
import type { HandlePosition } from './interaction-state';
import { computeBoundingBox, getHandlePosition } from './interaction-state';

/**
 * Minimal Pixi.js interfaces for dependency injection (same pattern as ElementRenderer).
 */
interface PixiGraphics {
	clear(): PixiGraphics;
	rect(x: number, y: number, w: number, h: number): PixiGraphics;
	circle(x: number, y: number, r: number): PixiGraphics;
	fill(opts: { color: number; alpha?: number } | number): PixiGraphics;
	stroke(opts: { width: number; color: number; alpha?: number }): PixiGraphics;
	moveTo(x: number, y: number): PixiGraphics;
	lineTo(x: number, y: number): PixiGraphics;
	destroy(): void;
}

interface PixiContainer {
	addChild(...children: unknown[]): void;
	removeChildren(): void;
	destroy(options?: { children: boolean }): void;
	children: unknown[];
}

interface PixiModule {
	Graphics: new () => PixiGraphics;
}

const RESIZE_HANDLES: HandlePosition[] = [
	'top-left',
	'top-center',
	'top-right',
	'middle-left',
	'middle-right',
	'bottom-left',
	'bottom-center',
	'bottom-right',
];

/**
 * Renders selection visuals (bounding boxes, resize handles, rotation handle, marquee)
 * on the selectionLayer.
 */
export class SelectionRenderer {
	private pixi: PixiModule;
	private selectionLayer: PixiContainer;
	private graphics: PixiGraphics | null = null;
	private marqueeGraphics: PixiGraphics | null = null;

	constructor(pixi: PixiModule, selectionLayer: PixiContainer) {
		this.pixi = pixi;
		this.selectionLayer = selectionLayer;
	}

	/**
	 * Render selection overlay for all selected elements.
	 */
	render(selectedIds: string[], elements: Record<string, SceneElement>, cameraZoom: number): void {
		// Clear previous selection graphics
		if (this.graphics) {
			this.graphics.destroy();
		}
		this.graphics = new this.pixi.Graphics();

		if (selectedIds.length === 0) {
			this.selectionLayer.addChild(this.graphics);
			return;
		}

		const selectedElements = selectedIds
			.map((id) => elements[id])
			.filter((el): el is SceneElement => el !== undefined);

		if (selectedElements.length === 0) {
			this.selectionLayer.addChild(this.graphics);
			return;
		}

		const g = this.graphics;
		const strokeWidth = 1 / cameraZoom; // constant screen-space width
		const handleSize = HANDLE_SIZE / cameraZoom;

		// Draw individual bounding boxes for each selected element
		for (const el of selectedElements) {
			g.rect(el.position.x, el.position.y, el.size.width, el.size.height);
			g.stroke({ width: strokeWidth, color: SELECTION_STROKE_COLOR });
		}

		// Compute combined bounding box
		const bounds = computeBoundingBox(selectedElements);

		// Draw resize handles
		for (const handle of RESIZE_HANDLES) {
			const pos = getHandlePosition(handle, bounds);
			g.rect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
			g.fill({ color: HANDLE_FILL_COLOR });
			g.stroke({ width: strokeWidth, color: HANDLE_STROKE_COLOR });
		}

		// Draw rotation handle
		const rotHandleDistance = ROTATION_HANDLE_DISTANCE / cameraZoom;
		const topCenter = getHandlePosition('top-center', bounds);
		const rotY = topCenter.y - rotHandleDistance;

		// Connection line from top-center to rotation handle
		g.moveTo(topCenter.x, topCenter.y);
		g.lineTo(topCenter.x, rotY);
		g.stroke({ width: strokeWidth, color: HANDLE_STROKE_COLOR });

		// Rotation handle circle
		g.circle(topCenter.x, rotY, handleSize / 2);
		g.fill({ color: HANDLE_FILL_COLOR });
		g.stroke({ width: strokeWidth, color: HANDLE_STROKE_COLOR });

		this.selectionLayer.addChild(g);
	}

	/**
	 * Draw the marquee selection rectangle.
	 */
	renderMarquee(startX: number, startY: number, endX: number, endY: number): void {
		if (this.marqueeGraphics) {
			this.marqueeGraphics.destroy();
		}
		this.marqueeGraphics = new this.pixi.Graphics();

		const x = Math.min(startX, endX);
		const y = Math.min(startY, endY);
		const w = Math.abs(endX - startX);
		const h = Math.abs(endY - startY);

		const g = this.marqueeGraphics;
		g.rect(x, y, w, h);
		g.fill({ color: MARQUEE_FILL_COLOR, alpha: MARQUEE_FILL_ALPHA });
		g.stroke({ width: 1, color: MARQUEE_STROKE_COLOR, alpha: MARQUEE_STROKE_ALPHA });

		this.selectionLayer.addChild(g);
	}

	/**
	 * Clear the marquee rectangle.
	 */
	clearMarquee(): void {
		if (this.marqueeGraphics) {
			this.marqueeGraphics.destroy();
			this.marqueeGraphics = null;
		}
	}

	/**
	 * Clear all selection visuals.
	 */
	clear(): void {
		if (this.graphics) {
			this.graphics.destroy();
			this.graphics = null;
		}
		this.clearMarquee();
	}

	/**
	 * Destroy and clean up.
	 */
	destroy(): void {
		this.clear();
	}
}
