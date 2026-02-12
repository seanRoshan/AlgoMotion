import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	linkedListDelete,
	linkedListInsert,
	linkedListReverse,
	linkedListSearch,
	linkedListTraverse,
} from './linked-list-presets';

function createMockNodes(count: number) {
	const nodes: Record<
		string,
		{
			position: { x: number; y: number };
			alpha: number;
			scale: { x: number; y: number };
			_fillColor: number;
		}
	> = {};

	for (let i = 0; i < count; i++) {
		nodes[`n${i + 1}`] = {
			position: { x: i * 90, y: 0 },
			alpha: 1,
			scale: { x: 1, y: 1 },
			_fillColor: 0x2a2a4a,
		};
	}

	return nodes;
}

describe('Linked List Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	afterEach(() => {
		gsap.globalTimeline.clear();
	});

	describe('linkedListInsert', () => {
		it('creates a timeline that fades in a new node', () => {
			const newNode = {
				position: { x: 180, y: 0 },
				alpha: 0,
				scale: { x: 0, y: 0 },
				_fillColor: 0x2a2a4a,
			};
			const tl = linkedListInsert(newNode);

			tl.progress(1);

			expect(newNode.alpha).toBe(1);
			expect(newNode.scale.x).toBeCloseTo(1);
		});
	});

	describe('linkedListDelete', () => {
		it('creates a timeline that fades out a node', () => {
			const nodes = createMockNodes(3);
			const tl = linkedListDelete(nodes.n2);

			tl.progress(1);

			expect(nodes.n2.alpha).toBe(0);
		});
	});

	describe('linkedListTraverse', () => {
		it('creates a timeline that highlights nodes sequentially', () => {
			const nodes = createMockNodes(3);
			const order = ['n1', 'n2', 'n3'];
			const highlightColor = 0x3b82f6;

			const tl = linkedListTraverse(nodes, order, highlightColor);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('linkedListReverse', () => {
		it('creates a timeline with nonzero duration', () => {
			const nodes = createMockNodes(3);
			const order = ['n1', 'n2', 'n3'];

			const tl = linkedListReverse(nodes, order);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('linkedListSearch', () => {
		it('highlights nodes along the search path', () => {
			const nodes = createMockNodes(3);
			const path = ['n1', 'n2'];
			const foundColor = 0x10b981;
			const searchColor = 0x3b82f6;

			const tl = linkedListSearch(nodes, path, 'n2', searchColor, foundColor);

			tl.progress(1);

			// Found node should have the found color
			expect(nodes.n2._fillColor).toBe(foundColor);
		});
	});
});
