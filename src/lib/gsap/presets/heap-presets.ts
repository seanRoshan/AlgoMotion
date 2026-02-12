/**
 * GSAP animation presets for Heap composite.
 *
 * Provides heap-specific animations:
 * - Heapify up (sift up / bubble up after insert)
 * - Heapify down (sift down / trickle down after extract)
 * - Extract-min/max (remove root, replace, heapify)
 * - Build heap (Floyd's bottom-up algorithm)
 * - Array-tree sync highlight
 *
 * Spec reference: Section 6.3.1 (Heap), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
	position?: { x: number; y: number };
}

// ── Heapify Up (Sift Up) ──

/**
 * Heapify up — animates bubble-up after insert.
 * Highlights path from leaf to root, swapping along the way.
 */
export function heapSiftUp(
	pathNodes: AnimatableNode[],
	insertColor: number,
	swapColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	if (pathNodes.length === 0) return tl;

	// Step 1: Highlight inserted node
	const inserted = pathNodes[pathNodes.length - 1];
	tl.to(inserted, { _fillColor: insertColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Compare and swap up the path
	for (let i = pathNodes.length - 1; i > 0; i--) {
		const child = pathNodes[i];
		const parent = pathNodes[i - 1];
		const reverseIdx = pathNodes.length - 1 - i;
		const offset = 0.2 + reverseIdx * 0.25;

		// Highlight parent for comparison
		tl.to(parent, { _fillColor: swapColor, alpha: 1, duration: 0.1 }, offset);

		// Swap flash
		tl.to(child, { _fillColor: swapColor, duration: 0.1 }, offset + 0.12);
		tl.to(child, { alpha: 0.8, duration: 0.08 }, offset + 0.22);
		tl.to(parent, { alpha: 0.8, duration: 0.08 }, offset + 0.22);
	}

	return tl;
}

// ── Heapify Down (Sift Down) ──

/**
 * Heapify down — animates trickle-down from root.
 * Highlights path from root downward, comparing with children.
 */
export function heapSiftDown(
	pathNodes: AnimatableNode[],
	compareColor: number,
	swapColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	if (pathNodes.length === 0) return tl;

	for (let i = 0; i < pathNodes.length; i++) {
		const node = pathNodes[i];
		const offset = i * 0.25;

		// Highlight current node
		tl.to(node, { _fillColor: compareColor, alpha: 1, duration: 0.1 }, offset);

		// Swap indication
		if (i < pathNodes.length - 1) {
			tl.to(node, { _fillColor: swapColor, duration: 0.1 }, offset + 0.12);
		}

		// Settle
		tl.to(node, { alpha: 0.8, duration: 0.08 }, offset + 0.22);
	}

	return tl;
}

// ── Extract Min/Max ──

/**
 * Extract-min/max — removes root, replaces with last element,
 * then heapifies down. Three-phase animation.
 */
export function heapExtract(
	rootNode: AnimatableNode,
	lastNode: AnimatableNode,
	siftPath: AnimatableNode[],
	extractColor: number,
	replaceColor: number,
	siftColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Phase 1: Highlight root being extracted
	tl.to(rootNode, { _fillColor: extractColor, alpha: 1, duration: 0.2 }, 0);
	tl.to(rootNode, { alpha: 0, duration: 0.2, ease: 'power2.in' }, 0.25);

	// Phase 2: Last node moves to root position
	tl.to(lastNode, { _fillColor: replaceColor, alpha: 1, duration: 0.15 }, 0.5);
	if (lastNode.position && rootNode.position) {
		tl.to(
			lastNode.position,
			{
				x: rootNode.position.x,
				y: rootNode.position.y,
				duration: 0.3,
				ease: 'power2.inOut',
			},
			0.5,
		);
	}

	// Phase 3: Sift down
	for (let i = 0; i < siftPath.length; i++) {
		const node = siftPath[i];
		const offset = 0.9 + i * 0.2;
		tl.to(node, { _fillColor: siftColor, alpha: 1, duration: 0.1 }, offset);
		tl.to(node, { alpha: 0.8, duration: 0.08 }, offset + 0.12);
	}

	return tl;
}

// ── Build Heap (Floyd's Algorithm) ──

/**
 * Build heap — Floyd's bottom-up algorithm.
 * Processes nodes from the last internal node to root.
 */
export function heapBuildFloyd(
	internalNodes: AnimatableNode[],
	buildColor: number,
	settleColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < internalNodes.length; i++) {
		const node = internalNodes[i];
		const offset = i * 0.2;

		// Highlight node being heapified
		tl.to(node, { _fillColor: buildColor, alpha: 1, duration: 0.12 }, offset);
		// Settle after heapify
		tl.to(node, { _fillColor: settleColor, alpha: 0.8, duration: 0.1 }, offset + 0.15);
	}

	return tl;
}

// ── Array-Tree Sync ──

/**
 * Array-tree sync — highlights corresponding positions in
 * both the tree and array views simultaneously.
 */
export function heapArrayTreeSync(
	treeNodes: AnimatableNode[],
	arrayCells: AnimatableNode[],
	syncColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	const count = Math.min(treeNodes.length, arrayCells.length);

	for (let i = 0; i < count; i++) {
		const tree = treeNodes[i];
		const cell = arrayCells[i];
		const offset = i * 0.15;

		// Highlight both simultaneously
		tl.to(tree, { _fillColor: syncColor, alpha: 1, duration: 0.12 }, offset);
		tl.to(cell, { _fillColor: syncColor, alpha: 1, duration: 0.12 }, offset);

		// Revert
		tl.to(tree, { alpha: 0.8, duration: 0.08 }, offset + 0.15);
		tl.to(cell, { alpha: 0.8, duration: 0.08 }, offset + 0.15);
	}

	return tl;
}
