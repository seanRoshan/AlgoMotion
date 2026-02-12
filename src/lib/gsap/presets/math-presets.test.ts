/**
 * Tests for Math GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	mathLineTrace,
	mathMatrixMultiplyStep,
	mathMatrixRowHighlight,
	mathNumberLineSlide,
	mathPlotPoints,
} from './math-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
	position: { x: number; y: number };
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0x2a2a4a, position: { x: 100, y: 100 } };
}

describe('Math Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('mathPlotPoints', () => {
		it('returns a GSAP timeline', () => {
			const tl = mathPlotPoints([makeNode(), makeNode()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = mathPlotPoints([makeNode(), makeNode(), makeNode()], 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty points', () => {
			const tl = mathPlotPoints([], 0x3b82f6);
			expect(tl.duration()).toBe(0);
		});

		it('more points means longer duration', () => {
			const few = mathPlotPoints([makeNode()], 0x3b82f6);
			const many = mathPlotPoints([makeNode(), makeNode(), makeNode(), makeNode()], 0x3b82f6);
			expect(many.duration()).toBeGreaterThan(few.duration());
		});
	});

	describe('mathLineTrace', () => {
		it('returns a GSAP timeline', () => {
			const tl = mathLineTrace([makeNode(), makeNode()], 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = mathLineTrace([makeNode(), makeNode()], 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty segments', () => {
			const tl = mathLineTrace([], 0x4ade80);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('mathMatrixRowHighlight', () => {
		it('returns a GSAP timeline', () => {
			const tl = mathMatrixRowHighlight([makeNode(), makeNode(), makeNode()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = mathMatrixRowHighlight([makeNode(), makeNode()], 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty cells', () => {
			const tl = mathMatrixRowHighlight([], 0x3b82f6);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('mathMatrixMultiplyStep', () => {
		it('returns a GSAP timeline', () => {
			const tl = mathMatrixMultiplyStep(
				[makeNode(), makeNode()],
				[makeNode(), makeNode()],
				makeNode(),
				0x3b82f6,
				0xf97316,
				0x4ade80,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = mathMatrixMultiplyStep(
				[makeNode()],
				[makeNode()],
				makeNode(),
				0x3b82f6,
				0xf97316,
				0x4ade80,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('larger matrices have longer duration', () => {
			const small = mathMatrixMultiplyStep(
				[makeNode()],
				[makeNode()],
				makeNode(),
				0x3b82f6,
				0xf97316,
				0x4ade80,
			);
			const large = mathMatrixMultiplyStep(
				[makeNode(), makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode()],
				makeNode(),
				0x3b82f6,
				0xf97316,
				0x4ade80,
			);
			expect(large.duration()).toBeGreaterThan(small.duration());
		});
	});

	describe('mathNumberLineSlide', () => {
		it('returns a GSAP timeline', () => {
			const tl = mathNumberLineSlide(makeNode(), 200, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = mathNumberLineSlide(makeNode(), 200, 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});
});
