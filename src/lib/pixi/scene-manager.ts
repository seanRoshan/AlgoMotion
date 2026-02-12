import type { Application, Container, ContainerChild } from 'pixi.js';
import type { CameraState, SceneElement } from '@/types';
import { GridRenderer } from './grid-renderer';
import { ElementRenderer } from './renderers/element-renderer';

export type BackgroundMode = 'dots' | 'lines' | 'none';

export interface SceneManagerOptions {
	container: HTMLElement;
	backgroundColor?: number;
	backgroundMode?: BackgroundMode;
	gridSize?: number;
	gridColor?: number;
	minZoom?: number;
	maxZoom?: number;
}

/**
 * Imperative Pixi.js scene graph manager.
 * This is the core canvas engine — React handles UI chrome only.
 *
 * Layers (bottom to top):
 * 1. Grid layer (dots or lines background)
 * 2. World container (all scene elements, connections)
 * 3. Selection overlay (selection rectangles, handles)
 *
 * Spec reference: Section 5, 6.1
 */
export class SceneManager {
	private app: Application | null = null;
	private worldContainer: Container | null = null;
	private gridLayer: Container | null = null;
	private selectionLayer: Container | null = null;
	private gridRenderer: GridRenderer | null = null;
	private elementRenderer: ElementRenderer | null = null;
	private resizeObserver: ResizeObserver | null = null;

	private _camera: CameraState = { x: 0, y: 0, zoom: 1 };
	private _backgroundMode: BackgroundMode = 'dots';
	private _gridSize = 20;
	private _gridColor = 0x3a3a4a;
	private _minZoom = 0.1;
	private _maxZoom = 5;

	private isPanning = false;
	private panStartX = 0;
	private panStartY = 0;
	private cameraStartX = 0;
	private cameraStartY = 0;

	private container: HTMLElement | null = null;
	private onCameraChange: ((camera: CameraState) => void) | null = null;

	get camera(): CameraState {
		return { ...this._camera };
	}

	get initialized(): boolean {
		return this.app !== null;
	}

	get worldRoot(): Container | null {
		return this.worldContainer;
	}

	/**
	 * Initialize the Pixi.js application. Must be called once.
	 * Uses dynamic import to avoid SSR issues.
	 */
	async init(options: SceneManagerOptions): Promise<void> {
		const { Application, Container, Graphics, Text, TextStyle } = await import('pixi.js');

		this.container = options.container;
		this._backgroundMode = options.backgroundMode ?? 'dots';
		this._gridSize = options.gridSize ?? 20;
		this._gridColor = options.gridColor ?? 0x3a3a4a;
		this._minZoom = options.minZoom ?? 0.1;
		this._maxZoom = options.maxZoom ?? 5;

		const app = new Application();
		await app.init({
			backgroundColor: options.backgroundColor ?? 0x1a1a2e,
			antialias: true,
			resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
			preference: 'webgpu',
			autoDensity: true,
			resizeTo: options.container,
		});

		this.app = app;
		options.container.appendChild(app.canvas);

		// Build layer structure
		this.gridLayer = new Container();
		this.gridLayer.label = 'grid';
		app.stage.addChild(this.gridLayer);

		this.worldContainer = new Container();
		this.worldContainer.label = 'world';
		app.stage.addChild(this.worldContainer);

		this.selectionLayer = new Container();
		this.selectionLayer.label = 'selection';
		app.stage.addChild(this.selectionLayer);

		// Enable culling on world container for performance
		this.worldContainer.cullable = true;

		// Initialize grid renderer with a Graphics object
		this.gridRenderer = new GridRenderer();
		this.gridRenderer.setGraphics(new Graphics());

		// Initialize element renderer with Pixi.js classes (dependency injection).
		// ElementRenderer uses minimal interfaces for testability; real Pixi.js
		// classes satisfy these contracts at runtime.
		this.elementRenderer = new ElementRenderer({
			Container,
			Graphics,
			Text,
			TextStyle,
		} as unknown as ConstructorParameters<typeof ElementRenderer>[0]);

		// Apply initial camera
		this.applyCamera();
		this.renderGrid();

		// Set up input handlers
		this.setupInputHandlers();

		// Set up resize observer
		this.resizeObserver = new ResizeObserver(() => {
			this.renderGrid();
		});
		this.resizeObserver.observe(options.container);
	}

