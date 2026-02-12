import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AnimationSequence, Keyframe, TimelineMarker } from '@/types';
import { useTimelineStore } from './timeline-store';

function makeSequence(id: string): AnimationSequence {
	return {
		id,
		name: `Sequence ${id}`,
		duration: 5,
		keyframes: [],
		markers: [],
	};
}

function makeKeyframe(id: string, elementId: string): Keyframe {
	return {
		id,
		elementId,
		time: 1,
		property: 'opacity',
		value: 0.5,
		easing: 'linear',
		duration: 0.5,
	};
}

describe('timelineStore', () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	afterEach(() => {
		useTimelineStore.getState().reset();
	});

	describe('initial state', () => {
		it('starts with empty sequences', () => {
			const state = useTimelineStore.getState();
			expect(state.sequences).toEqual({});
			expect(state.sequenceIds).toEqual([]);
		});

		it('starts with idle playback', () => {
			const { playback } = useTimelineStore.getState();
			expect(playback.status).toBe('idle');
			expect(playback.speed).toBe(1);
			expect(playback.currentTime).toBe(0);
			expect(playback.loop).toBe(false);
		});

		it('starts with zero duration', () => {
			expect(useTimelineStore.getState().duration).toBe(0);
		});
	});

	describe('sequences', () => {
		it('adds a sequence', () => {
			const seq = makeSequence('seq-1');
			useTimelineStore.getState().addSequence(seq);

			expect(useTimelineStore.getState().sequences['seq-1']).toEqual(seq);
			expect(useTimelineStore.getState().sequenceIds).toContain('seq-1');
		});

		it('removes a sequence', () => {
			useTimelineStore.getState().addSequence(makeSequence('seq-1'));
			useTimelineStore.getState().removeSequence('seq-1');

			expect(useTimelineStore.getState().sequences['seq-1']).toBeUndefined();
			expect(useTimelineStore.getState().sequenceIds).not.toContain('seq-1');
		});

		it('updates a sequence', () => {
			useTimelineStore.getState().addSequence(makeSequence('seq-1'));
			useTimelineStore.getState().updateSequence('seq-1', { name: 'Renamed', duration: 10 });

			const seq = useTimelineStore.getState().sequences['seq-1'];
			expect(seq?.name).toBe('Renamed');
			expect(seq?.duration).toBe(10);
		});
	});

	describe('keyframes', () => {
		it('adds a keyframe to a sequence', () => {
			useTimelineStore.getState().addSequence(makeSequence('seq-1'));
			const kf = makeKeyframe('kf-1', 'el-1');
			useTimelineStore.getState().addKeyframe('seq-1', kf);

			expect(useTimelineStore.getState().sequences['seq-1']?.keyframes).toHaveLength(1);
			expect(useTimelineStore.getState().sequences['seq-1']?.keyframes[0]?.id).toBe('kf-1');
		});

		it('removes a keyframe from a sequence', () => {
			useTimelineStore.getState().addSequence(makeSequence('seq-1'));
			useTimelineStore.getState().addKeyframe('seq-1', makeKeyframe('kf-1', 'el-1'));
			useTimelineStore.getState().removeKeyframe('seq-1', 'kf-1');

			expect(useTimelineStore.getState().sequences['seq-1']?.keyframes).toHaveLength(0);
		});
	});

	describe('markers', () => {
		it('adds a marker to a sequence', () => {
			useTimelineStore.getState().addSequence(makeSequence('seq-1'));
			const marker: TimelineMarker = { time: 2, label: 'Partition', color: '#ff0000' };
			useTimelineStore.getState().addMarker('seq-1', marker);

			expect(useTimelineStore.getState().sequences['seq-1']?.markers).toHaveLength(1);
			expect(useTimelineStore.getState().sequences['seq-1']?.markers[0]?.label).toBe('Partition');
		});
	});

	describe('playback controls', () => {
		it('play sets status to playing', () => {
			useTimelineStore.getState().play();
			expect(useTimelineStore.getState().playback.status).toBe('playing');
		});

		it('pause sets status to paused', () => {
			useTimelineStore.getState().play();
			useTimelineStore.getState().pause();
			expect(useTimelineStore.getState().playback.status).toBe('paused');
		});

		it('stop resets time to 0', () => {
			useTimelineStore.getState().play();
			useTimelineStore.getState().seek(3);
			useTimelineStore.getState().stop();

			const { playback } = useTimelineStore.getState();
			expect(playback.status).toBe('stopped');
			expect(playback.currentTime).toBe(0);
		});

		it('seek clamps to [0, duration]', () => {
			useTimelineStore.getState().setDuration(10);
			useTimelineStore.getState().seek(5);
			expect(useTimelineStore.getState().playback.currentTime).toBe(5);

			useTimelineStore.getState().seek(-1);
			expect(useTimelineStore.getState().playback.currentTime).toBe(0);

			useTimelineStore.getState().seek(100);
			expect(useTimelineStore.getState().playback.currentTime).toBe(10);
		});

		it('setSpeed changes playback speed', () => {
			useTimelineStore.getState().setSpeed(2);
			expect(useTimelineStore.getState().playback.speed).toBe(2);
		});

		it('toggleLoop toggles loop state', () => {
			expect(useTimelineStore.getState().playback.loop).toBe(false);
			useTimelineStore.getState().toggleLoop();
			expect(useTimelineStore.getState().playback.loop).toBe(true);
			useTimelineStore.getState().toggleLoop();
			expect(useTimelineStore.getState().playback.loop).toBe(false);
		});

		it('setStatus to completed preserves currentTime', () => {
			useTimelineStore.getState().setDuration(10);
			useTimelineStore.getState().seek(10);
			useTimelineStore.getState().setStatus('completed');
			expect(useTimelineStore.getState().playback.status).toBe('completed');
			expect(useTimelineStore.getState().playback.currentTime).toBe(10);
		});

		it('stop resets time but completed does not', () => {
			useTimelineStore.getState().setDuration(10);
			useTimelineStore.getState().seek(8);

			// Completed should keep currentTime
			useTimelineStore.getState().setStatus('completed');
			expect(useTimelineStore.getState().playback.currentTime).toBe(8);

			// Stop should reset to 0
			useTimelineStore.getState().stop();
			expect(useTimelineStore.getState().playback.currentTime).toBe(0);
		});

		it('play from completed state starts from beginning', () => {
			useTimelineStore.getState().setStatus('completed');
			useTimelineStore.getState().play();
			expect(useTimelineStore.getState().playback.status).toBe('playing');
		});
	});

	describe('serialization', () => {
		it('state contains no Map or Set', () => {
			useTimelineStore.getState().addSequence(makeSequence('seq-1'));
			useTimelineStore.getState().addKeyframe('seq-1', makeKeyframe('kf-1', 'el-1'));

			const state = useTimelineStore.getState();
			const json = JSON.stringify({
				sequences: state.sequences,
				sequenceIds: state.sequenceIds,
				playback: state.playback,
				duration: state.duration,
			});

			expect(() => JSON.parse(json)).not.toThrow();
		});
	});
});
