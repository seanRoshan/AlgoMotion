import gsap from 'gsap';

/**
 * Minimal interface for animatable graph node objects.
 */
interface AnimatableNode {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

/**
 * Minimal interface for animatable graph edge objects.
 */
interface AnimatableEdge {
	alpha: number;
	_strokeColor: number;
}

const STEP_DURATION = 0.35;

/**
 * BFS wavefront: highlight nodes level by level.
 * Each level lights up simultaneously, then the next level.
 *
 * Spec reference: Section 6.3.3 (Graph BFS)
 */
export function graphBfsWavefront(
	nodes: Record<string, AnimatableNode>,
	levels: string[][],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
		const startTime = levelIdx * STEP_DURATION;

		for (const nodeId of levels[levelIdx]) {
			const node = nodes[nodeId];
			if (!node) continue;

			// Scale pulse
			tl.to(node.scale, { x: 1.2, y: 1.2, duration: 0.12, ease: 'power2.out' }, startTime);
			tl.to(node.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' }, startTime + 0.12);

			// Color highlight
			tl.to(node, { _fillColor: highlightColor, duration: 0.15 }, startTime);
		}
	}

	return tl;
}

/**
 * DFS traversal: highlight nodes one by one in DFS order.
 *
 * Spec reference: Section 6.3.3 (Graph DFS)
 */
export function graphDfsTraversal(
	nodes: Record<string, AnimatableNode>,
	order: string[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < order.length; i++) {
		const node = nodes[order[i]];
		if (!node) continue;

		const startTime = i * STEP_DURATION;

		// Scale pulse
		tl.to(node.scale, { x: 1.2, y: 1.2, duration: 0.12, ease: 'power2.out' }, startTime);
		tl.to(node.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' }, startTime + 0.12);

		// Color highlight
		tl.to(node, { _fillColor: highlightColor, duration: 0.15 }, startTime);
	}

	return tl;
}

/**
 * Highlight shortest path: sequentially highlight nodes and edges along a path.
 *
 * Spec reference: Section 6.3.3 (Shortest path highlight)
 */
export function graphHighlightPath(
	nodes: Record<string, AnimatableNode>,
	edges: Record<string, AnimatableEdge>,
	pathNodes: string[],
	pathEdges: string[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < pathNodes.length; i++) {
		const node = nodes[pathNodes[i]];
		if (!node) continue;

		const startTime = i * 0.2;

		// Highlight node
		tl.to(node.scale, { x: 1.15, y: 1.15, duration: 0.1, ease: 'power2.out' }, startTime);
		tl.to(node.scale, { x: 1, y: 1, duration: 0.1, ease: 'power2.in' }, startTime + 0.1);
		tl.to(node, { _fillColor: highlightColor, duration: 0.15 }, startTime);

		// Highlight the edge from this node to the next
		if (i < pathEdges.length) {
			const edge = edges[pathEdges[i]];
			if (edge) {
				tl.to(edge, { _strokeColor: highlightColor, duration: 0.15 }, startTime + 0.1);
			}
		}
	}

	return tl;
}

/**
 * MST growth: progressively highlight edges in the order they're added to the MST.
 * Used for Prim's and Kruskal's algorithm visualization.
 */
export function graphMstGrow(
	edges: Record<string, AnimatableEdge>,
	mstOrder: string[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < mstOrder.length; i++) {
		const edge = edges[mstOrder[i]];
		if (!edge) continue;

		const startTime = i * 0.3;

		// Flash then persist the highlight color
		tl.to(edge, { alpha: 0.5, duration: 0.08 }, startTime);
		tl.to(edge, { alpha: 1, duration: 0.08 }, startTime + 0.08);
		tl.to(edge, { _strokeColor: highlightColor, duration: 0.2 }, startTime);
	}

	return tl;
}

/**
 * Edge relaxation: animate a distance update during Dijkstra/Bellman-Ford.
 * The source node pulses, the edge flashes, and the target node updates.
 */
export function graphEdgeRelax(
	source: AnimatableNode,
	target: AnimatableNode,
	edge: AnimatableEdge,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Source pulse
	tl.to(source.scale, { x: 1.15, y: 1.15, duration: 0.1, ease: 'power2.out' }, 0);
	tl.to(source.scale, { x: 1, y: 1, duration: 0.1, ease: 'power2.in' }, 0.1);

	// Edge flash
	tl.to(edge, { _strokeColor: highlightColor, duration: 0.15 }, 0.1);

	// Target highlight
	tl.to(target.scale, { x: 1.15, y: 1.15, duration: 0.1, ease: 'power2.out' }, 0.2);
	tl.to(target.scale, { x: 1, y: 1, duration: 0.1, ease: 'power2.in' }, 0.3);
	tl.to(target, { _fillColor: highlightColor, duration: 0.15 }, 0.2);

	return tl;
}