	/**
	 * Register a callback for camera changes (e.g., to sync with Zustand).
	 */
	setCameraChangeHandler(handler: (camera: CameraState) => void): void {
		this.onCameraChange = handler;
	}

	/**
	 * Set camera state programmatically (e.g., from Zustand store).
	 */
	setCamera(camera: Partial<CameraState>): void {
		if (camera.x !== undefined) this._camera.x = camera.x;
		if (camera.y !== undefined) this._camera.y = camera.y;
		if (camera.zoom !== undefined) {
			this._camera.zoom = Math.max(this._minZoom, Math.min(this._maxZoom, camera.zoom));
		}
		this.applyCamera();
		this.renderGrid();
	}

	/**
	 * Set grid visibility.
	 */
	setGridVisible(visible: boolean): void {
		if (this.gridLayer) {
			this.gridLayer.visible = visible;
		}
	}

	/**
	 * Set background rendering mode.
	 */
	setBackgroundMode(mode: BackgroundMode): void {
		this._backgroundMode = mode;
		this.renderGrid();
	}

	/**
	 * Set grid size in logical units.
	 */
	setGridSize(size: number): void {
		this._gridSize = size;
		this.renderGrid();
	}

	// ── Element Management ──

	/**
	 * Add a scene element to the world container.
	 */
	addElement(element: SceneElement): void {
		if (!this.elementRenderer || !this.worldContainer) return;
		const displayObject = this.elementRenderer.createElement(element);
		this.worldContainer.addChild(displayObject as unknown as ContainerChild);
	}

	/**
	 * Update an existing scene element's display object.
	 */
	updateElement(element: SceneElement): void {
		if (!this.elementRenderer) return;
		this.elementRenderer.updateElement(element);
	}

	/**
	 * Remove a scene element from the world container.
	 */
	removeElement(id: string): void {
		if (!this.elementRenderer || !this.worldContainer) return;
		const displayObject = this.elementRenderer.getDisplayObject(id);
		if (displayObject) {
			this.worldContainer.removeChild(displayObject as unknown as ContainerChild);
		}
		this.elementRenderer.destroyElement(id);
	}

	/**
	 * Sync all elements from Zustand store to Pixi.js scene graph.
	 * Performs a diff: adds new, updates existing, removes stale.
	 */
	syncElements(elements: Record<string, SceneElement>, elementIds: string[]): void {
		if (!this.elementRenderer || !this.worldContainer) return;

		const currentIds = new Set(elementIds);

		// Remove elements no longer in the store
		for (const id of this.elementRenderer.getTrackedIds()) {
			if (!currentIds.has(id)) {
				this.removeElement(id);
			}
		}

		// Add or update elements
		for (const id of elementIds) {
			const element = elements[id];
			if (!element) continue;

			if (this.elementRenderer.getDisplayObject(id)) {
				this.elementRenderer.updateElement(element);
			} else {
				const displayObject = this.elementRenderer.createElement(element);
				this.worldContainer.addChild(displayObject as unknown as ContainerChild);
			}
		}
	}

