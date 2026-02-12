/**
 * GSAP animation presets for Trie composite.
 *
 * Provides trie-specific animations:
 * - Insert (character-by-character path creation)
 * - Prefix search (highlight matching path)
 * - Delete (remove path with cleanup)
 * - Autocomplete (show all words from prefix)
 *
 * Spec reference: Section 6.3.1 (Trie), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
}

// ── Insert ──

/**
 * Insert animation — character-by-character path creation.
 * Existing nodes pulse, new nodes fade in.
 */
export function trieInsert(
	existingNodes: AnimatableNode[],
	newNodes: AnimatableNode[],
	traverseColor: number,
	createColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Traverse existing path
	for (let i = 0; i < existingNodes.length; i++) {
		const node = existingNodes[i];
		const originalColor = node._fillColor ?? 0x2a2a4a;
		tl.to(node, { _fillColor: traverseColor, alpha: 1, duration: 0.12 }, i * 0.15);
		tl.to(node, { _fillColor: originalColor, alpha: 0.8, duration: 0.1 }, i * 0.15 + 0.14);
	}

	// Step 2: Create new nodes
	const existingDuration = existingNodes.length * 0.15 + 0.1;
	for (let i = 0; i < newNodes.length; i++) {
		const node = newNodes[i];
		tl.fromTo(
			node,
			{ alpha: 0, _fillColor: createColor },
			{ alpha: 1, duration: 0.2, ease: 'back.out' },
			existingDuration + i * 0.18,
		);
	}

	return tl;
}

// ── Prefix Search ──

/**
 * Prefix search — highlights the path matching the prefix.
 * Each node along the prefix path lights up sequentially.
 */
export function triePrefixSearch(
	pathNodes: AnimatableNode[],
	searchColor: number,
	foundColor: number,
	found: boolean,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < pathNodes.length; i++) {
		const node = pathNodes[i];
		tl.to(node, { _fillColor: searchColor, alpha: 1, duration: 0.12 }, i * 0.15);
	}

	// Final result indicator
	if (pathNodes.length > 0) {
		const lastNode = pathNodes[pathNodes.length - 1];
		const resultOffset = pathNodes.length * 0.15 + 0.05;
		const resultColor = found ? foundColor : searchColor;
		tl.to(lastNode, { _fillColor: resultColor, alpha: 1, duration: 0.15 }, resultOffset);
		tl.to(lastNode, { alpha: 0.8, duration: 0.1 }, resultOffset + 0.2);
	}

	return tl;
}

// ── Delete ──

/**
 * Delete animation — traverses to the word, then removes
 * unnecessary nodes bottom-up.
 */
export function trieDelete(
	pathNodes: AnimatableNode[],
	removedNodes: AnimatableNode[],
	traverseColor: number,
	deleteColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Traverse to word
	for (let i = 0; i < pathNodes.length; i++) {
		const node = pathNodes[i];
		tl.to(node, { _fillColor: traverseColor, alpha: 1, duration: 0.1 }, i * 0.12);
	}

	// Step 2: Remove nodes bottom-up
	const traverseDuration = pathNodes.length * 0.12 + 0.1;
	for (let i = 0; i < removedNodes.length; i++) {
		const node = removedNodes[i];
		tl.to(node, { _fillColor: deleteColor, alpha: 1, duration: 0.1 }, traverseDuration + i * 0.15);
		tl.to(node, { alpha: 0, duration: 0.2, ease: 'power2.in' }, traverseDuration + i * 0.15 + 0.12);
	}

	return tl;
}

// ── Autocomplete ──

/**
 * Autocomplete — highlights prefix path, then fans out
 * to show all words with that prefix.
 */
export function trieAutocomplete(
	prefixPath: AnimatableNode[],
	completionNodes: AnimatableNode[],
	prefixColor: number,
	completionColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight prefix path
	for (let i = 0; i < prefixPath.length; i++) {
		const node = prefixPath[i];
		tl.to(node, { _fillColor: prefixColor, alpha: 1, duration: 0.1 }, i * 0.1);
	}

	// Step 2: Fan out completions (all at once with slight stagger)
	const prefixDuration = prefixPath.length * 0.1 + 0.1;
	for (let i = 0; i < completionNodes.length; i++) {
		const node = completionNodes[i];
		tl.to(
			node,
			{ _fillColor: completionColor, alpha: 1, duration: 0.15 },
			prefixDuration + i * 0.05,
		);
	}

	// Step 3: Settle all
	const totalDuration = prefixDuration + completionNodes.length * 0.05 + 0.2;
	for (const node of [...prefixPath, ...completionNodes]) {
		tl.to(node, { alpha: 0.8, duration: 0.1 }, totalDuration);
	}

	return tl;
}
