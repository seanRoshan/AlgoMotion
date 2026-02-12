import type { Position, SceneElement, Size } from '@/types';
import type { AlignmentGuideRenderer } from './alignment-guide-renderer';
import { HitTester } from './hit-tester';
import { DRAG_THRESHOLD, MIN_ELEMENT_SIZE } from './interaction-constants';
import type { HandlePosition, InteractionState } from './interaction-state';
import { computeBoundingBox, HANDLE_CURSORS } from './interaction-state';
import type { SelectionRenderer } from './selection-renderer';
import { SnapEngine, type SnapEngineDeps } from './snap-engine';

/**
 * Dependency injection interface for the InteractionManager.
 * Keeps the manager testable without real Pixi.js or Zustand.
 */
export interface InteractionDeps {
	// Read state
	getElements: () => Record<string, SceneElement>;
	getElementIds: () => string[];
	getSelectedIds: () => string[];
	getCameraZoom: () => number;
	screenToWorld: (sx: number, sy: number) => { x: number; y: number };
	getContainerRect: () => DOMRect | null;

	// Store mutations
	selectElement: (id: string) => void;
	deselectAll: () => void;
	selectMultiple: (ids: string[]) => void;
	toggleSelection: (id: string) => void;
	moveElements: (updates: Record<string, Position>) => void;
	resizeElement: (id: string, size: Size, position: Position) => void;
	rotateElement: (id: string, rotation: number) => void;

	// Direct Pixi mutation for 60fps drag/rotate (bypasses store)
	moveDisplayObject: (id: string, worldX: number, worldY: number) => void;
	rotateDisplayObject: (id: string, radians: number) => void;

	// Cursor
	setCursor: (cursor: string) => void;

	// Snap
	getSnapEnabled: () => boolean;
	getGridSize: () => number;
}

/**
 * Finite-state-machine that drives all pointer-based canvas interactions:
 * selection, drag, resize, rotation, and marquee selection.
 *
 * State flow:
 *   idle → clicking → (dragging | selecting | resizing | rotating) → idle
 *
 * Performance rule: During continuous operations (drag, rotate), Pixi.js
 * display objects are mutated directly. State is committed to Zustand
 * only on pointerup.
 */
export class InteractionManager {
	private deps: InteractionDeps;
	private hitTester = new HitTester();
	private selectionRenderer: SelectionRenderer;
	private guideRenderer: AlignmentGuideRenderer | null;
	private snapEngine: SnapEngine;
	private interaction: InteractionState = { state: 'idle' };

	// Whether the clicked element was already selected before pointerdown.
	// Used for "click-to-narrow" behavior in multi-selection.
	private wasAlreadySelected = false;

	constructor(
		deps: InteractionDeps,
		selectionRenderer: SelectionRenderer,
		guideRenderer?: AlignmentGuideRenderer,
	) {
		this.deps = deps;
		this.selectionRenderer = selectionRenderer;
		this.guideRenderer = guideRenderer ?? null;

		const snapDeps: SnapEngineDeps = {
			getSnapEnabled: deps.getSnapEnabled,
			getGridSize: deps.getGridSize,
			getElements: deps.getElements,
			getElementIds: deps.getElementIds,
			getCameraZoom: deps.getCameraZoom,
		};
		this.snapEngine = new SnapEngine(snapDeps);
	}

	getInteractionState(): InteractionState {
		return this.interaction;
	}

	/**
	 * Re-render selection overlay from current store state.
	 * Call after external changes (keyboard shortcuts, store mutations).
	 */
	refreshSelection(): void {
		const { getSelectedIds, getElements, getCameraZoom } = this.deps;
		this.selectionRenderer.render(getSelectedIds(), getElements(), getCameraZoom());
	}

