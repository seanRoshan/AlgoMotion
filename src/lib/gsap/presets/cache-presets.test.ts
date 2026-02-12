/**
 * Tests for Cache Hierarchy GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import { cacheColdStart, cacheHit, cacheLruEviction, cacheMiss, cacheWrite } from './cache-presets';

interface MockLevel {
	alpha: number;
	_fillColor: number;
}

interface MockLine {
	alpha: number;
	_fillColor: number;
}

function makeLevel(): MockLevel {
	return { alpha: 1, _fillColor: 0x2a2a4a };
}

function makeLine(): MockLine {
	return { alpha: 0.8, _fillColor: 0x2a2a4a };
}

describe('Cache Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('cacheHit', () => {
		it('returns a GSAP timeline', () => {
			const tl = cacheHit(makeLevel(), makeLine(), 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cacheHit(makeLevel(), makeLine(), 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cacheMiss', () => {
		it('returns a GSAP timeline', () => {
			const tl = cacheMiss(makeLevel(), makeLevel(), 0xef4444, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cacheMiss(makeLevel(), makeLevel(), 0xef4444, 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cacheLruEviction', () => {
		it('returns a GSAP timeline', () => {
			const tl = cacheLruEviction(makeLine(), makeLine(), 0xef4444, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cacheLruEviction(makeLine(), makeLine(), 0xef4444, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cacheWrite', () => {
		it('returns a GSAP timeline for write-back', () => {
			const tl = cacheWrite(makeLine(), null, 0xfbbf24, false);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('returns a GSAP timeline for write-through', () => {
			const tl = cacheWrite(makeLine(), makeLevel(), 0xfbbf24, true);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration for write-back', () => {
			const tl = cacheWrite(makeLine(), null, 0xfbbf24, false);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has positive duration for write-through', () => {
			const tl = cacheWrite(makeLine(), makeLevel(), 0xfbbf24, true);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('write-through has longer duration than write-back', () => {
			const wb = cacheWrite(makeLine(), null, 0xfbbf24, false);
			const wt = cacheWrite(makeLine(), makeLevel(), 0xfbbf24, true);
			expect(wt.duration()).toBeGreaterThan(wb.duration());
		});
	});

	describe('cacheColdStart', () => {
		it('returns a GSAP timeline', () => {
			const tl = cacheColdStart([makeLevel(), makeLevel(), makeLevel()], 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration with levels', () => {
			const tl = cacheColdStart([makeLevel(), makeLevel()], 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has zero duration with empty levels', () => {
			const tl = cacheColdStart([], 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});

		it('duration scales with level count', () => {
			const two = cacheColdStart([makeLevel(), makeLevel()], 0xef4444);
			const four = cacheColdStart([makeLevel(), makeLevel(), makeLevel(), makeLevel()], 0xef4444);
			expect(four.duration()).toBeGreaterThan(two.duration());
		});

		it('accepts custom miss delay', () => {
			const fast = cacheColdStart([makeLevel(), makeLevel()], 0xef4444, 0.1);
			const slow = cacheColdStart([makeLevel(), makeLevel()], 0xef4444, 0.5);
			expect(slow.duration()).toBeGreaterThan(fast.duration());
		});
	});
});
