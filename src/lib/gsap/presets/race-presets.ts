/**
 * GSAP animation presets for Algorithm Race Mode.
 *
 * Provides animations for countdown, GO! flash,
 * winner reveal, lane labels, and divider effects.
 *
 * Spec reference: Section 16.2 (Algorithm Race Mode)
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	scale?: { x: number; y: number };
	position?: { x: number; y: number };
	_fillColor?: number;
}

/**
 * Countdown number pulse — each number scales up and fades.
 */
export function raceCountdownPulse(countdownText: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.fromTo(countdownText, { alpha: 0 }, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0);

	if (countdownText.scale) {
		tl.fromTo(
			countdownText.scale,
			{ x: 1.5, y: 1.5 },
			{ x: 1, y: 1, duration: 0.3, ease: 'back.out' },
			0,
		);
	}

	tl.to(countdownText, { alpha: 0, duration: 0.15 }, 0.6);

	return tl;
}

/**
 * GO! flash — green flash with scale emphasis.
 */
export function raceGoFlash(goText: AnimatableNode, backdrop: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Flash the backdrop green briefly
	tl.to(backdrop, { alpha: 0.8, duration: 0.1 }, 0);

	// GO text scales up dramatically
	tl.fromTo(goText, { alpha: 0 }, { alpha: 1, duration: 0.15, ease: 'power3.out' }, 0);

	if (goText.scale) {
		tl.fromTo(goText.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' }, 0);
	}

	// Fade everything out
	tl.to(goText, { alpha: 0, duration: 0.2 }, 0.5);
	tl.to(backdrop, { alpha: 0, duration: 0.3 }, 0.5);

	return tl;
}

/**
 * Full countdown sequence — 3...2...1...GO!
 * Each pulse is staggered by ~0.8s.
 */
export function raceCountdownSequence(
	countdownText: AnimatableNode,
	backdrop: AnimatableNode,
	startCount: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = startCount; i >= 1; i--) {
		const offset = (startCount - i) * 0.8;
		tl.add(raceCountdownPulse(countdownText), offset);
	}

	if (startCount > 0) {
		// GO! at the end
		const goOffset = startCount * 0.8;
		tl.add(raceGoFlash(countdownText, backdrop), goOffset);
	}

	return tl;
}

/**
 * Winner reveal — dramatic entrance with scale and glow.
 */
export function raceWinnerReveal(
	backdrop: AnimatableNode,
	titleText: AnimatableNode,
	nameText: AnimatableNode,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Backdrop fades in
	tl.fromTo(backdrop, { alpha: 0 }, { alpha: 0.7, duration: 0.3, ease: 'power2.out' }, 0);

	// Title scales in with bounce
	tl.fromTo(titleText, { alpha: 0 }, { alpha: 1, duration: 0.3, ease: 'back.out(2)' }, 0.2);
	if (titleText.scale) {
		tl.fromTo(
			titleText.scale,
			{ x: 0.3, y: 0.3 },
			{ x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' },
			0.2,
		);
	}

	// Name slides up
	tl.fromTo(nameText, { alpha: 0 }, { alpha: 1, duration: 0.25 }, 0.5);
	if (nameText.position) {
		tl.fromTo(
			nameText.position,
			{ y: nameText.position.y + 20 },
			{ y: nameText.position.y, duration: 0.3, ease: 'power2.out' },
			0.5,
		);
	}

	// Hold for a moment, then pulse title
	tl.to(titleText, { alpha: 0.8, duration: 0.15 }, 1.0);
	tl.to(titleText, { alpha: 1, duration: 0.15 }, 1.15);

	return tl;
}

/**
 * Lane label slide-in from top.
 */
export function raceLaneLabelSlide(label: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.fromTo(label, { alpha: 0 }, { alpha: 1, duration: 0.25, ease: 'power2.out' }, 0);

	if (label.position) {
		tl.fromTo(
			label.position,
			{ y: label.position.y - 20 },
			{ y: label.position.y, duration: 0.3, ease: 'power2.out' },
			0,
		);
	}

	return tl;
}

/**
 * Divider flash effect when race starts.
 */
export function raceDividerFlash(divider: AnimatableNode): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.fromTo(divider, { alpha: 0 }, { alpha: 1, duration: 0.1 }, 0);
	tl.to(divider, { alpha: 0.4, duration: 0.15 }, 0.15);
	tl.to(divider, { alpha: 0.8, duration: 0.1 }, 0.35);

	return tl;
}