	/**
	 * Handle left-button pointer down. Returns true if consumed.
	 */
	onPointerDown(e: PointerEvent): boolean {
		if (e.button !== 0) return false;

		const rect = this.deps.getContainerRect();
		if (!rect) return false;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		const elements = this.deps.getElements();
		const elementIds = this.deps.getElementIds();
		const selectedIds = this.deps.getSelectedIds();
		const zoom = this.deps.getCameraZoom();

		const hit = this.hitTester.hitTest(world.x, world.y, elements, elementIds, selectedIds, zoom);

		// Selection logic on pointer down
		this.wasAlreadySelected = false;

		if (hit.type === 'element') {
			const isSelected = selectedIds.includes(hit.elementId);
			this.wasAlreadySelected = isSelected;

			if (e.shiftKey) {
				this.deps.toggleSelection(hit.elementId);
			} else if (!isSelected) {
				this.deps.selectElement(hit.elementId);
			}
			// Already selected without shift → defer to pointerup (might drag)
		}
		// handle/rotation: don't change selection
		// empty: defer deselect to pointerup (might marquee)

		this.interaction = {
			state: 'clicking',
			target: hit,
			pointerStart: { x: screenX, y: screenY },
			shiftKey: e.shiftKey,
		};

		// Update cursor
		if (hit.type === 'handle') {
			this.deps.setCursor(HANDLE_CURSORS[hit.handle]);
		} else if (hit.type === 'rotation') {
			this.deps.setCursor('grab');
		} else if (hit.type === 'element') {
			this.deps.setCursor('move');
		}

		this.refreshSelection();
		return true;
	}

	onPointerMove(e: PointerEvent): void {
		const s = this.interaction;

		if (s.state === 'clicking') {
			this.handleClickingMove(e, s);
		} else if (s.state === 'dragging') {
			this.handleDraggingMove(e, s);
		} else if (s.state === 'selecting') {
			this.handleSelectingMove(e, s);
		} else if (s.state === 'resizing') {
			this.handleResizingMove(e, s);
		} else if (s.state === 'rotating') {
			this.handleRotatingMove(e, s);
		}
	}

	onPointerUp(e: PointerEvent): void {
		const s = this.interaction;

		if (s.state === 'clicking') {
			this.handleClickingUp(s);
		} else if (s.state === 'dragging') {
			this.handleDraggingUp(e, s);
		} else if (s.state === 'selecting') {
			// Marquee selection already applied during move
		} else if (s.state === 'rotating') {
			this.handleRotatingUp(e, s);
		}
		// Resizing commits to store continuously — no final commit needed

		this.selectionRenderer.clearMarquee();
		this.guideRenderer?.clear();
		this.interaction = { state: 'idle' };
		this.deps.setCursor('default');
		this.refreshSelection();
	}

	destroy(): void {
		this.interaction = { state: 'idle' };
		this.selectionRenderer.destroy();
		this.guideRenderer?.destroy();
	}

	// ── Clicking state ──

	private handleClickingMove(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'clicking' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const dx = screenX - s.pointerStart.x;
		const dy = screenY - s.pointerStart.y;

		if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;

		// Exceeded drag threshold — transition
		const startWorld = this.deps.screenToWorld(s.pointerStart.x, s.pointerStart.y);
		const currentWorld = this.deps.screenToWorld(screenX, screenY);

		if (s.target.type === 'element') {
			this.transitionToDragging(startWorld);
		} else if (s.target.type === 'handle') {
			this.transitionToResizing(s.target.handle, s.target.elementId, startWorld);
		} else if (s.target.type === 'rotation') {
			this.transitionToRotating(s.target.elementId, startWorld);
		} else {
			// Empty → marquee
			this.interaction = {
				state: 'selecting',
				startWorld,
				currentWorld,
				shiftKey: s.shiftKey,
			};
		}

		// Process the current event in the new state
		this.onPointerMove(e);
	}

	private handleClickingUp(s: Extract<InteractionState, { state: 'clicking' }>): void {
		if (s.target.type === 'element') {
			if (!s.shiftKey && this.wasAlreadySelected) {
				// Click on already-selected element in multi-selection:
				// narrow selection to just this element
				this.deps.selectElement(s.target.elementId);
			}
		} else if (s.target.type === 'empty') {
			if (!s.shiftKey) {
				this.deps.deselectAll();
			}
		}
	}

	// ── Dragging state ──

