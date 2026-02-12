/**
 * Tests for Race Mode GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	raceCountdownPulse,
	raceCountdownSequence,
	raceDividerFlash,
	raceGoFlash,
	raceLaneLabelSlide,
	raceWinnerReveal,
} from './race-presets';

interface MockNode {
	alpha: number;
	scale: { x: number; y: number };
	position: { x: number; y: number };
	_fillColor: number;
}

function makeNode(): MockNode {
	return {
		alpha: 1,
		scale: { x: 1, y: 1 },
		position: { x: 0, y: 0 },
		_fillColor: 0xffffff,
	};
}

describe('Race Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('raceCountdownPulse', () => {
		it('returns a GSAP timeline', () => {
			const tl = raceCountdownPulse(makeNode());
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = raceCountdownPulse(makeNode());
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('raceGoFlash', () => {
		it('returns a GSAP timeline', () => {
			const tl = raceGoFlash(makeNode(), makeNode());
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = raceGoFlash(makeNode(), makeNode());
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has longer duration than countdown pulse', () => {
			const pulse = raceCountdownPulse(makeNode());
			const go = raceGoFlash(makeNode(), makeNode());
			expect(go.duration()).toBeGreaterThanOrEqual(pulse.duration());
		});
	});

	describe('raceCountdownSequence', () => {
		it('returns a GSAP timeline', () => {
			const tl = raceCountdownSequence(makeNode(), makeNode(), 3);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has duration based on count', () => {
			const tl3 = raceCountdownSequence(makeNode(), makeNode(), 3);
			const tl5 = raceCountdownSequence(makeNode(), makeNode(), 5);
			expect(tl5.duration()).toBeGreaterThan(tl3.duration());
		});

		it('has zero duration for count of 0', () => {
			const tl = raceCountdownSequence(makeNode(), makeNode(), 0);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('raceWinnerReveal', () => {
		it('returns a GSAP timeline', () => {
			const tl = raceWinnerReveal(makeNode(), makeNode(), makeNode());
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = raceWinnerReveal(makeNode(), makeNode(), makeNode());
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has longer duration than go flash', () => {
			const go = raceGoFlash(makeNode(), makeNode());
			const winner = raceWinnerReveal(makeNode(), makeNode(), makeNode());
			expect(winner.duration()).toBeGreaterThan(go.duration());
		});
	});

	describe('raceLaneLabelSlide', () => {
		it('returns a GSAP timeline', () => {
			const tl = raceLaneLabelSlide(makeNode());
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = raceLaneLabelSlide(makeNode());
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('raceDividerFlash', () => {
		it('returns a GSAP timeline', () => {
			const tl = raceDividerFlash(makeNode());
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = raceDividerFlash(makeNode());
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});
});
