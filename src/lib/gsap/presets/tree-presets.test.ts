import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	treeHighlightPath,
	treeInsert,
	treeRemove,
	treeRotateLeft,
	treeRotateRight,
	treeTraverseInOrder,
	treeTraverseLevelOrder,
	treeTraversePreOrder,
} from './tree-presets';

/**
 * Create mock tree node objects that mimic Pixi.js Container position/style.
 * GSAP will actually mutate these objects during tests.
 */
function createMockTreeNodes(count: number) {
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
			position: { x: i * 60, y: Math.floor(i / 2) * 60 },
			alpha: 1,
			scale: { x: 1, y: 1 },
			_fillColor: 0x2a2a4a,
		};
	}

	return nodes;
}

describe('Tree Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	afterEach(() => {
		gsap.globalTimeline.clear();
	});

	describe('treeInsert', () => {
		it('creates a timeline that fades in a new node', () => {
			const newNode = {
				position: { x: 100, y: 120 },
				alpha: 0,
				scale: { x: 0, y: 0 },
				_fillColor: 0x2a2a4a,
			};
			const tl = treeInsert(newNode);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);

			tl.progress(1);

			// New node should be fully visible and scaled
			expect(newNode.alpha).toBe(1);
			expect(newNode.scale.x).toBeCloseTo(1);
			expect(newNode.scale.y).toBeCloseTo(1);
		});
	});

	describe('treeRemove', () => {
		it('creates a timeline that fades out a node', () => {
			const nodes = createMockTreeNodes(3);
			const tl = treeRemove(nodes.n2);

			tl.progress(1);

			expect(nodes.n2.alpha).toBe(0);
		});
	});

	describe('treeRotateLeft', () => {
		it('creates a timeline that swaps parent-child positions', () => {
			const pivot = {
				position: { x: 100, y: 60 },
				alpha: 1,
				scale: { x: 1, y: 1 },
				_fillColor: 0x2a2a4a,
			};
			const parent = {
				position: { x: 100, y: 0 },
				alpha: 1,
				scale: { x: 1, y: 1 },
				_fillColor: 0x2a2a4a,
			};

			const tl = treeRotateLeft(parent, pivot);
			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);

			tl.progress(1);

			// After left rotation, pivot moves up and parent moves down-left
			expect(pivot.position.y).toBeLessThan(parent.position.y);
		});
	});

	describe('treeRotateRight', () => {
		it('creates a timeline that performs a right rotation', () => {
			const pivot = {
				position: { x: 50, y: 60 },
				alpha: 1,
				scale: { x: 1, y: 1 },
				_fillColor: 0x2a2a4a,
			};
			const parent = {
				position: { x: 100, y: 0 },
				alpha: 1,
				scale: { x: 1, y: 1 },
				_fillColor: 0x2a2a4a,
			};

			const tl = treeRotateRight(parent, pivot);
			expect(tl).toBeDefined();
			tl.progress(1);

			// After right rotation, pivot moves up
			expect(pivot.position.y).toBeLessThan(parent.position.y);
		});
	});

	describe('treeTraverseInOrder', () => {
		it('creates a timeline that highlights nodes in in-order sequence', () => {
			const nodes = createMockTreeNodes(5);
			// In-order traversal order: n4, n2, n5, n1, n3 (for a typical BST)
			const order = ['n4', 'n2', 'n5', 'n1', 'n3'];
			const highlightColor = 0x3b82f6;

			const tl = treeTraverseInOrder(nodes, order, highlightColor);
			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('treeTraversePreOrder', () => {
		it('creates a timeline that highlights nodes in pre-order sequence', () => {
			const nodes = createMockTreeNodes(5);
			const order = ['n1', 'n2', 'n4', 'n5', 'n3'];
			const highlightColor = 0x3b82f6;

			const tl = treeTraversePreOrder(nodes, order, highlightColor);
			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('treeTraverseLevelOrder', () => {
		it('creates a timeline that highlights nodes level by level', () => {
			const nodes = createMockTreeNodes(5);
			const levels = [['n1'], ['n2', 'n3'], ['n4', 'n5']];
			const highlightColor = 0x3b82f6;

			const tl = treeTraverseLevelOrder(nodes, levels, highlightColor);
			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('treeHighlightPath', () => {
		it('creates a timeline that highlights nodes along a search path', () => {
			const nodes = createMockTreeNodes(5);
			const path = ['n1', 'n2', 'n5']; // root → left → right
			const highlightColor = 0x10b981;

			const tl = treeHighlightPath(nodes, path, highlightColor);
			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);

			tl.progress(1);

			// All path nodes should have the highlight color
			expect(nodes.n1._fillColor).toBe(highlightColor);
			expect(nodes.n2._fillColor).toBe(highlightColor);
			expect(nodes.n5._fillColor).toBe(highlightColor);
		});
	});
});
