/**
 * GSAP animation presets for AVL Tree composite.
 *
 * Provides AVL-specific animations:
 * - Insert with rebalance check
 * - Left rotation / Right rotation
 * - Left-Right (double) / Right-Left (double) rotation
 * - Height update propagation
 *
 * Spec reference: Section 6.3.1 (AVL Tree), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
	position?: { x: number; y: number };
}

// ── Insert with Rebalance ──

/**
 * Insert with rebalance — highlights the insertion path, then
 * checks balance factors up the tree, triggering rotation if needed.
 */
export function avlInsertRebalance(
	pathNodes: AnimatableNode[],
	insertedNode: AnimatableNode,
	insertColor: number,
	checkColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight insertion path
	for (let i = 0; i < pathNodes.length; i++) {
		const node = pathNodes[i];
		const originalColor = node._fillColor ?? 0x2a2a4a;
		tl.to(node, { _fillColor: checkColor, alpha: 1, duration: 0.12 }, i * 0.1);
		tl.to(node, { _fillColor: originalColor, alpha: 0.8, duration: 0.1 }, i * 0.1 + 0.15);
	}

	// Step 2: Insert node (fade in)
	const pathDuration = pathNodes.length * 0.1 + 0.25;
	tl.fromTo(
		insertedNode,
		{ alpha: 0, _fillColor: insertColor },
		{ alpha: 1, duration: 0.2, ease: 'back.out' },
		pathDuration,
	);

	// Step 3: Balance check back up
	for (let i = pathNodes.length - 1; i >= 0; i--) {
		const node = pathNodes[i];
		const reverseIdx = pathNodes.length - 1 - i;
		tl.to(
			node,
			{ _fillColor: checkColor, alpha: 1, duration: 0.1 },
			pathDuration + 0.3 + reverseIdx * 0.08,
		);
		tl.to(node, { alpha: 0.8, duration: 0.08 }, pathDuration + 0.3 + reverseIdx * 0.08 + 0.12);
	}

	return tl;
}

// ── Rotations ──

/**
 * Left rotation animation — node A moves down-left, node B moves up
 * to replace A's position. B's left subtree becomes A's right child.
 */
export function avlLeftRotation(
	pivotNode: AnimatableNode,
	childNode: AnimatableNode,
	pivotTarget: { x: number; y: number },
	childTarget: { x: number; y: number },
	rotationColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight nodes involved
	tl.to(pivotNode, { _fillColor: rotationColor, alpha: 1, duration: 0.15 }, 0);
	tl.to(childNode, { _fillColor: rotationColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Animate position swap
	if (pivotNode.position) {
		tl.to(
			pivotNode.position,
			{ x: pivotTarget.x, y: pivotTarget.y, duration: 0.4, ease: 'power2.inOut' },
			0.2,
		);
	}
	if (childNode.position) {
		tl.to(
			childNode.position,
			{ x: childTarget.x, y: childTarget.y, duration: 0.4, ease: 'power2.inOut' },
			0.2,
		);
	}

	// Step 3: Revert highlight
	tl.to(pivotNode, { alpha: 0.8, duration: 0.15 }, 0.7);
	tl.to(childNode, { alpha: 0.8, duration: 0.15 }, 0.7);

	return tl;
}

/**
 * Right rotation — mirror of left rotation.
 */
export function avlRightRotation(
	pivotNode: AnimatableNode,
	childNode: AnimatableNode,
	pivotTarget: { x: number; y: number },
	childTarget: { x: number; y: number },
	rotationColor: number,
): gsap.core.Timeline {
	// Same animation structure — just different target positions
	return avlLeftRotation(pivotNode, childNode, pivotTarget, childTarget, rotationColor);
}

/**
 * Left-Right double rotation — first left-rotate the left child,
 * then right-rotate the root.
 */
export function avlLeftRightRotation(
	root: AnimatableNode,
	leftChild: AnimatableNode,
	leftRightChild: AnimatableNode,
	positions: {
		rootTarget: { x: number; y: number };
		leftTarget: { x: number; y: number };
		lrTarget: { x: number; y: number };
	},
	rotationColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight all three nodes
	tl.to(root, { _fillColor: rotationColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(leftChild, { _fillColor: rotationColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(leftRightChild, { _fillColor: rotationColor, alpha: 1, duration: 0.12 }, 0);

	// Step 2: Left rotate left subtree
	if (leftChild.position) {
		tl.to(
			leftChild.position,
			{ ...positions.leftTarget, duration: 0.35, ease: 'power2.inOut' },
			0.2,
		);
	}
	if (leftRightChild.position) {
		tl.to(
			leftRightChild.position,
			{ ...positions.lrTarget, duration: 0.35, ease: 'power2.inOut' },
			0.2,
		);
	}

	// Step 3: Right rotate root
	if (root.position) {
		tl.to(root.position, { ...positions.rootTarget, duration: 0.35, ease: 'power2.inOut' }, 0.6);
	}

	// Step 4: Revert
	tl.to(root, { alpha: 0.8, duration: 0.15 }, 1.05);
	tl.to(leftChild, { alpha: 0.8, duration: 0.15 }, 1.05);
	tl.to(leftRightChild, { alpha: 0.8, duration: 0.15 }, 1.05);

	return tl;
}

/**
 * Right-Left double rotation — mirror of Left-Right.
 */
export function avlRightLeftRotation(
	root: AnimatableNode,
	rightChild: AnimatableNode,
	rightLeftChild: AnimatableNode,
	positions: {
		rootTarget: { x: number; y: number };
		rightTarget: { x: number; y: number };
		rlTarget: { x: number; y: number };
	},
	rotationColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(root, { _fillColor: rotationColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(rightChild, { _fillColor: rotationColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(rightLeftChild, { _fillColor: rotationColor, alpha: 1, duration: 0.12 }, 0);

	if (rightChild.position) {
		tl.to(
			rightChild.position,
			{ ...positions.rightTarget, duration: 0.35, ease: 'power2.inOut' },
			0.2,
		);
	}
	if (rightLeftChild.position) {
		tl.to(
			rightLeftChild.position,
			{ ...positions.rlTarget, duration: 0.35, ease: 'power2.inOut' },
			0.2,
		);
	}
	if (root.position) {
		tl.to(root.position, { ...positions.rootTarget, duration: 0.35, ease: 'power2.inOut' }, 0.6);
	}

	tl.to(root, { alpha: 0.8, duration: 0.15 }, 1.05);
	tl.to(rightChild, { alpha: 0.8, duration: 0.15 }, 1.05);
	tl.to(rightLeftChild, { alpha: 0.8, duration: 0.15 }, 1.05);

	return tl;
}

// ── Height Update ──

/**
 * Height update animation — pulses nodes from bottom to top
 * to show height values being recalculated after a modification.
 */
export function avlHeightUpdate(
	nodesBottomUp: AnimatableNode[],
	updateColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < nodesBottomUp.length; i++) {
		const node = nodesBottomUp[i];
		const originalColor = node._fillColor ?? 0x2a2a4a;

		tl.to(node, { _fillColor: updateColor, alpha: 1, duration: 0.12 }, i * 0.1);
		tl.to(node, { _fillColor: originalColor, alpha: 0.8, duration: 0.1 }, i * 0.1 + 0.15);
	}

	return tl;
}
