import type { Position, SceneElement, Size } from '@/types';
import { ALIGNMENT_SNAP_THRESHOLD } from './interaction-constants';

/**
 * A single alignment guide line to render on the canvas.
 * Axis determines orientation: 'vertical' means x=position, 'horizontal' means y=position.
 */
export interface AlignmentGuide {
	axis: 'horizontal' | 'vertical';
	/** World-space coordinate of the guide line */
	position: number;
	/** World-space start of the line extent */
	start: number;
	/** World-space end of the line extent */
	end: number;
}

/**
 * Result of a snap computation. Contains the delta adjustment
 * and any active alignment guides to render.
 */
export interface SnapResult {
	/** Delta to add to all raw X positions */
	deltaX: number;
	/** Delta to add to all raw Y positions */
	deltaY: number;
	/** Active alignment guide lines to render */
	guides: AlignmentGuide[];
}

/**
 * Dependency injection interface for SnapEngine.
 * Keeps the engine testable without real stores or Pixi.js.
 */
export interface SnapEngineDeps {
	getSnapEnabled: () => boolean;
	getGridSize: () => number;
	getElements: () => Record<string, SceneElement>;
	getElementIds: () => string[];
	getCameraZoom: () => number;
}

/** Axis-aligned bounding box for snap/alignment calculations */
interface ElementBounds {
	left: number;
	right: number;
	top: number;
	bottom: number;
	centerX: number;
	centerY: number;
}

/**
 * Pure computation class for snap-to-grid and alignment guide detection.
 * No Pixi.js dependency — fully unit-testable.
 *
 * During drag, the InteractionManager calls computeSnap() with raw
 * (unsnapped) positions. SnapEngine returns a delta adjustment and
 * any alignment guides to render.
 *
 * Spec reference: Section 6.1 (snap-to-grid, alignment guides)
 */
export class SnapEngine {
	constructor(private deps: SnapEngineDeps) {}

