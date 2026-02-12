/**
 * Tests for Memory Hierarchy GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	memoryAccessComparison,
	memoryAddressTranslation,
	memoryPageFault,
	memoryTlbHit,
	memoryTlbMiss,
} from './memory-hierarchy-presets';

interface MockLevel {
	alpha: number;
	_fillColor: number;
}

function makeLevel(): MockLevel {
	return { alpha: 0.8, _fillColor: 0x2a2a4a };
}

describe('Memory Hierarchy Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('memoryAccessComparison', () => {
		it('returns a GSAP timeline', () => {
			const tl = memoryAccessComparison([makeLevel(), makeLevel(), makeLevel()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = memoryAccessComparison([makeLevel(), makeLevel()], 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has zero duration with empty levels', () => {
			const tl = memoryAccessComparison([], 0x3b82f6);
			expect(tl.duration()).toBe(0);
		});

		it('more levels have longer duration', () => {
			const two = memoryAccessComparison([makeLevel(), makeLevel()], 0x3b82f6);
			const four = memoryAccessComparison(
				[makeLevel(), makeLevel(), makeLevel(), makeLevel()],
				0x3b82f6,
			);
			expect(four.duration()).toBeGreaterThan(two.duration());
		});
	});

	describe('memoryPageFault', () => {
		it('returns a GSAP timeline', () => {
			const tl = memoryPageFault(
				makeLevel(),
				makeLevel(),
				makeLevel(),
				makeLevel(),
				0xef4444,
				0x22d3ee,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = memoryPageFault(
				makeLevel(),
				makeLevel(),
				makeLevel(),
				makeLevel(),
				0xef4444,
				0x22d3ee,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has significant duration for disk access', () => {
			const tl = memoryPageFault(
				makeLevel(),
				makeLevel(),
				makeLevel(),
				makeLevel(),
				0xef4444,
				0x22d3ee,
			);
			// Page fault should be longer than a simple hit
			expect(tl.duration()).toBeGreaterThan(1);
		});
	});

	describe('memoryTlbHit', () => {
		it('returns a GSAP timeline', () => {
			const tl = memoryTlbHit(makeLevel(), makeLevel(), 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = memoryTlbHit(makeLevel(), makeLevel(), 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('memoryTlbMiss', () => {
		it('returns a GSAP timeline', () => {
			const tl = memoryTlbMiss(makeLevel(), [makeLevel(), makeLevel()], 0xef4444, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = memoryTlbMiss(makeLevel(), [makeLevel()], 0xef4444, 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty walk levels', () => {
			const tl = memoryTlbMiss(makeLevel(), [], 0xef4444, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('duration scales with walk level count', () => {
			const short = memoryTlbMiss(makeLevel(), [makeLevel()], 0xef4444, 0x3b82f6);
			const long = memoryTlbMiss(
				makeLevel(),
				[makeLevel(), makeLevel(), makeLevel()],
				0xef4444,
				0x3b82f6,
			);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});

	describe('memoryAddressTranslation', () => {
		it('returns a GSAP timeline', () => {
			const tl = memoryAddressTranslation(makeLevel(), makeLevel(), makeLevel(), 0x22d3ee);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = memoryAddressTranslation(makeLevel(), makeLevel(), makeLevel(), 0x22d3ee);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});
});
