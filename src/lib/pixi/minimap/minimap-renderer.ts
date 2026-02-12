import type { Container, Graphics } from 'pixi.js';
import type { CameraState, MinimapBounds, MinimapHit, Position, SceneElement } from '@/types';
import { MINIMAP_DEFAULTS } from '@/types';

export interface MinimapRenderOptions {
	elements: Record<string, SceneElement>;
	elementIds: string[];
	camera: CameraState;
	viewportWidth: number;
	viewportHeight: number;
	minimapWidth: number;
	minimapHeight: number;
}

/**
 * Renders a minimap overlay showing a thumbnail of the full scene
 * with a viewport indicator rectangle.
 *
 * Follows the same imperative pattern as GridRenderer — Graphics objects
 * are created by SceneManager and injected via setGraphics().
 *
 * Spec reference: Section 6.1 (minimap overlay)
 */
export class MinimapRenderer {
	private container: Container | null = null;
	private backgroundGfx: Graphics | null = null;
	private elementsGfx: Graphics | null = null;
	private viewportGfx: Graphics | null = null;

	private _bounds: MinimapBounds | null = null;
	private _screenBounds = { x: 0, y: 0, width: 0, height: 0 };

	setGraphics(
		container: Container,
		background: Graphics,
		elements: Graphics,
		viewport: Graphics,
	): void {
		this.container = container;
		this.backgroundGfx = background;
		this.elementsGfx = elements;
		this.viewportGfx = viewport;
	}

	computeWorldBounds(
		elements: Record<string, SceneElement>,
		elementIds: string[],
		minimapWidth: number = MINIMAP_DEFAULTS.width,
		minimapHeight: number = MINIMAP_DEFAULTS.height,
	): MinimapBounds {
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (const id of elementIds) {
			const el = elements[id];
			if (!el || !el.visible) continue;
			minX = Math.min(minX, el.position.x);
			minY = Math.min(minY, el.position.y);
			maxX = Math.max(maxX, el.position.x + el.size.width);
			maxY = Math.max(maxY, el.position.y + el.size.height);
		}

		// Default bounds for empty scene
		if (!Number.isFinite(minX)) {
			minX = -500;
			minY = -500;
			maxX = 500;
			maxY = 500;
		}

		const contentWidth = maxX - minX;
		const contentHeight = maxY - minY;
		const padX = contentWidth * MINIMAP_DEFAULTS.padding;
		const padY = contentHeight * MINIMAP_DEFAULTS.padding;

		const worldBounds = {
			x: minX - padX,
			y: minY - padY,
			width: contentWidth + 2 * padX,
			height: contentHeight + 2 * padY,
		};

		const scaleX = minimapWidth / worldBounds.width;
		const scaleY = minimapHeight / worldBounds.height;
		const scale = Math.min(scaleX, scaleY);

		// Center content in minimap
		const renderedWidth = worldBounds.width * scale;
		const renderedHeight = worldBounds.height * scale;
		const offsetX = (minimapWidth - renderedWidth) / 2;
		const offsetY = (minimapHeight - renderedHeight) / 2;

		this._bounds = { worldBounds, scale, offsetX, offsetY };
		return this._bounds;
	}

