/**
 * GSAP animation presets for Metrics Overlay.
 *
 * Provides animations for counter increments and flashes.
 *
 * Spec reference: Section 16.1 (Metrics Overlay)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
}

/**
 * Counter increment flash — briefly highlights a metric value
 * when it changes. Used for comparisons, swaps, etc.
 */
export function metricsCounterFlash(
	metricText: AnimatableNode,
	flashColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	const originalColor = metricText._fillColor ?? 0xe5e7eb;

	tl.to(metricText, { _fillColor: flashColor, alpha: 1, duration: 0.08 }, 0);
	tl.to(metricText, { _fillColor: originalColor, alpha: 0.8, duration: 0.12 }, 0.1);

	return tl;
}

/**
 * Step progress — animates the step counter advancing.
 * Pulses the step text on each increment.
 */
export function metricsStepAdvance(
	stepText: AnimatableNode,
	stepColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(stepText, { _fillColor: stepColor, alpha: 1, duration: 0.06 }, 0);
	tl.to(stepText, { alpha: 0.8, duration: 0.1 }, 0.08);

	return tl;
}

/**
 * Batch counter update — flashes multiple metrics simultaneously.
 * Used when a single operation triggers multiple counter updates.
 */
export function metricsBatchUpdate(
	metrics: AnimatableNode[],
	flashColors: number[],
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < metrics.length; i++) {
		const metric = metrics[i];
		const color = flashColors[i] ?? 0xfbbf24;
		const originalColor = metric._fillColor ?? 0xe5e7eb;

		tl.to(metric, { _fillColor: color, alpha: 1, duration: 0.08 }, 0);
		tl.to(metric, { _fillColor: originalColor, alpha: 0.8, duration: 0.12 }, 0.1);
	}

	return tl;
}

/**
 * Complexity reveal — fades in complexity notation with emphasis.
 */
export function metricsComplexityReveal(
	complexityText: AnimatableNode,
	revealColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.fromTo(
		complexityText,
		{ alpha: 0, _fillColor: revealColor },
		{ alpha: 1, duration: 0.3, ease: 'back.out' },
		0,
	);
	tl.to(complexityText, { alpha: 0.8, duration: 0.15 }, 0.4);

	return tl;
}
