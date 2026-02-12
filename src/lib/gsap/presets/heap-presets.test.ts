/**
 * Tests for Heap GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	heapArrayTreeSync,
	heapBuildFloyd,
	heapExtract,
	heapSiftDown,
	heapSiftUp,
} from './heap-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
	position: { x: number; y: number };
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0x2a2a4a, position: { x: 100, y: 100 } };
}

describe('Heap Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('heapSiftUp', () => {
		it('returns a GSAP timeline', () => {
			const tl = heapSiftUp([makeNode(), makeNode(), makeNode()], 0x4ade80, 0xf97316);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = heapSiftUp([makeNode(), makeNode()], 0x4ade80, 0xf97316);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty path', () => {
			const tl = heapSiftUp([], 0x4ade80, 0xf97316);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});

		it('duration scales with path length', () => {
			const short = heapSiftUp([makeNode(), makeNode()], 0x4ade80, 0xf97316);
			const long = heapSiftUp([makeNode(), makeNode(), makeNode(), makeNode()], 0x4ade80, 0xf97316);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});

	describe('heapSiftDown', () => {
		it('returns a GSAP timeline', () => {
			const tl = heapSiftDown([makeNode(), makeNode()], 0x3b82f6, 0xf97316);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = heapSiftDown([makeNode(), makeNode(), makeNode()], 0x3b82f6, 0xf97316);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty path', () => {
			const tl = heapSiftDown([], 0x3b82f6, 0xf97316);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('heapExtract', () => {
		it('returns a GSAP timeline', () => {
			const tl = heapExtract(
				makeNode(),
				makeNode(),
				[makeNode(), makeNode()],
				0xef4444,
				0xfbbf24,
				0x3b82f6,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = heapExtract(makeNode(), makeNode(), [makeNode()], 0xef4444, 0xfbbf24, 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has longer duration than sift down alone', () => {
			const sift = heapSiftDown([makeNode(), makeNode()], 0x3b82f6, 0xf97316);
			const extract = heapExtract(
				makeNode(),
				makeNode(),
				[makeNode(), makeNode()],
				0xef4444,
				0xfbbf24,
				0x3b82f6,
			);
			expect(extract.duration()).toBeGreaterThan(sift.duration());
		});
	});

	describe('heapBuildFloyd', () => {
		it('returns a GSAP timeline', () => {
			const tl = heapBuildFloyd([makeNode(), makeNode(), makeNode()], 0xf97316, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = heapBuildFloyd([makeNode(), makeNode()], 0xf97316, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty nodes', () => {
			const tl = heapBuildFloyd([], 0xf97316, 0x4ade80);
			expect(tl.duration()).toBe(0);
		});

		it('duration scales with node count', () => {
			const short = heapBuildFloyd([makeNode()], 0xf97316, 0x4ade80);
			const long = heapBuildFloyd(
				[makeNode(), makeNode(), makeNode(), makeNode()],
				0xf97316,
				0x4ade80,
			);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});

	describe('heapArrayTreeSync', () => {
		it('returns a GSAP timeline', () => {
			const tl = heapArrayTreeSync([makeNode(), makeNode()], [makeNode(), makeNode()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = heapArrayTreeSync(
				[makeNode(), makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode()],
				0x3b82f6,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty arrays', () => {
			const tl = heapArrayTreeSync([], [], 0x3b82f6);
			expect(tl.duration()).toBe(0);
		});

		it('handles mismatched lengths', () => {
			const tl = heapArrayTreeSync([makeNode(), makeNode(), makeNode()], [makeNode()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});
});
