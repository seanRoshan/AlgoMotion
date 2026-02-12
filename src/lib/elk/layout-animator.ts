/**
 * Layout Animator — animates position transitions after ELK.js layout.
 *
 * Uses GSAP to smoothly transition elements from their current positions
 * to the new positions computed by the LayoutEngine. Provides spring-like
 * easing for organic feel during graph reorganization.
 *
 * Spec reference: Section 4 (Graph Layout), Section 6.3.1 (Auto-layout)
 */

import type { Position } from '@/types';

/** Position update to animate. */
export interface LayoutTransition {
	elementId: string;
	from: Position;
	to: Position;
}

/** Options for layout animation. */
export interface LayoutAnimationOptions {
	duration?: number;
	easing?: string;
	stagger?: number;
	onUpdate?: (elementId: string, position: Position) => void;
	onComplete?: () => void;
}

const DEFAULT_DURATION = 0.5;
const DEFAULT_EASING = 'power2.inOut';

/**
 * Compute transitions needed between old and new positions.
 * Filters out elements that haven't moved.
 */
export function computeTransitions(
	oldPositions: Record<string, Position>,
	newPositions: Record<string, Position>,
	threshold = 0.5,
): LayoutTransition[] {
	const transitions: LayoutTransition[] = [];

	for (const [id, newPos] of Object.entries(newPositions)) {
		const oldPos = oldPositions[id];
		if (!oldPos) {
			// New element, animate from origin
			transitions.push({
				elementId: id,
				from: { x: 0, y: 0 },
				to: newPos,
			});
			continue;
		}

		const dx = Math.abs(newPos.x - oldPos.x);
		const dy = Math.abs(newPos.y - oldPos.y);
		if (dx > threshold || dy > threshold) {
			transitions.push({
				elementId: id,
				from: oldPos,
				to: newPos,
			});
		}
	}

	return transitions;
}

/**
 * Apply layout positions immediately (no animation).
 * Returns the position updates as a Record for the scene store.
 */
export function applyPositionsImmediate(
	newPositions: Record<string, { x: number; y: number }>,
): Record<string, Position> {
	const updates: Record<string, Position> = {};
	for (const [id, pos] of Object.entries(newPositions)) {
		updates[id] = { x: pos.x, y: pos.y };
	}
	return updates;
}

/**
 * Build GSAP-compatible animation data for layout transitions.
 * Returns an array of objects that can be passed to gsap.to().
 */
export function buildGsapAnimations(
	transitions: LayoutTransition[],
	options: LayoutAnimationOptions = {},
): Array<{
	elementId: string;
	target: { x: number; y: number };
	vars: {
		x: number;
		y: number;
		duration: number;
		ease: string;
		delay: number;
	};
}> {
	const duration = options.duration ?? DEFAULT_DURATION;
	const easing = options.easing ?? DEFAULT_EASING;
	const stagger = options.stagger ?? 0;

	return transitions.map((t, i) => ({
		elementId: t.elementId,
		target: { x: t.from.x, y: t.from.y },
		vars: {
			x: t.to.x,
			y: t.to.y,
			duration,
			ease: easing,
			delay: i * stagger,
		},
	}));
}