	/**
	 * Convert screen coordinates to world coordinates.
	 */
	screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
		return {
			x: (screenX - this._camera.x) / this._camera.zoom,
			y: (screenY - this._camera.y) / this._camera.zoom,
		};
	}

	/**
	 * Convert world coordinates to screen coordinates.
	 */
	worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
		return {
			x: worldX * this._camera.zoom + this._camera.x,
			y: worldY * this._camera.zoom + this._camera.y,
		};
	}

	/**
	 * Get the visible world bounds (viewport in world coordinates).
	 */
	getViewportBounds(): { x: number; y: number; width: number; height: number } {
		const w = this.app?.screen.width ?? 0;
		const h = this.app?.screen.height ?? 0;
		const topLeft = this.screenToWorld(0, 0);
		return {
			x: topLeft.x,
			y: topLeft.y,
			width: w / this._camera.zoom,
			height: h / this._camera.zoom,
		};
	}

	/**
	 * Clean up all resources.
	 */
	destroy(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;

		this.elementRenderer?.destroyAll();
		this.elementRenderer = null;

		if (this.app) {
			this.removeInputHandlers();
			this.app.destroy(true, { children: true });
			this.app = null;
		}

		this.worldContainer = null;
		this.gridLayer = null;
		this.selectionLayer = null;
		this.gridRenderer = null;
		this.container = null;
		this.onCameraChange = null;
	}

	// ── Private Methods ──

	private applyCamera(): void {
		if (!this.worldContainer || !this.selectionLayer) return;

		this.worldContainer.position.set(this._camera.x, this._camera.y);
		this.worldContainer.scale.set(this._camera.zoom);

		this.selectionLayer.position.set(this._camera.x, this._camera.y);
		this.selectionLayer.scale.set(this._camera.zoom);
	}

	private renderGrid(): void {
		if (!this.gridLayer || !this.gridRenderer || !this.app) return;

		// Clear previous grid
		this.gridLayer.removeChildren();

		if (this._backgroundMode === 'none') return;

		const graphics = this.gridRenderer.render({
			mode: this._backgroundMode,
			viewportWidth: this.app.screen.width,
			viewportHeight: this.app.screen.height,
			camera: this._camera,
			gridSize: this._gridSize,
			color: this._gridColor,
		});

		this.gridLayer.addChild(graphics);
	}

	// ── Input Handlers ──

	private boundOnWheel: ((e: WheelEvent) => void) | null = null;
	private boundOnPointerDown: ((e: PointerEvent) => void) | null = null;
	private boundOnPointerMove: ((e: PointerEvent) => void) | null = null;
	private boundOnPointerUp: ((e: PointerEvent) => void) | null = null;

	private setupInputHandlers(): void {
		if (!this.container) return;

		this.boundOnWheel = this.onWheel.bind(this);
		this.boundOnPointerDown = this.onPointerDown.bind(this);
		this.boundOnPointerMove = this.onPointerMove.bind(this);
		this.boundOnPointerUp = this.onPointerUp.bind(this);

		this.container.addEventListener('wheel', this.boundOnWheel, { passive: false });
		this.container.addEventListener('pointerdown', this.boundOnPointerDown);
		window.addEventListener('pointermove', this.boundOnPointerMove);
		window.addEventListener('pointerup', this.boundOnPointerUp);
	}

	private removeInputHandlers(): void {
		if (!this.container) return;

		if (this.boundOnWheel) this.container.removeEventListener('wheel', this.boundOnWheel);
		if (this.boundOnPointerDown)
			this.container.removeEventListener('pointerdown', this.boundOnPointerDown);
		if (this.boundOnPointerMove) window.removeEventListener('pointermove', this.boundOnPointerMove);
		if (this.boundOnPointerUp) window.removeEventListener('pointerup', this.boundOnPointerUp);
	}

	private onWheel(e: WheelEvent): void {
		e.preventDefault();

		const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(
			this._minZoom,
			Math.min(this._maxZoom, this._camera.zoom * zoomFactor),
		);

		// Zoom centered on cursor position
		const rect = this.container?.getBoundingClientRect();
		if (!rect) return;

		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		const worldBefore = this.screenToWorld(mouseX, mouseY);
		this._camera.zoom = newZoom;

		// Adjust camera so the world point under the cursor stays fixed
		this._camera.x = mouseX - worldBefore.x * newZoom;
		this._camera.y = mouseY - worldBefore.y * newZoom;

		this.applyCamera();
		this.renderGrid();
		this.onCameraChange?.({ ...this._camera });
	}

	private onPointerDown(e: PointerEvent): void {
		// Middle-click or Space+click for panning
		if (e.button === 1) {
			e.preventDefault();
			this.startPan(e);
		}
	}

	private onPointerMove(e: PointerEvent): void {
		if (!this.isPanning) return;

		const dx = e.clientX - this.panStartX;
		const dy = e.clientY - this.panStartY;

		this._camera.x = this.cameraStartX + dx;
		this._camera.y = this.cameraStartY + dy;

		this.applyCamera();
		this.renderGrid();
		this.onCameraChange?.({ ...this._camera });
	}

	private onPointerUp(_e: PointerEvent): void {
		if (this.isPanning) {
			this.isPanning = false;
		}
	}

	/**
	 * Start panning from external trigger (e.g., Space key + drag).
	 */
	startPan(e: PointerEvent): void {
		this.isPanning = true;
		this.panStartX = e.clientX;
		this.panStartY = e.clientY;
		this.cameraStartX = this._camera.x;
		this.cameraStartY = this._camera.y;
	}
}
