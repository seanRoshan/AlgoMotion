import type { SceneElement } from '@/types';
import { HANDLE_HIT_AREA, ROTATION_HANDLE_DISTANCE } from './interaction-constants';
import type { HandlePosition, HitTestResult } from './interaction-state';
import { computeBoundingBox, getHandlePosition } from './interaction-state';

/**
 * Hit testing for canvas interactions.
 * Tests handles first (highest priority), then elements, then empty canvas.
 *
 * All coordinates are in world space.
 */
export class HitTester {
	/**
	 * Full hit test pipeline: handles → elements → empty.
	 */
	hitTest(
		worldX: number,
		worldY: number,
		elements: Record<string, SceneElement>,
		elementIds: string[],
		selectedIds: string[],
		cameraZoom: number,
	): HitTestResult {
		// 1. Test selection handles (only if something is selected)
		if (selectedIds.length > 0) {
			const handleHit = this.hitTestHandles(worldX, worldY, elements, selectedIds, cameraZoom);
			if (handleHit) return handleHit;
		}

		// 2. Test elements in reverse z-order (topmost first)
		for (let i = elementIds.length - 1; i >= 0; i--) {
			const id = elementIds[i];
			if (!id) continue;
			const element = elements[id];
			if (!element || !element.visible || element.locked) continue;

			if (this.pointInElement(worldX, worldY, element)) {
				return { type: 'element', elementId: id };
			}
		}

		// 3. Empty canvas
		return { type: 'empty' };
	}

	/**
	 * Test handles for the current selection.
	 */
	hitTestHandles(
		worldX: number,
		worldY: number,
		elements: Record<string, SceneElement>,
		selectedIds: string[],
		cameraZoom: number,
	): HitTestResult | null {
		const selectedElements = selectedIds
			.map((id) => elements[id])
			.filter((el): el is SceneElement => el !== undefined);

		if (selectedElements.length === 0) return null;

		const bounds = computeBoundingBox(selectedElements);
		// Hit area size in world space (compensate for zoom)
		const hitSize = HANDLE_HIT_AREA / cameraZoom;

		const targetId = selectedIds[0] ?? '';

		// Test rotation handle first
		const rotationPos = getHandlePosition('rotation', bounds);
		const rotationWorldY = rotationPos.y - ROTATION_HANDLE_DISTANCE / cameraZoom;
		if (
			Math.abs(worldX - rotationPos.x) <= hitSize / 2 &&
			Math.abs(worldY - rotationWorldY) <= hitSize / 2
		) {
			return { type: 'rotation', elementId: targetId };
		}

		// Test resize handles
		const handles: HandlePosition[] = [
			'top-left',
			'top-center',
			'top-right',
			'middle-left',
			'middle-right',
			'bottom-left',
			'bottom-center',
			'bottom-right',
		];

		for (const handle of handles) {
			const pos = getHandlePosition(handle, bounds);
			if (Math.abs(worldX - pos.x) <= hitSize / 2 && Math.abs(worldY - pos.y) <= hitSize / 2) {
				return { type: 'handle', handle, elementId: targetId };
			}
		}

		return null;
	}

	/**
	 * Test if a point is inside an element's bounds.
	 */
	pointInElement(worldX: number, worldY: number, element: SceneElement): boolean {
		const { position, size } = element;
		return (
			worldX >= position.x &&
			worldX <= position.x + size.width &&
			worldY >= position.y &&
			worldY <= position.y + size.height
		);
	}

	/**
	 * Get all element IDs whose bounding boxes intersect a rectangle.
	 * Used for marquee selection.
	 */
	getElementsInRect(
		rect: { x: number; y: number; width: number; height: number },
		elements: Record<string, SceneElement>,
		elementIds: string[],
	): string[] {
		const result: string[] = [];

		// Normalize rect (handle negative width/height from drag direction)
		const rx = rect.width >= 0 ? rect.x : rect.x + rect.width;
		const ry = rect.height >= 0 ? rect.y : rect.y + rect.height;
		const rw = Math.abs(rect.width);
		const rh = Math.abs(rect.height);

		for (const id of elementIds) {
			const element = elements[id];
			if (!element || !element.visible || element.locked) continue;

			const { position, size } = element;

			// AABB intersection test
			const intersects =
				position.x < rx + rw &&
				position.x + size.width > rx &&
				position.y < ry + rh &&
				position.y + size.height > ry;

			if (intersects) {
				result.push(id);
			}
		}

		return result;
	}
}
