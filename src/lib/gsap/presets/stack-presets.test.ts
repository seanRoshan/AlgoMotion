import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import { stackOverflow, stackPeek, stackPop, stackPush, stackUnderflow } from './stack-presets';

interface AnimatableFrame {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

function makeFrame(y: number): AnimatableFrame {
	return {
		position: { x: 0, y },
		alpha: 1,
		scale: { x: 1, y: 1 },
		_fillColor: 0x2a2a4a,
	};
}

describe('Stack Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('stackPush', () => {
		it('returns a GSAP timeline', () => {
			const newFrame = makeFrame(0);
			newFrame.alpha = 0;
			newFrame.scale = { x: 0, y: 0 };
			const tl = stackPush(newFrame);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('animates new frame to visible', () => {
			const newFrame = makeFrame(0);
			newFrame.alpha = 0;
			newFrame.scale = { x: 0, y: 0 };
			const tl = stackPush(newFrame);
			tl.progress(1);
			expect(newFrame.alpha).toBe(1);
			expect(newFrame.scale.x).toBeCloseTo(1, 1);
			expect(newFrame.scale.y).toBeCloseTo(1, 1);
		});
	});

	describe('stackPop', () => {
		it('returns a GSAP timeline', () => {
			const frame = makeFrame(0);
			const tl = stackPop(frame);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('animates frame to invisible', () => {
			const frame = makeFrame(0);
			const tl = stackPop(frame);
			tl.progress(1);
			expect(frame.alpha).toBe(0);
		});
	});

	describe('stackPeek', () => {
		it('returns a GSAP timeline', () => {
			const frame = makeFrame(0);
			const tl = stackPeek(frame, 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('pulses and reverts the frame', () => {
			const frame = makeFrame(0);
			const originalColor = frame._fillColor;
			const tl = stackPeek(frame, 0x3b82f6);
			tl.progress(1);
			// After full animation, scale should revert to 1
			expect(frame.scale.x).toBeCloseTo(1, 1);
			expect(frame.scale.y).toBeCloseTo(1, 1);
			// Color should revert to original
			expect(frame._fillColor).toBe(originalColor);
		});
	});

	describe('stackOverflow', () => {
		it('returns a GSAP timeline', () => {
			const frames = [makeFrame(0), makeFrame(40)];
			const tl = stackOverflow(frames, 0xff4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('flashes all frames with error color and reverts', () => {
			const frames = [makeFrame(0), makeFrame(40)];
			const originalColors = frames.map((f) => f._fillColor);
			const tl = stackOverflow(frames, 0xff4444);
			tl.progress(1);
			// After full animation, colors should revert
			for (let i = 0; i < frames.length; i++) {
				expect(frames[i]._fillColor).toBe(originalColors[i]);
			}
		});
	});

	describe('stackUnderflow', () => {
		it('returns a GSAP timeline for empty stack error', () => {
			const tl = stackUnderflow();
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});
	});
});
