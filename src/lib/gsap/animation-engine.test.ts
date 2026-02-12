import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnimationSequence, Keyframe } from '@/types';
import { AnimationEngine } from './animation-engine';

/**
 * Mock target objects simulate Pixi.js displayObjects for testing.
 * GSAP can tween any JS object, so we don't need real Pixi.
 */
function makeTarget(id: string) {
	return {
		id,
		position: { x: 0, y: 0 },
		scale: { x: 1, y: 1 },
		alpha: 1,
		rotation: 0,
	};
}

function makeKeyframe(id: string, elementId: string, overrides: Partial<Keyframe> = {}): Keyframe {
	return {
		id,
		elementId,
		time: 0,
		property: 'position.x',
		value: 100,
		easing: 'linear',
		duration: 1,
		...overrides,
	};
}

function makeSequence(id: string, keyframes: Keyframe[] = [], duration = 5): AnimationSequence {
	return {
		id,
		name: `Sequence ${id}`,
		duration,
		keyframes,
		markers: [],
	};
}

describe('AnimationEngine', () => {
	let engine: AnimationEngine;

	beforeEach(() => {
		engine = new AnimationEngine();
	});

	afterEach(() => {
		engine.destroy();
	});

	describe('initialization', () => {
		it('creates with an idle master timeline', () => {
			expect(engine.isPlaying).toBe(false);
			expect(engine.currentTime).toBe(0);
			expect(engine.totalDuration).toBe(0);
		});
	});

	describe('building timelines from sequences', () => {
		it('builds a timeline from a sequence with keyframes', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);

			const seq = makeSequence('seq-1', [
				makeKeyframe('kf-1', 'el-1', {
					time: 0,
					property: 'position.x',
					value: 200,
					duration: 1,
				}),
			]);

			engine.buildFromSequence(seq);
			expect(engine.totalDuration).toBeGreaterThan(0);
		});

		it('handles multiple keyframes for the same element', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);

			const seq = makeSequence('seq-1', [
				makeKeyframe('kf-1', 'el-1', {
					time: 0,
					property: 'position.x',
					value: 100,
					duration: 1,
				}),
				makeKeyframe('kf-2', 'el-1', {
					time: 1,
					property: 'position.y',
					value: 200,
					duration: 1,
				}),
			]);

			engine.buildFromSequence(seq);
			expect(engine.totalDuration).toBeGreaterThanOrEqual(2);
		});

		it('handles keyframes for multiple elements', () => {
			const target1 = makeTarget('el-1');
			const target2 = makeTarget('el-2');
			engine.registerTarget('el-1', target1);
			engine.registerTarget('el-2', target2);

			const seq = makeSequence('seq-1', [
				makeKeyframe('kf-1', 'el-1', {
					time: 0,
					property: 'position.x',
					value: 100,
					duration: 1,
				}),
				makeKeyframe('kf-2', 'el-2', {
					time: 0,
					property: 'position.x',
					value: 200,
					duration: 1,
				}),
			]);

			engine.buildFromSequence(seq);
			expect(engine.totalDuration).toBeGreaterThan(0);
		});

		it('skips keyframes for unregistered targets', () => {
			const seq = makeSequence('seq-1', [
				makeKeyframe('kf-1', 'el-missing', {
					time: 0,
					property: 'position.x',
					value: 100,
					duration: 1,
				}),
			]);

			// Should not throw
			engine.buildFromSequence(seq);
		});
	});

	describe('playback controls', () => {
		it('play starts the timeline', () => {
			engine.play();
			expect(engine.isPlaying).toBe(true);
		});

		it('pause stops the timeline', () => {
			engine.play();
			engine.pause();
			expect(engine.isPlaying).toBe(false);
		});

		it('seek jumps to a specific time', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);
			engine.buildFromSequence(
				makeSequence('seq-1', [
					makeKeyframe('kf-1', 'el-1', {
						time: 0,
						property: 'position.x',
						value: 100,
						duration: 2,
					}),
				]),
			);

			engine.seek(1);
			expect(engine.currentTime).toBeCloseTo(1, 1);
		});

		it('setSpeed changes playback rate', () => {
			engine.setSpeed(2);
			expect(engine.speed).toBe(2);
		});

		it('setSpeed accepts all valid multipliers', () => {
			for (const speed of [0.25, 0.5, 1, 1.5, 2, 4]) {
				engine.setSpeed(speed);
				expect(engine.speed).toBe(speed);
			}
		});

		it('reverse flips playback direction', () => {
			engine.reverse();
			expect(engine.isReversed).toBe(true);
			engine.reverse();
			expect(engine.isReversed).toBe(false);
		});
	});

	describe('renderAtTime', () => {
		it('renders the correct state at a given time', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);
			engine.buildFromSequence(
				makeSequence('seq-1', [
					makeKeyframe('kf-1', 'el-1', {
						time: 0,
						property: 'position.x',
						value: 100,
						duration: 2,
						easing: 'linear',
					}),
				]),
			);

			engine.renderAtTime(1);
			// At t=1 with linear easing from 0 to 100 over 2s, should be ~50
			expect(target.position.x).toBeCloseTo(50, 0);
		});

		it('renders start state at t=0', () => {
			const target = makeTarget('el-1');
			target.position.x = 0;
			engine.registerTarget('el-1', target);
			engine.buildFromSequence(
				makeSequence('seq-1', [
					makeKeyframe('kf-1', 'el-1', {
						time: 0,
						property: 'position.x',
						value: 100,
						duration: 1,
					}),
				]),
			);

			engine.renderAtTime(0);
			expect(target.position.x).toBeCloseTo(0, 0);
		});

		it('renders end state at full duration', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);
			engine.buildFromSequence(
				makeSequence('seq-1', [
					makeKeyframe('kf-1', 'el-1', {
						time: 0,
						property: 'position.x',
						value: 100,
						duration: 1,
					}),
				]),
			);

			engine.renderAtTime(1);
			expect(target.position.x).toBeCloseTo(100, 0);
		});
	});

	describe('onUpdate callback', () => {
		it('calls onUpdate during renderAtTime', () => {
			const callback = vi.fn();
			engine.onUpdate = callback;

			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);
			engine.buildFromSequence(
				makeSequence('seq-1', [
					makeKeyframe('kf-1', 'el-1', {
						time: 0,
						property: 'position.x',
						value: 100,
						duration: 1,
					}),
				]),
			);

			engine.renderAtTime(0.5);
			expect(callback).toHaveBeenCalled();
		});
	});

	describe('clear', () => {
		it('clears all timelines and targets', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);
			engine.buildFromSequence(
				makeSequence('seq-1', [
					makeKeyframe('kf-1', 'el-1', {
						time: 0,
						property: 'position.x',
						value: 100,
						duration: 1,
					}),
				]),
			);

			engine.clear();
			expect(engine.totalDuration).toBe(0);
		});
	});

	describe('destroy', () => {
		it('cleans up without errors', () => {
			const target = makeTarget('el-1');
			engine.registerTarget('el-1', target);
			expect(() => engine.destroy()).not.toThrow();
		});
	});
});
