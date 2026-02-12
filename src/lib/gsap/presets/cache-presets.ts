/**
 * GSAP animation presets for Cache Hierarchy composite.
 *
 * Provides cache-specific animations:
 * - Cache hit: Quick green flash on the matching line
 * - Cache miss: Red flash, then fetch from next level
 * - LRU eviction: Fade out evicted line, fade in replacement
 * - Write-back / Write-through: Write animation with policy indicator
 * - Cold start: Sequential miss animation
 *
 * Spec reference: Section 6.3.2 (Cache Hierarchy), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableLevel {
	alpha: number;
	_fillColor?: number;
}

interface AnimatableLine {
	alpha: number;
	_fillColor?: number;
}

// ── Cache Hit ──

/**
 * Cache hit animation — briefly highlights the matching cache level
 * and the specific line that was hit.
 */
export function cacheHit(
	level: AnimatableLevel,
	hitLine: AnimatableLine,
	hitColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const levelOriginal = level._fillColor ?? 0x2a2a4a;
	const lineOriginal = hitLine._fillColor ?? 0x2a2a4a;

	// Step 1: Flash level
	tl.to(level, { _fillColor: hitColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Flash matching line
	tl.to(hitLine, { _fillColor: hitColor, alpha: 1, duration: 0.2, ease: 'power2.out' }, 0.1);

	// Step 3: Revert
	tl.to(level, { _fillColor: levelOriginal, duration: 0.2 }, 0.4);
	tl.to(hitLine, { _fillColor: lineOriginal, alpha: 0.8, duration: 0.2 }, 0.4);

	return tl;
}

// ── Cache Miss ──

/**
 * Cache miss animation — flashes the missed level red, then
 * triggers a fetch from the next level down.
 */
export function cacheMiss(
	missedLevel: AnimatableLevel,
	nextLevel: AnimatableLevel,
	missColor: number,
	fetchColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const missOriginal = missedLevel._fillColor ?? 0x2a2a4a;
	const nextOriginal = nextLevel._fillColor ?? 0x2a2a4a;

	// Step 1: Flash missed level red
	tl.to(missedLevel, { _fillColor: missColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Fetch from next level
	tl.to(nextLevel, { _fillColor: fetchColor, alpha: 1, duration: 0.2 }, 0.25);

	// Step 3: Revert
	tl.to(missedLevel, { _fillColor: missOriginal, duration: 0.2 }, 0.55);
	tl.to(nextLevel, { _fillColor: nextOriginal, duration: 0.2 }, 0.55);

	return tl;
}

// ── LRU Eviction ──

/**
 * LRU eviction animation — fades out the evicted line and fades
 * in the replacement line.
 */
export function cacheLruEviction(
	evictedLine: AnimatableLine,
	replacementLine: AnimatableLine,
	evictColor: number,
	loadColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight evicted line
	tl.to(evictedLine, { _fillColor: evictColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: Fade out evicted
	tl.to(evictedLine, { alpha: 0.2, duration: 0.2, ease: 'power2.in' }, 0.2);

	// Step 3: Load replacement
	tl.to(
		replacementLine,
		{ _fillColor: loadColor, alpha: 1, duration: 0.2, ease: 'power2.out' },
		0.4,
	);

	// Step 4: Revert replacement to normal
	tl.to(replacementLine, { alpha: 0.8, duration: 0.15 }, 0.7);

	return tl;
}

// ── Write-Back / Write-Through ──

/**
 * Write animation — shows data being written with policy-dependent behavior.
 * Write-back: marks the line as dirty.
 * Write-through: propagates write to next level.
 */
export function cacheWrite(
	targetLine: AnimatableLine,
	nextLevel: AnimatableLevel | null,
	writeColor: number,
	writeThrough: boolean,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const lineOriginal = targetLine._fillColor ?? 0x2a2a4a;

	// Step 1: Highlight write target
	tl.to(targetLine, { _fillColor: writeColor, alpha: 1, duration: 0.15 }, 0);

	if (writeThrough && nextLevel) {
		const nextOriginal = nextLevel._fillColor ?? 0x2a2a4a;

		// Step 2: Propagate to next level
		tl.to(nextLevel, { _fillColor: writeColor, alpha: 1, duration: 0.15 }, 0.2);

		// Step 3: Revert both
		tl.to(targetLine, { _fillColor: lineOriginal, alpha: 0.8, duration: 0.2 }, 0.45);
		tl.to(nextLevel, { _fillColor: nextOriginal, duration: 0.2 }, 0.45);
	} else {
		// Write-back: just mark dirty (keep highlight slightly)
		tl.to(targetLine, { _fillColor: lineOriginal, alpha: 0.8, duration: 0.2 }, 0.3);
	}

	return tl;
}

// ── Cold Start ──

/**
 * Cold start animation — sequential miss animation showing
 * multiple cache misses as the cache warms up.
 */
export function cacheColdStart(
	levels: AnimatableLevel[],
	missColor: number,
	missDelay: number = 0.3,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < levels.length; i++) {
		const level = levels[i];
		const originalColor = level._fillColor ?? 0x2a2a4a;

		// Flash miss on each level sequentially
		tl.to(level, { _fillColor: missColor, alpha: 1, duration: 0.12 }, i * missDelay);
		tl.to(level, { _fillColor: originalColor, alpha: 0.8, duration: 0.15 }, i * missDelay + 0.15);
	}

	return tl;
}
