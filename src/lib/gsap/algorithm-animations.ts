import gsap from 'gsap';
import type { SceneElement } from '@/types';

/**
 * Display object interface matching Pixi.js Container's animatable properties.
 * Pixi v8 Containers have top-level x/y/alpha properties that GSAP can animate
 * directly, triggering Pixi's internal transform recalculation.
 */
interface AnimatableDisplayObject {
	x: number;
	y: number;
	alpha: number;
}

type GetDisplayObject = (id: string) => AnimatableDisplayObject | null;

/**
 * Builds a GSAP timeline that animates the Bubble Sort algorithm.
 *
 * Each step: highlight two adjacent cells (lift up), swap positions if
 * out of order, then move to the next pair. GSAP directly mutates
 * Pixi display objects — React is NOT involved during playback.
 */
export function buildBubbleSortTimeline(
	elements: SceneElement[],
	getDisplayObject: GetDisplayObject,
): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });

	// Extract values and positions
	const cells = elements.map((el) => ({
		id: el.id,
		value: Number.parseInt(el.label ?? '0', 10),
		x: el.position.x,
		y: el.position.y,
	}));

	const n = cells.length;
	if (n < 2) return tl;

	// Track current order (will be mutated as we simulate the sort)
	const order = cells.map((c) => ({ ...c }));

	// Standard Bubble Sort - outer loop
	for (let i = 0; i < n - 1; i++) {
		for (let j = 0; j < n - i - 1; j++) {
			const a = order[j];
			const b = order[j + 1];
			if (!a || !b) continue;

			const objA = getDisplayObject(a.id);
			const objB = getDisplayObject(b.id);
			if (!objA || !objB) continue;

			const label = `compare-${i}-${j}`;

			// Highlight: lift both cells up
			tl.to(objA, { y: a.y - 15, duration: 0.15, ease: 'power2.out' }, label);
			tl.to(objB, { y: b.y - 15, duration: 0.15, ease: 'power2.out' }, label);

			// Settle back
			tl.to(objA, { y: a.y, duration: 0.15, ease: 'power2.in' });
			tl.to(objB, { y: b.y, duration: 0.15, ease: 'power2.in' }, '<');

			if (a.value > b.value) {
				// Swap: animate x positions
				const swapLabel = `swap-${i}-${j}`;
				tl.to(objA, { x: b.x, duration: 0.35, ease: 'power2.inOut' }, swapLabel);
				tl.to(objB, { x: a.x, duration: 0.35, ease: 'power2.inOut' }, swapLabel);

				// Update our tracking
				const tempX = a.x;
				a.x = b.x;
				b.x = tempX;

				// Swap in order array
				order[j] = b;
				order[j + 1] = a;
			}

			// Small pause between comparisons
			tl.to({}, { duration: 0.1 });
		}

		// Pause between passes
		tl.to({}, { duration: 0.2 });
	}

	return tl;
}

/**
 * Determines which animation builder to use based on template ID.
 */
export function buildAnimationTimeline(
	templateId: string,
	elements: SceneElement[],
	getDisplayObject: GetDisplayObject,
): gsap.core.Timeline | null {
	if (templateId.includes('bubble-sort') || templateId === 'bubble-sort') {
		return buildBubbleSortTimeline(elements, getDisplayObject);
	}
	// Default: simple sequential highlight animation for any template
	return buildGenericHighlightTimeline(elements, getDisplayObject);
}

/**
 * Generic animation: sequentially bounces each element.
 * Works for any template as a fallback.
 */
function buildGenericHighlightTimeline(
	elements: SceneElement[],
	getDisplayObject: GetDisplayObject,
): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });

	for (const el of elements) {
		const obj = getDisplayObject(el.id);
		if (!obj) continue;

		const baseY = el.position.y;

		// Bounce up and back
		tl.to(obj, { y: baseY - 20, duration: 0.25, ease: 'power2.out' });
		tl.to(obj, { y: baseY, duration: 0.25, ease: 'bounce.out' });
		tl.to({}, { duration: 0.1 }); // gap
	}

	return tl;
}
