/**
 * GSAP animation presets for Red-Black Tree composite.
 *
 * Provides RB-specific animations:
 * - Recolor (flip node color without position change)
 * - Rotation with color updates (left/right)
 * - Insert fixup (cases 1–3)
 * - Delete fixup (recolor + rotation)
 * - Uncle check (highlight uncle during fixup)
 *
 * Spec reference: Section 6.3.1 (Red-Black Tree), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
	position?: { x: number; y: number };
}

// ── Recolor ──

/**
 * Recolor animation — flashes the node, then transitions fill color.
 * Used when a node changes from red↔black during fixup.
 */
export function rbRecolor(
	node: AnimatableNode,
	fromColor: number,
	toColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Flash white briefly
	tl.to(node, { _fillColor: 0xffffff, alpha: 1, duration: 0.1 }, 0);
	// Transition to new color
	tl.to(node, { _fillColor: toColor, duration: 0.25, ease: 'power2.out' }, 0.12);
	// Settle alpha
	tl.to(node, { alpha: 0.8, duration: 0.1 }, 0.4);

	return tl;
}

/**
 * Batch recolor — recolors multiple nodes simultaneously.
 * Used in Case 1 (uncle is red): recolor parent, uncle, and grandparent.
 */
export function rbBatchRecolor(nodes: AnimatableNode[], toColors: number[]): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const toColor = toColors[i] ?? 0x1f2937;

		tl.to(node, { _fillColor: 0xffffff, alpha: 1, duration: 0.1 }, 0);
		tl.to(node, { _fillColor: toColor, duration: 0.25, ease: 'power2.out' }, 0.12);
		tl.to(node, { alpha: 0.8, duration: 0.1 }, 0.4);
	}

	return tl;
}

// ── Rotation with Recolor ──

/**
 * Left rotation with color update — rotates nodes and recolors them.
 * Combines position animation with color transition.
 */
