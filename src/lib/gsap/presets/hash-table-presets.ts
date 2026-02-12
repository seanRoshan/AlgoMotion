/**
 * GSAP animation presets for Hash Table composite.
 *
 * Provides hash table-specific animations:
 * - Hash computation (key → index)
 * - Insert (direct + collision with chaining)
 * - Search (hash → bucket → chain traversal)
 * - Delete (find and remove from chain)
 * - Resize/Rehash (table expansion)
 *
 * Spec reference: Section 6.3.1 (Hash Table), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
}

// ── Hash Computation ──

/**
 * Hash computation animation — highlights the bucket being targeted.
 * Shows the key being "hashed" into an index.
 */
export function hashCompute(
	bucket: AnimatableNode,
	computeColor: number,
	resultColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Flash compute
	tl.to(bucket, { _fillColor: computeColor, alpha: 1, duration: 0.15 }, 0);
	// Settle to result
	tl.to(bucket, { _fillColor: resultColor, alpha: 1, duration: 0.2 }, 0.2);
	tl.to(bucket, { alpha: 0.8, duration: 0.1 }, 0.45);

	return tl;
}

// ── Insert ──

/**
 * Insert without collision — direct placement into bucket.
 */
export function hashInsert(
	bucket: AnimatableNode,
	entry: AnimatableNode,
	bucketColor: number,
	insertColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight bucket
	tl.to(bucket, { _fillColor: bucketColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Entry fades in
	tl.fromTo(
		entry,
		{ alpha: 0, _fillColor: insertColor },
		{ alpha: 1, duration: 0.2, ease: 'back.out' },
		0.2,
	);

	// Step 3: Settle
	tl.to(bucket, { alpha: 0.8, duration: 0.1 }, 0.45);

	return tl;
}

/**
 * Insert with collision — shows collision indicator, then chains.
 */
export function hashInsertCollision(
	bucket: AnimatableNode,
	existingEntries: AnimatableNode[],
	newEntry: AnimatableNode,
	collisionColor: number,
	chainColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight bucket + collision flash
	tl.to(bucket, { _fillColor: collisionColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Flash existing entries
	for (const entry of existingEntries) {
		tl.to(entry, { _fillColor: collisionColor, alpha: 1, duration: 0.1 }, 0.15);
		tl.to(entry, { alpha: 0.8, duration: 0.08 }, 0.28);
	}

	// Step 3: Chain new entry
	tl.fromTo(
		newEntry,
		{ alpha: 0, _fillColor: chainColor },
		{ alpha: 1, duration: 0.2, ease: 'back.out' },
		0.35,
	);

	// Step 4: Settle
	tl.to(bucket, { alpha: 0.8, duration: 0.1 }, 0.6);

	return tl;
}

// ── Search ──

/**
 * Search animation — hash to bucket, then traverse chain.
 */
export function hashSearch(
	bucket: AnimatableNode,
	chainEntries: AnimatableNode[],
	foundEntry: AnimatableNode | null,
	searchColor: number,
	foundColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight bucket
	tl.to(bucket, { _fillColor: searchColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Traverse chain
	for (let i = 0; i < chainEntries.length; i++) {
		const entry = chainEntries[i];
		const originalColor = entry._fillColor ?? 0x2a2a4a;
		tl.to(entry, { _fillColor: searchColor, alpha: 1, duration: 0.1 }, 0.2 + i * 0.15);
		tl.to(entry, { _fillColor: originalColor, alpha: 0.8, duration: 0.08 }, 0.32 + i * 0.15);
	}

	// Step 3: Highlight found entry
	if (foundEntry) {
		const foundOffset = 0.2 + chainEntries.length * 0.15 + 0.05;
		tl.to(foundEntry, { _fillColor: foundColor, alpha: 1, duration: 0.15 }, foundOffset);
		tl.to(foundEntry, { alpha: 0.8, duration: 0.1 }, foundOffset + 0.2);
	}

	// Settle bucket
	tl.to(bucket, { alpha: 0.8, duration: 0.1 }, 0.2 + chainEntries.length * 0.15 + 0.3);

	return tl;
}

// ── Delete ──

/**
 * Delete animation — find entry in chain, then remove it.
 */
export function hashDelete(
	bucket: AnimatableNode,
	chainEntries: AnimatableNode[],
	deletedEntry: AnimatableNode,
	searchColor: number,
	deleteColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Hash to bucket
	tl.to(bucket, { _fillColor: searchColor, alpha: 1, duration: 0.12 }, 0);

	// Step 2: Traverse chain
	for (let i = 0; i < chainEntries.length; i++) {
		const entry = chainEntries[i];
		tl.to(entry, { _fillColor: searchColor, alpha: 1, duration: 0.1 }, 0.15 + i * 0.12);
	}

	// Step 3: Highlight + remove deleted entry
	const removeOffset = 0.15 + chainEntries.length * 0.12 + 0.05;
	tl.to(deletedEntry, { _fillColor: deleteColor, alpha: 1, duration: 0.12 }, removeOffset);
	tl.to(deletedEntry, { alpha: 0, duration: 0.2, ease: 'power2.in' }, removeOffset + 0.15);

	// Settle
	tl.to(bucket, { alpha: 0.8, duration: 0.1 }, removeOffset + 0.4);

	return tl;
}

// ── Resize/Rehash ──

/**
 * Resize animation — old entries fade, new buckets appear,
 * entries rehash into new positions.
 */
export function hashResize(
	oldEntries: AnimatableNode[],
	newBuckets: AnimatableNode[],
	rehashColor: number,
	settleColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Flash old entries
	for (let i = 0; i < oldEntries.length; i++) {
		tl.to(oldEntries[i], { _fillColor: rehashColor, alpha: 1, duration: 0.1 }, i * 0.05);
	}

	// Step 2: New buckets appear
	const flashDuration = oldEntries.length * 0.05 + 0.15;
	for (let i = 0; i < newBuckets.length; i++) {
		tl.fromTo(
			newBuckets[i],
			{ alpha: 0 },
			{ alpha: 0.8, duration: 0.15 },
			flashDuration + i * 0.05,
		);
	}

	// Step 3: Entries settle into new positions
	const newBucketDuration = flashDuration + newBuckets.length * 0.05 + 0.1;
	for (let i = 0; i < oldEntries.length; i++) {
		tl.to(
			oldEntries[i],
			{ _fillColor: settleColor, alpha: 0.8, duration: 0.15 },
			newBucketDuration + i * 0.08,
		);
	}

	return tl;
}