	render(options: MinimapRenderOptions): void {
		if (!this.backgroundGfx || !this.elementsGfx || !this.viewportGfx || !this.container) {
			throw new Error('Graphics not set. Call setGraphics() first.');
		}

		const {
			elements,
			elementIds,
			camera,
			viewportWidth,
			viewportHeight,
			minimapWidth,
			minimapHeight,
		} = options;

		// Position container at bottom-right
		const posX = viewportWidth - minimapWidth - MINIMAP_DEFAULTS.margin;
		const posY = viewportHeight - minimapHeight - MINIMAP_DEFAULTS.margin;
		this.container.position.set(posX, posY);
		this._screenBounds = { x: posX, y: posY, width: minimapWidth, height: minimapHeight };

		// Compute bounds from elements
		this.computeWorldBounds(elements, elementIds, minimapWidth, minimapHeight);

		// Draw background
		this.backgroundGfx.clear();
		this.backgroundGfx
			.rect(0, 0, minimapWidth, minimapHeight)
			.fill({ color: MINIMAP_DEFAULTS.backgroundColor, alpha: MINIMAP_DEFAULTS.opacity });
		this.backgroundGfx
			.rect(0, 0, minimapWidth, minimapHeight)
			.stroke({ color: MINIMAP_DEFAULTS.borderColor, width: MINIMAP_DEFAULTS.borderWidth });

		// Draw element thumbnails
		this.elementsGfx.clear();
		if (this._bounds && elementIds.length > 0) {
			for (const id of elementIds) {
				const el = elements[id];
				if (!el || !el.visible) continue;

				const mx = this.worldToMinimapLocal(el.position.x, el.position.y);
				const mw = el.size.width * this._bounds.scale;
				const mh = el.size.height * this._bounds.scale;

				this.elementsGfx.rect(mx.x, mx.y, Math.max(2, mw), Math.max(2, mh));
			}
			this.elementsGfx.fill({ color: MINIMAP_DEFAULTS.elementColor, alpha: 0.7 });
		}

		// Draw viewport rectangle
		this.viewportGfx.clear();
		const vpRect = this.getViewportRect(camera, viewportWidth, viewportHeight);
		if (vpRect) {
			this.viewportGfx.rect(vpRect.x, vpRect.y, vpRect.width, vpRect.height).stroke({
				color: MINIMAP_DEFAULTS.viewportColor,
				width: MINIMAP_DEFAULTS.viewportBorderWidth,
				alpha: 0.8,
			});
		}
	}

	worldToMinimap(worldX: number, worldY: number): Position {
		if (!this._bounds) return { x: 0, y: 0 };
		return this.worldToMinimapLocal(worldX, worldY);
	}

	minimapToWorld(minimapX: number, minimapY: number): Position {
		if (!this._bounds) return { x: 0, y: 0 };
		const { worldBounds, scale, offsetX, offsetY } = this._bounds;
		return {
			x: (minimapX - offsetX) / scale + worldBounds.x,
			y: (minimapY - offsetY) / scale + worldBounds.y,
		};
	}

	hitTest(
		screenX: number,
		screenY: number,
		camera: CameraState,
		viewportWidth: number,
		viewportHeight: number,
	): MinimapHit {
		const { x: mx, y: my, width: mw, height: mh } = this._screenBounds;

		// Check if inside minimap bounds
		if (screenX < mx || screenX > mx + mw || screenY < my || screenY > my + mh) {
			return { type: 'none' };
		}

		// Local coordinates within minimap
		const localX = screenX - mx;
		const localY = screenY - my;

		// Check viewport rect
		const vpRect = this.getViewportRect(camera, viewportWidth, viewportHeight);
		if (vpRect) {
			if (
				localX >= vpRect.x &&
				localX <= vpRect.x + vpRect.width &&
				localY >= vpRect.y &&
				localY <= vpRect.y + vpRect.height
			) {
				return { type: 'viewport' };
			}
		}

		// Inside minimap but outside viewport rect
		const worldPos = this.minimapToWorld(localX, localY);
		return { type: 'map', worldPosition: worldPos };
	}

	getViewportRect(
		camera: CameraState,
		viewportWidth: number,
		viewportHeight: number,
	): { x: number; y: number; width: number; height: number } | null {
		if (!this._bounds) return null;

		// The camera shows world coords from screenToWorld(0,0) to screenToWorld(vw,vh)
		const worldTopLeftX = -camera.x / camera.zoom;
		const worldTopLeftY = -camera.y / camera.zoom;
		const worldVpWidth = viewportWidth / camera.zoom;
		const worldVpHeight = viewportHeight / camera.zoom;

		const topLeft = this.worldToMinimapLocal(worldTopLeftX, worldTopLeftY);
		const vpW = worldVpWidth * this._bounds.scale;
		const vpH = worldVpHeight * this._bounds.scale;

		return { x: topLeft.x, y: topLeft.y, width: vpW, height: vpH };
	}

	getMinimapScreenBounds(): { x: number; y: number; width: number; height: number } {
		return { ...this._screenBounds };
	}

	getBounds(): MinimapBounds | null {
		return this._bounds;
	}

	private worldToMinimapLocal(worldX: number, worldY: number): Position {
		// biome-ignore lint/style/noNonNullAssertion: Only called after _bounds is set by computeWorldBounds
		const { worldBounds, scale, offsetX, offsetY } = this._bounds!;
		return {
			x: (worldX - worldBounds.x) * scale + offsetX,
			y: (worldY - worldBounds.y) * scale + offsetY,
		};
	}
}
