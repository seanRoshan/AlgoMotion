/**
 * Tests for Trie GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import { trieAutocomplete, trieDelete, trieInsert, triePrefixSearch } from './trie-presets';

interface MockNode {
	alpha: number;
	_fillColor: number;
}

function makeNode(): MockNode {
	return { alpha: 0.8, _fillColor: 0x2a2a4a };
}

describe('Trie Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('trieInsert', () => {
		it('returns a GSAP timeline', () => {
			const tl = trieInsert([makeNode()], [makeNode(), makeNode()], 0x3b82f6, 0x4ade80);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = trieInsert([makeNode()], [makeNode()], 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles all-new nodes', () => {
			const tl = trieInsert([], [makeNode(), makeNode(), makeNode()], 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles all-existing path', () => {
			const tl = trieInsert([makeNode(), makeNode()], [], 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('longer path has longer duration', () => {
			const short = trieInsert([makeNode()], [makeNode()], 0x3b82f6, 0x4ade80);
			const long = trieInsert(
				[makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode()],
				0x3b82f6,
				0x4ade80,
			);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});

	describe('triePrefixSearch', () => {
		it('returns a GSAP timeline', () => {
			const tl = triePrefixSearch([makeNode(), makeNode()], 0x3b82f6, 0x4ade80, true);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = triePrefixSearch([makeNode(), makeNode()], 0x3b82f6, 0x4ade80, true);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty path', () => {
			const tl = triePrefixSearch([], 0x3b82f6, 0x4ade80, false);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});

		it('works for both found and not-found', () => {
			const found = triePrefixSearch([makeNode()], 0x3b82f6, 0x4ade80, true);
			const notFound = triePrefixSearch([makeNode()], 0x3b82f6, 0x4ade80, false);
			expect(found.duration()).toBeGreaterThan(0);
			expect(notFound.duration()).toBeGreaterThan(0);
		});
	});

	describe('trieDelete', () => {
		it('returns a GSAP timeline', () => {
			const tl = trieDelete([makeNode(), makeNode()], [makeNode()], 0x3b82f6, 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = trieDelete([makeNode()], [makeNode()], 0x3b82f6, 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles no nodes to remove', () => {
			const tl = trieDelete([makeNode(), makeNode()], [], 0x3b82f6, 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('longer deletion has longer duration', () => {
			const short = trieDelete([makeNode()], [makeNode()], 0x3b82f6, 0xef4444);
			const long = trieDelete(
				[makeNode(), makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode()],
				0x3b82f6,
				0xef4444,
			);
			expect(long.duration()).toBeGreaterThan(short.duration());
		});
	});

	describe('trieAutocomplete', () => {
		it('returns a GSAP timeline', () => {
			const tl = trieAutocomplete(
				[makeNode(), makeNode()],
				[makeNode(), makeNode(), makeNode()],
				0x3b82f6,
				0x4ade80,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = trieAutocomplete([makeNode()], [makeNode(), makeNode()], 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles no completions', () => {
			const tl = trieAutocomplete([makeNode()], [], 0x3b82f6, 0x4ade80);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('more completions means longer duration', () => {
			const few = trieAutocomplete([makeNode()], [makeNode()], 0x3b82f6, 0x4ade80);
			const many = trieAutocomplete(
				[makeNode()],
				[makeNode(), makeNode(), makeNode(), makeNode(), makeNode()],
				0x3b82f6,
				0x4ade80,
			);
			expect(many.duration()).toBeGreaterThan(few.duration());
		});
	});
});
