import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	graphBfsWavefront,
	graphDfsTraversal,
	graphEdgeRelax,
	graphHighlightPath,
	graphMstGrow,
} from './graph-presets';

/**
 * Create mock graph node objects for GSAP animation testing.
 */
function createMockGraphNodes(ids: string[]) {
	const nodes: Record<
		string,
		{
			position: { x: number; y: number };
			alpha: number;
			scale: { x: number; y: number };
			_fillColor: number;
		}
	> = {};

	for (let i = 0; i < ids.length; i++) {
		nodes[ids[i]] = {
			position: { x: i * 80, y: (i % 2) * 60 },
			alpha: 1,
			scale: { x: 1, y: 1 },
			_fillColor: 0x2a2a4a,
		};
	}

	return nodes;
}

/**
 * Create mock edge objects for GSAP animation testing.
 */
function createMockEdges(keys: string[]) {
	const edges: Record<
		string,
		{
			alpha: number;
			_strokeColor: number;
		}
	> = {};

	for (const key of keys) {
		edges[key] = {
			alpha: 1,
			_strokeColor: 0x4a4a6a,
		};
	}

	return edges;
}

describe('Graph Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	afterEach(() => {
		gsap.globalTimeline.clear();
	});

	describe('graphBfsWavefront', () => {
		it('creates a timeline that highlights nodes level by level', () => {
			const nodes = createMockGraphNodes(['A', 'B', 'C', 'D']);
			const levels = [['A'], ['B', 'C'], ['D']];
			const highlightColor = 0x3b82f6;

			const tl = graphBfsWavefront(nodes, levels, highlightColor);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('graphDfsTraversal', () => {
		it('creates a timeline that highlights nodes in DFS order', () => {
			const nodes = createMockGraphNodes(['A', 'B', 'C', 'D']);
			const order = ['A', 'B', 'D', 'C'];
			const highlightColor = 0x3b82f6;

			const tl = graphDfsTraversal(nodes, order, highlightColor);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('graphHighlightPath', () => {
		it('highlights nodes and edges along a path', () => {
			const nodes = createMockGraphNodes(['A', 'B', 'C', 'D']);
			const edges = createMockEdges(['A->B', 'B->D']);
			const path = ['A', 'B', 'D'];
			const pathEdges = ['A->B', 'B->D'];
			const highlightColor = 0x10b981;

			const tl = graphHighlightPath(nodes, edges, path, pathEdges, highlightColor);

			tl.progress(1);

			// All path nodes should be highlighted
			expect(nodes.A._fillColor).toBe(highlightColor);
			expect(nodes.B._fillColor).toBe(highlightColor);
			expect(nodes.D._fillColor).toBe(highlightColor);

			// Path edges should be highlighted
			expect(edges['A->B']._strokeColor).toBe(highlightColor);
			expect(edges['B->D']._strokeColor).toBe(highlightColor);
		});
	});

	describe('graphMstGrow', () => {
		it('creates a timeline that progressively highlights MST edges', () => {
			const edges = createMockEdges(['A->C', 'C->D', 'A->B']);
			const mstOrder = ['A->C', 'C->D', 'A->B'];
			const highlightColor = 0x10b981;

			const tl = graphMstGrow(edges, mstOrder, highlightColor);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);

			tl.progress(1);

			// All MST edges should be highlighted
			expect(edges['A->C']._strokeColor).toBe(highlightColor);
			expect(edges['C->D']._strokeColor).toBe(highlightColor);
			expect(edges['A->B']._strokeColor).toBe(highlightColor);
		});
	});

	describe('graphEdgeRelax', () => {
		it('creates a timeline that animates edge weight updates', () => {
			const nodes = createMockGraphNodes(['A', 'B']);
			const edge = { alpha: 1, _strokeColor: 0x4a4a6a };
			const highlightColor = 0xf59e0b;

			const tl = graphEdgeRelax(nodes.A, nodes.B, edge, highlightColor);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});
});
