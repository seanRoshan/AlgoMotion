/**
 * Tests for Metrics Overlay GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	metricsBatchUpdate,
	metricsComplexityReveal,
	metricsCounterFlash,
	metricsStepAdvance,
} from './metrics-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0xe5e7eb };
}

describe('Metrics Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('metricsCounterFlash', () => {
		it('returns a GSAP timeline', () => {
			const tl = metricsCounterFlash(makeNode(), 0xfbbf24);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = metricsCounterFlash(makeNode(), 0xfbbf24);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('metricsStepAdvance', () => {
		it('returns a GSAP timeline', () => {
			const tl = metricsStepAdvance(makeNode(), 0xe5e7eb);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = metricsStepAdvance(makeNode(), 0xe5e7eb);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('metricsBatchUpdate', () => {
		it('returns a GSAP timeline', () => {
			const tl = metricsBatchUpdate(
				[makeNode(), makeNode(), makeNode()],
				[0xfbbf24, 0xa78bfa, 0x22d3ee],
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = metricsBatchUpdate([makeNode()], [0xfbbf24]);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty metrics', () => {
			const tl = metricsBatchUpdate([], []);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('metricsComplexityReveal', () => {
		it('returns a GSAP timeline', () => {
			const tl = metricsComplexityReveal(makeNode(), 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = metricsComplexityReveal(makeNode(), 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has longer duration than counter flash', () => {
			const flash = metricsCounterFlash(makeNode(), 0xfbbf24);
			const reveal = metricsComplexityReveal(makeNode(), 0x4ade80);
			expect(reveal.duration()).toBeGreaterThan(flash.duration());
		});
	});
});
