import type { CameraState, MinimapHit, Position } from '@/types';

export interface MinimapInteractionDeps {
	hitTest: (
		screenX: number,
		screenY: number,
		camera: CameraState,
		viewportWidth: number,
		viewportHeight: number,
	) => MinimapHit;
	minimapToWorld: (minimapX: number, minimapY: number) => Position;
	getViewportRect: (
		camera: CameraState,
		viewportWidth: number,
		viewportHeight: number,
	) => { x: number; y: number; width: number; height: number } | null;
	getMinimapScreenBounds: () => { x: number; y: number; width: number; height: number };
	setCamera: (camera: Partial<CameraState>) => void;
	getCamera: () => CameraState;
	getViewportSize: () => { width: number; height: number };
}

/**
 * Handles pointer interactions on the minimap overlay.
 *
 * - Click on map body: jump camera to center viewport on clicked world position
 * - Drag viewport rectangle: pan camera following the drag
 */
export class MinimapInteractionHandler {
	private deps: MinimapInteractionDeps;
	private _isDragging = false;
	private dragStartScreenX = 0;
	private dragStartScreenY = 0;
	private dragStartCameraX = 0;
	private dragStartCameraY = 0;

	constructor(deps: MinimapInteractionDeps) {
		this.deps = deps;
	}

	get isDragging(): boolean {
		return this._isDragging;
	}

	onPointerDown(e: PointerEvent): boolean {
		if (e.button !== 0) return false;

		const camera = this.deps.getCamera();
		const { width: vw, height: vh } = this.deps.getViewportSize();
		const hit = this.deps.hitTest(e.clientX, e.clientY, camera, vw, vh);

		if (hit.type === 'none') return false;

		e.preventDefault();
		e.stopPropagation();

		if (hit.type === 'viewport') {
			// Start dragging the viewport rectangle
			this._isDragging = true;
			this.dragStartScreenX = e.clientX;
			this.dragStartScreenY = e.clientY;
			this.dragStartCameraX = camera.x;
			this.dragStartCameraY = camera.y;
			return true;
		}

		if (hit.type === 'map') {
			// Jump camera to center on clicked world position
			const { zoom } = camera;
			this.deps.setCamera({
				x: -(hit.worldPosition.x * zoom) + vw / 2,
				y: -(hit.worldPosition.y * zoom) + vh / 2,
				zoom,
			});
			return true;
		}

		return false;
	}

	onPointerMove(e: PointerEvent): void {
		if (!this._isDragging) return;

		const camera = this.deps.getCamera();
		const minimapBounds = this.deps.getMinimapScreenBounds();

		// Convert screen delta to minimap-local delta
		const deltaScreenX = e.clientX - this.dragStartScreenX;
		const deltaScreenY = e.clientY - this.dragStartScreenY;

		// Get the bounds to convert minimap pixels to world units
		// Moving the viewport rect in the minimap means the camera moves in the opposite direction
		// minimapDelta / scale = worldDelta, cameraDelta = -worldDelta * zoom
		const startLocal = {
			x: this.dragStartScreenX - minimapBounds.x,
			y: this.dragStartScreenY - minimapBounds.y,
		};
		const currentLocal = {
			x: startLocal.x + deltaScreenX,
			y: startLocal.y + deltaScreenY,
		};

		const startWorld = this.deps.minimapToWorld(startLocal.x, startLocal.y);
		const currentWorld = this.deps.minimapToWorld(currentLocal.x, currentLocal.y);

		const worldDeltaX = currentWorld.x - startWorld.x;
		const worldDeltaY = currentWorld.y - startWorld.y;

		this.deps.setCamera({
			x: this.dragStartCameraX - worldDeltaX * camera.zoom,
			y: this.dragStartCameraY - worldDeltaY * camera.zoom,
			zoom: camera.zoom,
		});
	}

	onPointerUp(_e: PointerEvent): void {
		this._isDragging = false;
	}
}
