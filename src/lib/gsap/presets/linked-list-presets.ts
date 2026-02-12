import gsap from 'gsap';

interface AnimatableNode {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

/**
 * Insert animation — fades in and scales up a new node.
 * The node should start with alpha: 0 and scale: { x: 0, y: 0 }.
 */
export function linkedListInsert(newNode: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(newNode, { alpha: 1, duration: 0.2, ease: 'power1.out' }, 0);
	tl.to(newNode.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out' }, 0);

	return tl;
}

/**
 * Delete animation — fades out and shrinks the target node.
 */
export function linkedListDelete(node: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(node, { alpha: 0, duration: 0.2, ease: 'power1.in' }, 0);
	tl.to(node.scale, { x: 0.8, y: 0.8, duration: 0.2, ease: 'power1.in' }, 0);

	return tl;
}

/**
 * Traverse animation — highlights nodes sequentially along the list.
 * Each node gets a color pulse and slight scale bounce in order.
 */
export function linkedListTraverse(
	nodes: Record<string, AnimatableNode>,
	order: string[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < order.length; i++) {
		const node = nodes[order[i]];
		const offset = i * 0.3;

		tl.to(node, { _fillColor: highlightColor, duration: 0.2 }, offset);
		tl.to(node.scale, { x: 1.1, y: 1.1, duration: 0.1, ease: 'power2.out' }, offset);
		tl.to(node.scale, { x: 1, y: 1, duration: 0.1, ease: 'power2.in' }, offset + 0.1);
	}

	return tl;
}

/**
 * Reverse animation — slides nodes to their new positions.
 * Node at index i moves to position (length - 1 - i) * stride.
 */
export function linkedListReverse(
	nodes: Record<string, AnimatableNode>,
	order: string[],
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const stride = 90; // nodeWidth(60) + arrowGap(30)

	for (let i = 0; i < order.length; i++) {
		const node = nodes[order[i]];
		const targetX = (order.length - 1 - i) * stride;

		tl.to(node.position, { x: targetX, duration: 0.3, ease: 'power1.inOut' }, i * 0.1);
	}

	return tl;
}

/**
 * Search animation — highlights nodes along the search path.
 * Visited nodes get searchColor, the found node gets foundColor.
 */
export function linkedListSearch(
	nodes: Record<string, AnimatableNode>,
	path: string[],
	foundId: string,
	searchColor: number,
	foundColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < path.length; i++) {
		const node = nodes[path[i]];
		const color = path[i] === foundId ? foundColor : searchColor;

		tl.to(node, { _fillColor: color, duration: 0.2 }, i * 0.3);
	}

	return tl;
}
