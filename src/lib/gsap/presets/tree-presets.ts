import gsap from 'gsap';

/**
 * Minimal interface for animatable tree node objects.
 * Matches the Pixi.js Container properties that GSAP manipulates.
 */
interface AnimatableNode {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

/** Default animation durations for tree operations. */
const NODE_APPEAR_DURATION = 0.3;
const NODE_FADE_DURATION = 0.25;
const TRAVERSE_STEP_DURATION = 0.4;
const ROTATION_DURATION = 0.4;

/**
 * Insert a new node into the tree — fade in and scale from zero.
 *
 * Spec reference: Section 9.3 (Tree insert preset)
 */
export function treeInsert(newNode: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(newNode, { alpha: 1, duration: NODE_APPEAR_DURATION, ease: 'power2.out' }, 0);
	tl.to(newNode.scale, { x: 1, y: 1, duration: NODE_APPEAR_DURATION, ease: 'back.out' }, 0);

	return tl;
}

/**
 * Remove a node from the tree — fade out and shrink.
 */
export function treeRemove(node: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(node, { alpha: 0, duration: NODE_FADE_DURATION, ease: 'power1.in' }, 0);
	tl.to(node.scale, { x: 0.5, y: 0.5, duration: NODE_FADE_DURATION, ease: 'power1.in' }, 0);

	return tl;
}

/**
 * Left rotation: pivot (right child) moves up, parent moves down-left.
 * Animates position swap between parent and its right child.
 */
export function treeRotateLeft(parent: AnimatableNode, pivot: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	const parentTarget = { x: pivot.position.x, y: pivot.position.y };
	const pivotTarget = { x: parent.position.x, y: parent.position.y };

	// Animate parent down to pivot's position
	tl.to(
		parent.position,
		{
			x: parentTarget.x,
			y: parentTarget.y,
			duration: ROTATION_DURATION,
			ease: 'power2.inOut',
		},
		0,
	);

	// Animate pivot up to parent's position
	tl.to(
		pivot.position,
		{
			x: pivotTarget.x,
			y: pivotTarget.y,
			duration: ROTATION_DURATION,
			ease: 'power2.inOut',
		},
		0,
	);

	return tl;
}

/**
 * Right rotation: pivot (left child) moves up, parent moves down-right.
 * Animates position swap between parent and its left child.
 */
export function treeRotateRight(parent: AnimatableNode, pivot: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	const parentTarget = { x: pivot.position.x, y: pivot.position.y };
	const pivotTarget = { x: parent.position.x, y: parent.position.y };

	tl.to(
		parent.position,
		{
			x: parentTarget.x,
			y: parentTarget.y,
			duration: ROTATION_DURATION,
			ease: 'power2.inOut',
		},
		0,
	);

	tl.to(
		pivot.position,
		{
			x: pivotTarget.x,
			y: pivotTarget.y,
			duration: ROTATION_DURATION,
			ease: 'power2.inOut',
		},
		0,
	);

	return tl;
}

/**
 * In-order traversal: highlight nodes in LNR (left-node-right) sequence.
 * Each node gets a scale pulse and color change in sequence.
 */
export function treeTraverseInOrder(
	nodes: Record<string, AnimatableNode>,
	order: string[],
	highlightColor: number,
): gsap.core.Timeline {
	return createTraversalTimeline(nodes, order, highlightColor);
}

/**
 * Pre-order traversal: highlight nodes in NLR (node-left-right) sequence.
 */
export function treeTraversePreOrder(
	nodes: Record<string, AnimatableNode>,
	order: string[],
	highlightColor: number,
): gsap.core.Timeline {
	return createTraversalTimeline(nodes, order, highlightColor);
}

/**
 * Level-order (BFS) traversal: highlight nodes level by level.
 * Each level highlights simultaneously, then moves to the next.
 */
export function treeTraverseLevelOrder(
	nodes: Record<string, AnimatableNode>,
	levels: string[][],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
		const startTime = levelIdx * TRAVERSE_STEP_DURATION;

		for (const nodeId of levels[levelIdx]) {
			const node = nodes[nodeId];
			if (!node) continue;

			// Scale pulse
			tl.to(node.scale, { x: 1.2, y: 1.2, duration: 0.15, ease: 'power2.out' }, startTime);
			tl.to(node.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.in' }, startTime + 0.15);

			// Color highlight
			tl.to(node, { _fillColor: highlightColor, duration: 0.2 }, startTime);
		}
	}

	return tl;
}

/**
 * Highlight a search path from root to target node.
 * Nodes along the path are highlighted sequentially with a persistent color change.
 */
export function treeHighlightPath(
	nodes: Record<string, AnimatableNode>,
	path: string[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < path.length; i++) {
		const node = nodes[path[i]];
		if (!node) continue;

		const startTime = i * 0.25;

		// Scale pulse
		tl.to(node.scale, { x: 1.2, y: 1.2, duration: 0.12, ease: 'power2.out' }, startTime);
		tl.to(node.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' }, startTime + 0.12);

		// Persistent color change (stays highlighted)
		tl.to(node, { _fillColor: highlightColor, duration: 0.15 }, startTime);
	}

	return tl;
}

/**
 * Shared traversal timeline builder.
 * Highlights nodes one by one in the given order with scale pulse + color change.
 */
function createTraversalTimeline(
	nodes: Record<string, AnimatableNode>,
	order: string[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < order.length; i++) {
		const node = nodes[order[i]];
		if (!node) continue;

		const startTime = i * TRAVERSE_STEP_DURATION;

		// Scale pulse
		tl.to(node.scale, { x: 1.2, y: 1.2, duration: 0.15, ease: 'power2.out' }, startTime);
		tl.to(node.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.in' }, startTime + 0.15);

		// Color highlight
		tl.to(node, { _fillColor: highlightColor, duration: 0.2 }, startTime);
	}

	return tl;
}
