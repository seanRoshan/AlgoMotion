import type { Position, Size } from '@/types';

/**
 * Resize/rotation handle positions around a selection bounding box.
 */
export type HandlePosition =
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'middle-left'
	| 'middle-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right'
	| 'rotation';

/**
 * Result of a hit test against the canvas.
 */
export type HitTestResult =
	| { type: 'element'; elementId: string }
	| { type: 'handle'; handle: HandlePosition; elementId: string }
	| { type: 'rotation'; elementId: string }
	| { type: 'empty' };

/**
 * Interaction state machine states with typed payloads.
 */
export type InteractionState =
	| { state: 'idle' }
	| {
			state: 'clicking';
			target: HitTestResult;
			pointerStart: Position;
			shiftKey: boolean;
	  }
	| {
			state: 'selecting';
			startWorld: Position;
			currentWorld: Position;
			shiftKey: boolean;
	  }
	| {
			state: 'dragging';
			elementStartPositions: Record<string, Position>;
			pointerStartWorld: Position;
	  }
	| {
			state: 'resizing';
			handle: HandlePosition;
			elementId: string;
			startBounds: { x: number; y: number; width: number; height: number };
			pointerStartWorld: Position;
			proportional: boolean;
	  }
	| {
			state: 'rotating';
			elementId: string;
			pivotWorld: Position;
			startAngle: number;
			startRotation: number;
	  }
	| { state: 'panning' };

/**
 * Cursor CSS values for each handle position.
 */
export const HANDLE_CURSORS: Record<HandlePosition, string> = {
	'top-left': 'nwse-resize',
	'top-right': 'nesw-resize',
	'bottom-left': 'nesw-resize',
	'bottom-right': 'nwse-resize',
	'top-center': 'ns-resize',
	'bottom-center': 'ns-resize',
	'middle-left': 'ew-resize',
	'middle-right': 'ew-resize',
	rotation: 'grab',
};

/**
 * Get the anchor (opposite) handle for a resize operation.
 * The anchor handle stays fixed while the dragged handle moves.
 */
export function getAnchorHandle(handle: HandlePosition): HandlePosition {
	const anchors: Record<HandlePosition, HandlePosition> = {
		'top-left': 'bottom-right',
		'top-center': 'bottom-center',
		'top-right': 'bottom-left',
		'middle-left': 'middle-right',
		'middle-right': 'middle-left',
		'bottom-left': 'top-right',
		'bottom-center': 'top-center',
		'bottom-right': 'top-left',
		rotation: 'rotation', // N/A
	};
	return anchors[handle];
}

/**
 * Compute the position of a handle relative to an element's bounding box.
 */
export function getHandlePosition(
	handle: HandlePosition,
	bounds: { x: number; y: number; width: number; height: number },
): Position {
	const { x, y, width, height } = bounds;
	const cx = x + width / 2;
	const cy = y + height / 2;

	switch (handle) {
		case 'top-left':
			return { x, y };
		case 'top-center':
			return { x: cx, y };
		case 'top-right':
			return { x: x + width, y };
		case 'middle-left':
			return { x, y: cy };
		case 'middle-right':
			return { x: x + width, y: cy };
		case 'bottom-left':
			return { x, y: y + height };
		case 'bottom-center':
			return { x: cx, y: y + height };
		case 'bottom-right':
			return { x: x + width, y: y + height };
		case 'rotation':
			return { x: cx, y }; // rotation handle is above top-center
	}
}

/**
 * Compute the combined bounding box of multiple elements.
 */
export function computeBoundingBox(elements: Array<{ position: Position; size: Size }>): {
	x: number;
	y: number;
	width: number;
	height: number;
} {
	if (elements.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const el of elements) {
		minX = Math.min(minX, el.position.x);
		minY = Math.min(minY, el.position.y);
		maxX = Math.max(maxX, el.position.x + el.size.width);
		maxY = Math.max(maxY, el.position.y + el.size.height);
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	};
}