export function rbLeftRotation(
	pivot: AnimatableNode,
	child: AnimatableNode,
	pivotTarget: { x: number; y: number },
	childTarget: { x: number; y: number },
	pivotNewColor: number,
	childNewColor: number,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight
	tl.to(pivot, { _fillColor: highlightColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(child, { _fillColor: highlightColor, alpha: 1, duration: 0.12 }, 0);

	// Step 2: Rotate positions
	if (pivot.position) {
		tl.to(
			pivot.position,
			{ x: pivotTarget.x, y: pivotTarget.y, duration: 0.4, ease: 'power2.inOut' },
			0.15,
		);
	}
	if (child.position) {
		tl.to(
			child.position,
			{ x: childTarget.x, y: childTarget.y, duration: 0.4, ease: 'power2.inOut' },
			0.15,
		);
	}

	// Step 3: Recolor to new colors
	tl.to(pivot, { _fillColor: pivotNewColor, duration: 0.2 }, 0.6);
	tl.to(child, { _fillColor: childNewColor, duration: 0.2 }, 0.6);

	// Step 4: Settle
	tl.to(pivot, { alpha: 0.8, duration: 0.1 }, 0.85);
	tl.to(child, { alpha: 0.8, duration: 0.1 }, 0.85);

	return tl;
}

/**
 * Right rotation with color update — mirror of left rotation.
 */
export function rbRightRotation(
	pivot: AnimatableNode,
	child: AnimatableNode,
	pivotTarget: { x: number; y: number },
	childTarget: { x: number; y: number },
	pivotNewColor: number,
	childNewColor: number,
	highlightColor: number,
): gsap.core.Timeline {
	return rbLeftRotation(
		pivot,
		child,
		pivotTarget,
		childTarget,
		pivotNewColor,
		childNewColor,
		highlightColor,
	);
}

// ── Insert Fixup ──

/**
 * Insert fixup Case 1 — uncle is red.
 * Recolors parent, uncle to black and grandparent to red.
 */
export function rbInsertFixupCase1(
	parent: AnimatableNode,
	uncle: AnimatableNode,
	grandparent: AnimatableNode,
	blackColor: number,
	redColor: number,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight uncle check
	tl.to(uncle, { _fillColor: highlightColor, alpha: 1, duration: 0.15 }, 0);
	tl.to(parent, { _fillColor: highlightColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Recolor parent + uncle to black
	tl.to(parent, { _fillColor: blackColor, duration: 0.2 }, 0.2);
	tl.to(uncle, { _fillColor: blackColor, duration: 0.2 }, 0.2);

	// Step 3: Recolor grandparent to red
	tl.to(grandparent, { _fillColor: redColor, alpha: 1, duration: 0.2 }, 0.45);

	// Step 4: Settle
	tl.to(parent, { alpha: 0.8, duration: 0.1 }, 0.7);
	tl.to(uncle, { alpha: 0.8, duration: 0.1 }, 0.7);
	tl.to(grandparent, { alpha: 0.8, duration: 0.1 }, 0.7);

	return tl;
}

/**
 * Insert fixup Case 2 — triangle case, requires double rotation.
 * First rotates to straighten, then applies Case 3.
 */
export function rbInsertFixupCase2(
	node: AnimatableNode,
	parent: AnimatableNode,
	grandparent: AnimatableNode,
	positions: {
		nodeTarget: { x: number; y: number };
		parentTarget: { x: number; y: number };
		grandparentTarget: { x: number; y: number };
	},
	blackColor: number,
	redColor: number,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight triangle
	tl.to(node, { _fillColor: highlightColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(parent, { _fillColor: highlightColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(grandparent, { _fillColor: highlightColor, alpha: 1, duration: 0.12 }, 0);

	// Step 2: First rotation (straighten)
	if (node.position) {
		tl.to(node.position, { ...positions.nodeTarget, duration: 0.35, ease: 'power2.inOut' }, 0.15);
	}
	if (parent.position) {
		tl.to(
			parent.position,
			{ ...positions.parentTarget, duration: 0.35, ease: 'power2.inOut' },
			0.15,
		);
	}

	// Step 3: Second rotation (balance)
	if (grandparent.position) {
		tl.to(
			grandparent.position,
			{ ...positions.grandparentTarget, duration: 0.35, ease: 'power2.inOut' },
			0.55,
		);
	}

	// Step 4: Recolor
	tl.to(node, { _fillColor: blackColor, duration: 0.2 }, 0.95);
	tl.to(grandparent, { _fillColor: redColor, duration: 0.2 }, 0.95);

	// Step 5: Settle
	tl.to(node, { alpha: 0.8, duration: 0.1 }, 1.2);
	tl.to(parent, { alpha: 0.8, duration: 0.1 }, 1.2);
	tl.to(grandparent, { alpha: 0.8, duration: 0.1 }, 1.2);

	return tl;
}

// ── Delete Fixup ──

/**
 * Delete fixup — highlights the double-black node, then performs
 * recolor or rotation based on sibling's color.
 */
export function rbDeleteFixup(
	doubleBlack: AnimatableNode,
	sibling: AnimatableNode,
	siblingNewColor: number,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight double-black node
	tl.to(doubleBlack, { _fillColor: highlightColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Check sibling
	tl.to(sibling, { _fillColor: highlightColor, alpha: 1, duration: 0.15 }, 0.2);

	// Step 3: Recolor sibling
	tl.to(sibling, { _fillColor: siblingNewColor, duration: 0.25 }, 0.4);

	// Step 4: Settle
	tl.to(doubleBlack, { alpha: 0.8, duration: 0.1 }, 0.7);
	tl.to(sibling, { alpha: 0.8, duration: 0.1 }, 0.7);

	return tl;
}

// ── Uncle Check ──

/**
 * Uncle check animation — highlights the uncle node to show
 * which fixup case applies.
 */
export function rbUncleCheck(uncle: AnimatableNode, uncleColor: number): gsap.core.Timeline {
	const tl = gsap.timeline();

	const originalColor = uncle._fillColor ?? 0x1f2937;

	// Pulse uncle
	tl.to(uncle, { _fillColor: uncleColor, alpha: 1, duration: 0.15 }, 0);
	tl.to(uncle, { _fillColor: originalColor, alpha: 0.8, duration: 0.15 }, 0.25);

	return tl;
}
