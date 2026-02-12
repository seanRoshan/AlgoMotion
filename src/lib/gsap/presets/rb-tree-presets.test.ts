/**
 * Tests for Red-Black Tree GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	rbBatchRecolor,
	rbDeleteFixup,
	rbInsertFixupCase1,
	rbInsertFixupCase2,
	rbLeftRotation,
	rbRecolor,
	rbRightRotation,
	rbUncleCheck,
} from './rb-tree-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
	position: { x: number; y: number };
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0x1f2937, position: { x: 100, y: 100 } };
}

const RED = 0xef4444;
const BLACK = 0x1f2937;
const HIGHLIGHT = 0x3b82f6;

describe('Red-Black Tree Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('rbRecolor', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbRecolor(makeNode(), RED, BLACK);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = rbRecolor(makeNode(), RED, BLACK);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('rbBatchRecolor', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbBatchRecolor([makeNode(), makeNode(), makeNode()], [BLACK, BLACK, RED]);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = rbBatchRecolor([makeNode(), makeNode()], [BLACK, RED]);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty nodes', () => {
			const tl = rbBatchRecolor([], []);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('rbLeftRotation', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				RED,
				BLACK,
				HIGHLIGHT,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = rbLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				RED,
				BLACK,
				HIGHLIGHT,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('rbRightRotation', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbRightRotation(
				makeNode(),
				makeNode(),
				{ x: 120, y: 160 },
				{ x: 100, y: 100 },
				RED,
				BLACK,
				HIGHLIGHT,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has same duration as left rotation', () => {
			const left = rbLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				RED,
				BLACK,
				HIGHLIGHT,
			);
			const right = rbRightRotation(
				makeNode(),
				makeNode(),
				{ x: 120, y: 160 },
				{ x: 100, y: 100 },
				RED,
				BLACK,
				HIGHLIGHT,
			);
			expect(right.duration()).toBe(left.duration());
		});
	});

	describe('rbInsertFixupCase1', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbInsertFixupCase1(makeNode(), makeNode(), makeNode(), BLACK, RED, HIGHLIGHT);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = rbInsertFixupCase1(makeNode(), makeNode(), makeNode(), BLACK, RED, HIGHLIGHT);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('rbInsertFixupCase2', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbInsertFixupCase2(
				makeNode(),
				makeNode(),
				makeNode(),
				{
					nodeTarget: { x: 100, y: 100 },
					parentTarget: { x: 80, y: 160 },
					grandparentTarget: { x: 120, y: 160 },
				},
				BLACK,
				RED,
				HIGHLIGHT,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has longer duration than single rotation', () => {
			const single = rbLeftRotation(
				makeNode(),
				makeNode(),
				{ x: 80, y: 160 },
				{ x: 100, y: 100 },
				RED,
				BLACK,
				HIGHLIGHT,
			);
			const double = rbInsertFixupCase2(
				makeNode(),
				makeNode(),
				makeNode(),
				{
					nodeTarget: { x: 100, y: 100 },
					parentTarget: { x: 80, y: 160 },
					grandparentTarget: { x: 120, y: 160 },
				},
				BLACK,
				RED,
				HIGHLIGHT,
			);
			expect(double.duration()).toBeGreaterThan(single.duration());
		});
	});

	describe('rbDeleteFixup', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbDeleteFixup(makeNode(), makeNode(), RED, HIGHLIGHT);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = rbDeleteFixup(makeNode(), makeNode(), RED, HIGHLIGHT);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('rbUncleCheck', () => {
		it('returns a GSAP timeline', () => {
			const tl = rbUncleCheck(makeNode(), HIGHLIGHT);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = rbUncleCheck(makeNode(), HIGHLIGHT);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});
});