	private transitionToDragging(startWorld: Position): void {
		const selectedIds = this.deps.getSelectedIds();
		const elements = this.deps.getElements();

		const elementStartPositions: Record<string, Position> = {};
		for (const id of selectedIds) {
			const el = elements[id];
			if (el) {
				elementStartPositions[id] = { ...el.position };
			}
		}

		this.interaction = {
			state: 'dragging',
			elementStartPositions,
			pointerStartWorld: startWorld,
		};
		this.deps.setCursor('move');
	}

	private handleDraggingMove(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'dragging' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		const rawDx = world.x - s.pointerStartWorld.x;
		const rawDy = world.y - s.pointerStartWorld.y;

		// Compute raw (unsnapped) positions for all dragged elements
		const rawPositions: Record<string, Position> = {};
		for (const [id, startPos] of Object.entries(s.elementStartPositions)) {
			rawPositions[id] = { x: startPos.x + rawDx, y: startPos.y + rawDy };
		}

		// Run snap engine to get adjusted delta and alignment guides
		const snapResult = this.snapEngine.computeSnap(
			Object.keys(s.elementStartPositions),
			rawPositions,
		);

		const dx = rawDx + snapResult.deltaX;
		const dy = rawDy + snapResult.deltaY;

		// Direct Pixi mutation for 60fps
		for (const [id, startPos] of Object.entries(s.elementStartPositions)) {
			this.deps.moveDisplayObject(id, startPos.x + dx, startPos.y + dy);
		}

		// Render alignment guides
		this.guideRenderer?.render(snapResult.guides, this.deps.getCameraZoom());

		// Update selection overlay with snapped positions
		const elements = this.deps.getElements();
		const selectedIds = this.deps.getSelectedIds();
		const adjusted: Record<string, SceneElement> = {};

		for (const [key, el] of Object.entries(elements)) {
			if (el && s.elementStartPositions[key]) {
				adjusted[key] = {
					...el,
					position: {
						x: el.position.x + dx,
						y: el.position.y + dy,
					},
				};
			} else if (el) {
				adjusted[key] = el;
			}
		}
		this.selectionRenderer.render(selectedIds, adjusted, this.deps.getCameraZoom());
	}

	private handleDraggingUp(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'dragging' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		const rawDx = world.x - s.pointerStartWorld.x;
		const rawDy = world.y - s.pointerStartWorld.y;

		// Apply same snap logic for final commit
		const rawPositions: Record<string, Position> = {};
		for (const [id, startPos] of Object.entries(s.elementStartPositions)) {
			rawPositions[id] = { x: startPos.x + rawDx, y: startPos.y + rawDy };
		}

		const snapResult = this.snapEngine.computeSnap(
			Object.keys(s.elementStartPositions),
			rawPositions,
		);

		const dx = rawDx + snapResult.deltaX;
		const dy = rawDy + snapResult.deltaY;

		// Commit final snapped positions to store
		const elements = this.deps.getElements();
		const updates: Record<string, Position> = {};
		for (const [id, startPos] of Object.entries(s.elementStartPositions)) {
			if (elements[id]) {
				updates[id] = { x: startPos.x + dx, y: startPos.y + dy };
			}
		}
		if (Object.keys(updates).length > 0) {
			this.deps.moveElements(updates);
		}
	}

	// ── Selecting (marquee) state ──

	private handleSelectingMove(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'selecting' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		this.interaction = { ...s, currentWorld: world };

		// Draw marquee rectangle
		this.selectionRenderer.renderMarquee(s.startWorld.x, s.startWorld.y, world.x, world.y);

		// Live-update selection from marquee bounds
		const idsInRect = this.hitTester.getElementsInRect(
			{
				x: Math.min(s.startWorld.x, world.x),
				y: Math.min(s.startWorld.y, world.y),
				width: Math.abs(world.x - s.startWorld.x),
				height: Math.abs(world.y - s.startWorld.y),
			},
			this.deps.getElements(),
			this.deps.getElementIds(),
		);

		this.deps.selectMultiple(idsInRect);
		this.selectionRenderer.render(idsInRect, this.deps.getElements(), this.deps.getCameraZoom());
	}

	// ── Resizing state ──

