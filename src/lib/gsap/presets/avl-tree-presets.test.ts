/**
 * Tests for AVL Tree GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	avlHeightUpdate,
	avlInsertRebalance,
	avlLeftRightRotation,
	avlLeftRotation,
	avlRightLeftRotation,
	avlRightRotation,
} from './avl-tree-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
	position: { x: number; y: number };
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0x2a2a4a, position: { x: 100, y: 100 } };
}

describe('AVL Tree Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('avlInsertRebalance', () => {
		it('returns a GSAP timeline', () => {
			const tl = avlInsertRebalance([makeNode(), makeNode()], makeNode(), 0x4ade80, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = avlInsertRebalance([makeNode()], makeNode(), 0x4ade80, 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('duration scales with path length', () => {
			const short = avlInsertRebalance([makeNode()], makeNode(), 0x4ade80, 0x3b82f6);
			const long = avlInsertRebalance(
				[makeNode(), makeNode(), makeNode(), makeNode()],
				makeNode(),
				0x4ade80,
				0x3b82f6,
			);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});

		it('handles empty path', () => {
			const tl = avlInsertRebalance([], makeNode(), 0x4ade80, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('avlLeftRotation', () => {
		it('returns a GSAP timeline', () => {
			const tl = avlLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				0xf97316,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = avlLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				0xf97316,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('avlRightRotation', () => {
		it('returns a GSAP timeline', () => {
			const tl = avlRightRotation(
				makeNode(),
				makeNode(),
				{ x: 120, y: 160 },
				{ x: 100, y: 100 },
				0xf97316,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = avlRightRotation(
				makeNode(),
				makeNode(),
				{ x: 120, y: 160 },
				{ x: 100, y: 100 },
				0xf97316,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('avlLeftRightRotation', () => {
		it('returns a GSAP timeline', () => {
			const tl = avlLeftRightRotation(
				makeNode(),
				makeNode(),
				makeNode(),
				{
					rootTarget: { x: 120, y: 160 },
					leftTarget: { x: 80, y: 160 },
					lrTarget: { x: 100, y: 100 },
				},
				0xf97316,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has longer duration than single rotation', () => {
			const single = avlLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				0xf97316,
			);
			const double = avlLeftRightRotation(
				makeNode(),
				makeNode(),
				makeNode(),
				{
					rootTarget: { x: 120, y: 160 },
					leftTarget: { x: 80, y: 160 },
					lrTarget: { x: 100, y: 100 },
				},
				0xf97316,
			);
			expect(double.duration()).toBeGreaterThan(single.duration());
		});
	});

	describe('avlRightLeftRotation', () => {
		it('returns a GSAP timeline', () => {
			const tl = avlRightLeftRotation(
				makeNode(),
				makeNode(),
				makeNode(),
				{
					rootTarget: { x: 80, y: 160 },
					rightTarget: { x: 120, y: 160 },
					rlTarget: { x: 100, y: 100 },
				},
				0xf97316,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = avlRightLeftRotation(
				makeNode(),
				makeNode(),
				makeNode(),
				{
					rootTarget: { x: 80, y: 160 },
					rightTarget: { x: 120, y: 160 },
					rlTarget: { x: 100, y: 100 },
				},
				0xf97316,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('avlHeightUpdate', () => {
		it('returns a GSAP timeline', () => {
			const tl = avlHeightUpdate([makeNode(), makeNode(), makeNode()], 0xfbbf24);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = avlHeightUpdate([makeNode(), makeNode()], 0xfbbf24);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has zero duration with empty nodes', () => {
			const tl = avlHeightUpdate([], 0xfbbf24);
			expect(tl.duration()).toBe(0);
		});

		it('duration scales with node count', () => {
			const short = avlHeightUpdate([makeNode()], 0xfbbf24);
			const long = avlHeightUpdate([makeNode(), makeNode(), makeNode(), makeNode()], 0xfbbf24);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});
});