	/**
	 * Compute snapped position for a set of dragged elements.
	 *
	 * @param draggedIds    IDs of elements being dragged
	 * @param rawPositions  Unsnapped world positions (startPos + rawDelta)
	 * @returns SnapResult with delta adjustments and guides
	 */
	computeSnap(draggedIds: string[], rawPositions: Record<string, Position>): SnapResult {
		if (draggedIds.length === 0) {
			return { deltaX: 0, deltaY: 0, guides: [] };
		}

		const elements = this.deps.getElements();
		let deltaX = 0;
		let deltaY = 0;

		// Compute bounding box of dragged elements at raw positions
		const draggedBounds = this.computeGroupBounds(draggedIds, rawPositions, elements);
		if (!draggedBounds) return { deltaX: 0, deltaY: 0, guides: [] };

		// Pass 1: Grid snap
		if (this.deps.getSnapEnabled()) {
			const gridSize = this.deps.getGridSize();
			const snappedLeft = Math.round(draggedBounds.left / gridSize) * gridSize;
			const snappedTop = Math.round(draggedBounds.top / gridSize) * gridSize;
			deltaX = snappedLeft - draggedBounds.left;
			deltaY = snappedTop - draggedBounds.top;
		}

		// Apply grid delta to bounds for alignment detection
		const adjustedBounds: ElementBounds = {
			left: draggedBounds.left + deltaX,
			right: draggedBounds.right + deltaX,
			top: draggedBounds.top + deltaY,
			bottom: draggedBounds.bottom + deltaY,
			centerX: draggedBounds.centerX + deltaX,
			centerY: draggedBounds.centerY + deltaY,
		};

		// Pass 2: Alignment guide detection
		const threshold = ALIGNMENT_SNAP_THRESHOLD / this.deps.getCameraZoom();
		const draggedSet = new Set(draggedIds);
		const guides: AlignmentGuide[] = [];

		// Collect target bounds from non-dragged visible elements
		const targetBounds: ElementBounds[] = [];
		const elementIds = this.deps.getElementIds();
		for (const id of elementIds) {
			if (draggedSet.has(id)) continue;
			const el = elements[id];
			if (!el || !el.visible || el.locked) continue;
			targetBounds.push(this.getElementBounds(el.position, el.size));
		}

		// Also add canvas center as alignment target
		const canvasCenterBounds: ElementBounds = {
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
			centerX: 0,
			centerY: 0,
		};
		targetBounds.push(canvasCenterBounds);

		// X-axis alignment: check left, centerX, right
		let bestAlignX: { delta: number; guide: AlignmentGuide } | null = null;
		const xRefs = [
			{ value: adjustedBounds.left, label: 'left' },
			{ value: adjustedBounds.centerX, label: 'center' },
			{ value: adjustedBounds.right, label: 'right' },
		];

		for (const ref of xRefs) {
			for (const target of targetBounds) {
				const targetXValues = [
					{ value: target.left, label: 'left' },
					{ value: target.centerX, label: 'center' },
					{ value: target.right, label: 'right' },
				];
				for (const tv of targetXValues) {
					const diff = tv.value - ref.value;
					if (Math.abs(diff) <= threshold) {
						if (!bestAlignX || Math.abs(diff) < Math.abs(bestAlignX.delta)) {
							const extent = this.computeGuideExtent('vertical', adjustedBounds, target);
							bestAlignX = {
								delta: diff,
								guide: {
									axis: 'vertical',
									position: tv.value,
									start: extent.start,
									end: extent.end,
								},
							};
						}
					}
				}
			}
		}

		// Y-axis alignment: check top, centerY, bottom
		let bestAlignY: { delta: number; guide: AlignmentGuide } | null = null;
		const yRefs = [
			{ value: adjustedBounds.top, label: 'top' },
			{ value: adjustedBounds.centerY, label: 'center' },
			{ value: adjustedBounds.bottom, label: 'bottom' },
		];

		for (const ref of yRefs) {
			for (const target of targetBounds) {
				const targetYValues = [
					{ value: target.top, label: 'top' },
					{ value: target.centerY, label: 'center' },
					{ value: target.bottom, label: 'bottom' },
				];
				for (const tv of targetYValues) {
					const diff = tv.value - ref.value;
					if (Math.abs(diff) <= threshold) {
						if (!bestAlignY || Math.abs(diff) < Math.abs(bestAlignY.delta)) {
							const extent = this.computeGuideExtent('horizontal', adjustedBounds, target);
							bestAlignY = {
								delta: diff,
								guide: {
									axis: 'horizontal',
									position: tv.value,
									start: extent.start,
									end: extent.end,
								},
							};
						}
					}
				}
			}
		}

		// Alignment overrides grid snap on matched axes
		if (bestAlignX) {
			deltaX += bestAlignX.delta;
			guides.push(bestAlignX.guide);
		}
		if (bestAlignY) {
			deltaY += bestAlignY.delta;
			guides.push(bestAlignY.guide);
		}

		return { deltaX, deltaY, guides };
	}

	private computeGroupBounds(
		ids: string[],
		positions: Record<string, Position>,
		elements: Record<string, SceneElement>,
	): ElementBounds | null {
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (const id of ids) {
			const pos = positions[id];
			const el = elements[id];
			if (!pos || !el) continue;
			minX = Math.min(minX, pos.x);
			minY = Math.min(minY, pos.y);
			maxX = Math.max(maxX, pos.x + el.size.width);
			maxY = Math.max(maxY, pos.y + el.size.height);
		}

		if (!Number.isFinite(minX)) return null;

		return {
			left: minX,
			right: maxX,
			top: minY,
			bottom: maxY,
			centerX: (minX + maxX) / 2,
			centerY: (minY + maxY) / 2,
		};
	}

	private getElementBounds(pos: Position, size: Size): ElementBounds {
		return {
			left: pos.x,
			right: pos.x + size.width,
			top: pos.y,
			bottom: pos.y + size.height,
			centerX: pos.x + size.width / 2,
			centerY: pos.y + size.height / 2,
		};
	}

	private computeGuideExtent(
		axis: 'horizontal' | 'vertical',
		draggedBounds: ElementBounds,
		targetBounds: ElementBounds,
	): { start: number; end: number } {
		if (axis === 'vertical') {
			// Vertical guide spans along Y
			const allY = [draggedBounds.top, draggedBounds.bottom, targetBounds.top, targetBounds.bottom];
			return { start: Math.min(...allY) - 10, end: Math.max(...allY) + 10 };
		}
		// Horizontal guide spans along X
		const allX = [draggedBounds.left, draggedBounds.right, targetBounds.left, targetBounds.right];
		return { start: Math.min(...allX) - 10, end: Math.max(...allX) + 10 };
	}
}
