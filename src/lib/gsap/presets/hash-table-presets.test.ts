/**
 * Tests for Hash Table GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	hashCompute,
	hashDelete,
	hashInsert,
	hashInsertCollision,
	hashResize,
	hashSearch,
} from './hash-table-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0x2a2a4a };
}

describe('Hash Table Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('hashCompute', () => {
		it('returns a GSAP timeline', () => {
			const tl = hashCompute(makeNode(), 0xfbbf24, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = hashCompute(makeNode(), 0xfbbf24, 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('hashInsert', () => {
		it('returns a GSAP timeline', () => {
			const tl = hashInsert(makeNode(), makeNode(), 0x3b82f6, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = hashInsert(makeNode(), makeNode(), 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('hashInsertCollision', () => {
		it('returns a GSAP timeline', () => {
			const tl = hashInsertCollision(makeNode(), [makeNode()], makeNode(), 0xf97316, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = hashInsertCollision(
				makeNode(),
				[makeNode(), makeNode()],
				makeNode(),
				0xf97316,
				0x4ade80,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has longer duration than simple insert', () => {
			const simple = hashInsert(makeNode(), makeNode(), 0x3b82f6, 0x4ade80);
			const collision = hashInsertCollision(
				makeNode(),
				[makeNode()],
				makeNode(),
				0xf97316,
				0x4ade80,
			);
			expect(collision.duration()).toBeGreaterThan(simple.duration());
		});
	});

	describe('hashSearch', () => {
		it('returns a GSAP timeline', () => {
			const tl = hashSearch(makeNode(), [makeNode(), makeNode()], makeNode(), 0x3b82f6, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = hashSearch(makeNode(), [makeNode()], makeNode(), 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('works with not-found (null)', () => {
			const tl = hashSearch(makeNode(), [makeNode()], null, 0x3b82f6, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('longer chain means longer duration', () => {
			const short = hashSearch(makeNode(), [makeNode()], makeNode(), 0x3b82f6, 0x4ade80);
			const long = hashSearch(
				makeNode(),
				[makeNode(), makeNode(), makeNode(), makeNode()],
				makeNode(),
				0x3b82f6,
				0x4ade80,
			);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});

	describe('hashDelete', () => {
		it('returns a GSAP timeline', () => {
			const tl = hashDelete(makeNode(), [makeNode()], makeNode(), 0x3b82f6, 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = hashDelete(makeNode(), [makeNode()], makeNode(), 0x3b82f6, 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('hashResize', () => {
		it('returns a GSAP timeline', () => {
			const tl = hashResize(
				[makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode(), makeNode()],
				0xfbbf24,
				0x2a2a4a,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = hashResize([makeNode()], [makeNode(), makeNode()], 0xfbbf24, 0x2a2a4a);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty old entries', () => {
			const tl = hashResize([], [makeNode(), makeNode()], 0xfbbf24, 0x2a2a4a);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('more entries means longer duration', () => {
			const small = hashResize([makeNode()], [makeNode()], 0xfbbf24, 0x2a2a4a);
			const large = hashResize(
				[makeNode(), makeNode(), makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode(), makeNode()],
				0xfbbf24,
				0x2a2a4a,
			);
			expect(large.duration()).toBeGreaterThan(small.duration());
		});
	});
});
