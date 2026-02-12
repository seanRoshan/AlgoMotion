/**
 * Tests for layout-animator — GSAP transition utilities.
 *
 * Covers: transition computation, immediate apply, GSAP animation data,
 * threshold filtering, new elements, and stagger.
 */

import { describe, expect, it } from 'vitest';
import {
	applyPositionsImmediate,
	buildGsapAnimations,
	computeTransitions,
	type LayoutAnimationOptions,
	type LayoutTransition,
} from './layout-animator';

describe('computeTransitions', () => {
	it('computes transitions for moved elements', () => {
		const oldPositions = {
			a: { x: 0, y: 0 },
			b: { x: 100, y: 100 },
		};
		const newPositions = {
			a: { x: 50, y: 30 },
			b: { x: 100, y: 100 },
		};

		const transitions = computeTransitions(oldPositions, newPositions);

		expect(transitions).toHaveLength(1);
		expect(transitions[0].elementId).toBe('a');
		expect(transitions[0].from).toEqual({ x: 0, y: 0 });
		expect(transitions[0].to).toEqual({ x: 50, y: 30 });
	});

	it('filters out elements that did not move', () => {
		const positions = {
			a: { x: 10, y: 20 },
			b: { x: 30, y: 40 },
		};

		const transitions = computeTransitions(positions, positions);

		expect(transitions).toHaveLength(0);
	});

	it('uses threshold to filter small movements', () => {
		const oldPositions = { a: { x: 0, y: 0 } };
		const newPositions = { a: { x: 0.3, y: 0.2 } };

		// Default threshold is 0.5
		const transitions = computeTransitions(oldPositions, newPositions);

		expect(transitions).toHaveLength(0);
	});

	it('custom threshold works', () => {
		const oldPositions = { a: { x: 0, y: 0 } };
		const newPositions = { a: { x: 0.3, y: 0.2 } };

		const transitions = computeTransitions(oldPositions, newPositions, 0.1);

		expect(transitions).toHaveLength(1);
	});

	it('handles new elements with no old position', () => {
		const oldPositions = {};
		const newPositions = { a: { x: 50, y: 30 } };

		const transitions = computeTransitions(oldPositions, newPositions);

		expect(transitions).toHaveLength(1);
		expect(transitions[0].elementId).toBe('a');
		expect(transitions[0].from).toEqual({ x: 0, y: 0 });
		expect(transitions[0].to).toEqual({ x: 50, y: 30 });
	});

	it('handles empty inputs', () => {
		const transitions = computeTransitions({}, {});
		expect(transitions).toHaveLength(0);
	});

	it('handles multiple transitions', () => {
		const oldPositions = {
			a: { x: 0, y: 0 },
			b: { x: 0, y: 0 },
			c: { x: 0, y: 0 },
		};
		const newPositions = {
			a: { x: 100, y: 100 },
			b: { x: 200, y: 200 },
			c: { x: 0, y: 0 }, // no movement
		};

		const transitions = computeTransitions(oldPositions, newPositions);

		expect(transitions).toHaveLength(2);
		expect(transitions.map((t) => t.elementId)).toContain('a');
		expect(transitions.map((t) => t.elementId)).toContain('b');
	});
});

describe('applyPositionsImmediate', () => {
	it('converts positions to Position record', () => {
		const newPositions = {
			a: { x: 10, y: 20 },
			b: { x: 30, y: 40 },
		};

		const result = applyPositionsImmediate(newPositions);

		expect(result.a).toEqual({ x: 10, y: 20 });
		expect(result.b).toEqual({ x: 30, y: 40 });
	});

	it('handles empty input', () => {
		const result = applyPositionsImmediate({});
		expect(result).toEqual({});
	});
});

describe('buildGsapAnimations', () => {
	const transitions: LayoutTransition[] = [
		{ elementId: 'a', from: { x: 0, y: 0 }, to: { x: 100, y: 50 } },
		{ elementId: 'b', from: { x: 10, y: 20 }, to: { x: 200, y: 100 } },
	];

	it('builds GSAP animation data with defaults', () => {
		const anims = buildGsapAnimations(transitions);

		expect(anims).toHaveLength(2);
		expect(anims[0].elementId).toBe('a');
		expect(anims[0].target).toEqual({ x: 0, y: 0 });
		expect(anims[0].vars.x).toBe(100);
		expect(anims[0].vars.y).toBe(50);
		expect(anims[0].vars.duration).toBe(0.5);
		expect(anims[0].vars.ease).toBe('power2.inOut');
		expect(anims[0].vars.delay).toBe(0);
	});

	it('applies custom duration and easing', () => {
		const options: LayoutAnimationOptions = {
			duration: 1,
			easing: 'elastic.out',
		};

		const anims = buildGsapAnimations(transitions, options);

		expect(anims[0].vars.duration).toBe(1);
		expect(anims[0].vars.ease).toBe('elastic.out');
	});

	it('applies stagger delay', () => {
		const options: LayoutAnimationOptions = {
			stagger: 0.1,
		};

		const anims = buildGsapAnimations(transitions, options);

		expect(anims[0].vars.delay).toBe(0);
		expect(anims[1].vars.delay).toBeCloseTo(0.1);
	});

	it('handles empty transitions', () => {
		const anims = buildGsapAnimations([]);
		expect(anims).toHaveLength(0);
	});
});
