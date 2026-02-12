import gsap from 'gsap';

interface AnimatableFrame {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

/**
 * Push animation — fades in and scales up a new frame at the top of the stack.
 * The frame should start with alpha: 0 and scale: { x: 0, y: 0 }.
 */
export function stackPush(newFrame: AnimatableFrame): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(newFrame, { alpha: 1, duration: 0.2, ease: 'power1.out' }, 0);
	tl.to(newFrame.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out' }, 0);

	return tl;
}

/**
 * Pop animation — fades out and shrinks the top frame.
 */
export function stackPop(frame: AnimatableFrame): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(frame, { alpha: 0, duration: 0.2, ease: 'power1.in' }, 0);
	tl.to(frame.scale, { x: 0.8, y: 0.8, duration: 0.2, ease: 'power1.in' }, 0);

	return tl;
}

/**
 * Peek animation — highlights the top frame with a color pulse and scale bounce,
 * then reverts to the original state.
 */
export function stackPeek(frame: AnimatableFrame, peekColor: number): gsap.core.Timeline {
	const tl = gsap.timeline();
	const originalColor = frame._fillColor;

	// Pulse: scale up and color
	tl.to(frame.scale, { x: 1.15, y: 1.15, duration: 0.15, ease: 'power2.out' }, 0);
	tl.to(frame, { _fillColor: peekColor, duration: 0.15 }, 0);

	// Revert
	tl.to(frame.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.in' }, 0.3);
	tl.to(frame, { _fillColor: originalColor, duration: 0.15 }, 0.3);

	return tl;
}

/**
 * Overflow error animation — flashes all frames with an error color, then reverts.
 * Indicates stack capacity has been exceeded.
 */
export function stackOverflow(frames: AnimatableFrame[], errorColor: number): gsap.core.Timeline {
	const tl = gsap.timeline();
	const originalColors = frames.map((f) => f._fillColor);

	// Flash to error color
	for (const frame of frames) {
		tl.to(frame, { _fillColor: errorColor, duration: 0.15 }, 0);
	}

	// Revert
	for (let i = 0; i < frames.length; i++) {
		tl.to(frames[i], { _fillColor: originalColors[i], duration: 0.15 }, 0.3);
	}

	return tl;
}

/**
 * Underflow error animation — a brief shake to indicate pop on empty stack.
 * Returns a minimal timeline since there are no frames to animate.
 */
export function stackUnderflow(): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Empty timeline — the visual error is handled by the renderer
	// showing the "EMPTY" text. A brief duration marks the error event.
	tl.to({}, { duration: 0.3 });

	return tl;
}