	private transitionToResizing(
		handle: HandlePosition,
		elementId: string,
		startWorld: Position,
	): void {
		const elements = this.deps.getElements();
		const selectedIds = this.deps.getSelectedIds();

		const selectedElements = selectedIds
			.map((id) => elements[id])
			.filter((el): el is SceneElement => el !== undefined);

		const bounds = computeBoundingBox(selectedElements);

		this.interaction = {
			state: 'resizing',
			handle,
			elementId,
			startBounds: { ...bounds },
			pointerStartWorld: startWorld,
			proportional: false,
		};
		this.deps.setCursor(HANDLE_CURSORS[handle]);
	}

	private handleResizingMove(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'resizing' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		const { startBounds, handle, pointerStartWorld } = s;
		const dx = world.x - pointerStartWorld.x;
		const dy = world.y - pointerStartWorld.y;

		let newX = startBounds.x;
		let newY = startBounds.y;
		let newW = startBounds.width;
		let newH = startBounds.height;

		if (handle.includes('left')) {
			newX = startBounds.x + dx;
			newW = startBounds.width - dx;
		} else if (handle.includes('right')) {
			newW = startBounds.width + dx;
		}

		if (handle.startsWith('top')) {
			newY = startBounds.y + dy;
			newH = startBounds.height - dy;
		} else if (handle.startsWith('bottom')) {
			newH = startBounds.height + dy;
		}

		// Enforce minimum size
		if (newW < MIN_ELEMENT_SIZE) {
			if (handle.includes('left')) {
				newX = startBounds.x + startBounds.width - MIN_ELEMENT_SIZE;
			}
			newW = MIN_ELEMENT_SIZE;
		}
		if (newH < MIN_ELEMENT_SIZE) {
			if (handle.startsWith('top')) {
				newY = startBounds.y + startBounds.height - MIN_ELEMENT_SIZE;
			}
			newH = MIN_ELEMENT_SIZE;
		}

		// Commit via store (triggers visual rebuild)
		const selectedIds = this.deps.getSelectedIds();
		if (selectedIds.length === 1 && selectedIds[0]) {
			this.deps.resizeElement(selectedIds[0], { width: newW, height: newH }, { x: newX, y: newY });
		}

		this.refreshSelection();
	}

	// ── Rotating state ──

	private transitionToRotating(elementId: string, startWorld: Position): void {
		const elements = this.deps.getElements();
		const selectedIds = this.deps.getSelectedIds();

		const selectedElements = selectedIds
			.map((id) => elements[id])
			.filter((el): el is SceneElement => el !== undefined);

		const bounds = computeBoundingBox(selectedElements);
		const pivot = {
			x: bounds.x + bounds.width / 2,
			y: bounds.y + bounds.height / 2,
		};

		const startAngle = Math.atan2(startWorld.y - pivot.y, startWorld.x - pivot.x);
		const startRotation = elements[elementId]?.rotation ?? 0;

		this.interaction = {
			state: 'rotating',
			elementId,
			pivotWorld: pivot,
			startAngle,
			startRotation,
		};
		this.deps.setCursor('grabbing');
	}

	private handleRotatingMove(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'rotating' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		const currentAngle = Math.atan2(world.y - s.pivotWorld.y, world.x - s.pivotWorld.x);
		const deltaAngle = currentAngle - s.startAngle;
		const newRotationDeg = s.startRotation + (deltaAngle * 180) / Math.PI;

		// Direct Pixi mutation for 60fps
		this.deps.rotateDisplayObject(s.elementId, (newRotationDeg * Math.PI) / 180);
	}

	private handleRotatingUp(
		e: PointerEvent,
		s: Extract<InteractionState, { state: 'rotating' }>,
	): void {
		const rect = this.deps.getContainerRect();
		if (!rect) return;

		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const world = this.deps.screenToWorld(screenX, screenY);

		const currentAngle = Math.atan2(world.y - s.pivotWorld.y, world.x - s.pivotWorld.x);
		const deltaAngle = currentAngle - s.startAngle;
		const newRotationDeg = s.startRotation + (deltaAngle * 180) / Math.PI;

		// Commit rotation to store (guard against element deleted during rotate)
		if (this.deps.getElements()[s.elementId]) {
			this.deps.rotateElement(s.elementId, newRotationDeg);
		}
	}
}
