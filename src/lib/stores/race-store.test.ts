/**
 * Tests for Race Mode Zustand store.
 */

import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRaceStore } from './race-store';

function resetStore() {
	act(() => {
		useRaceStore.getState().reset();
	});
}

describe('RaceStore', () => {
	beforeEach(() => {
		resetStore();
	});

	describe('initial state', () => {
		it('starts in idle status', () => {
			expect(useRaceStore.getState().status).toBe('idle');
		});

		it('has two empty lanes', () => {
			const { lanes, laneIds } = useRaceStore.getState();
			expect(laneIds).toHaveLength(0);
			expect(Object.keys(lanes)).toHaveLength(0);
		});

		it('has no winner', () => {
			expect(useRaceStore.getState().winnerId).toBeNull();
		});

		it('has default countdown value', () => {
			expect(useRaceStore.getState().countdownValue).toBe(3);
		});

		it('has empty shared input', () => {
			expect(useRaceStore.getState().sharedInput).toEqual([]);
		});
	});

	describe('addLane', () => {
		it('adds a lane with algorithm name', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
			});

			const { lanes, laneIds } = useRaceStore.getState();
			expect(laneIds).toEqual(['lane-1']);
			expect(lanes['lane-1']).toEqual({
				id: 'lane-1',
				algorithmName: 'Bubble Sort',
				speed: 1,
				status: 'idle',
				metrics: {
					currentStep: 0,
					totalSteps: 0,
					comparisons: 0,
					swaps: 0,
				},
			});
		});

		it('adds multiple lanes', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().addLane('lane-2', 'Quick Sort');
			});

			expect(useRaceStore.getState().laneIds).toHaveLength(2);
		});
	});

	describe('removeLane', () => {
		it('removes a lane', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().removeLane('lane-1');
			});

			expect(useRaceStore.getState().laneIds).toHaveLength(0);
			expect(useRaceStore.getState().lanes['lane-1']).toBeUndefined();
		});
	});

	describe('setLaneSpeed', () => {
		it('sets speed for a lane', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().setLaneSpeed('lane-1', 2);
			});

			expect(useRaceStore.getState().lanes['lane-1']?.speed).toBe(2);
		});

		it('ignores unknown lane', () => {
			act(() => {
				useRaceStore.getState().setLaneSpeed('nonexistent', 2);
			});
			// No error thrown
		});
	});

	describe('setLaneStatus', () => {
		it('sets status for a lane', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().setLaneStatus('lane-1', 'running');
			});

			expect(useRaceStore.getState().lanes['lane-1']?.status).toBe('running');
		});
	});

	describe('updateLaneMetrics', () => {
		it('updates metrics for a lane', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().updateLaneMetrics('lane-1', {
					currentStep: 5,
					comparisons: 10,
				});
			});

			const metrics = useRaceStore.getState().lanes['lane-1']?.metrics;
			expect(metrics?.currentStep).toBe(5);
			expect(metrics?.comparisons).toBe(10);
			expect(metrics?.swaps).toBe(0); // untouched
		});
	});

	describe('race lifecycle', () => {
		it('transitions through countdown -> racing -> finished', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().addLane('lane-2', 'Quick Sort');
			});

			act(() => {
				useRaceStore.getState().startCountdown();
			});
			expect(useRaceStore.getState().status).toBe('countdown');

			act(() => {
				useRaceStore.getState().startRace();
			});
			expect(useRaceStore.getState().status).toBe('racing');

			act(() => {
				useRaceStore.getState().finishRace('lane-2');
			});
			expect(useRaceStore.getState().status).toBe('finished');
			expect(useRaceStore.getState().winnerId).toBe('lane-2');
		});
	});

	describe('setCountdownValue', () => {
		it('decrements countdown', () => {
			act(() => {
				useRaceStore.getState().setCountdownValue(2);
			});
			expect(useRaceStore.getState().countdownValue).toBe(2);
		});
	});

	describe('setSharedInput', () => {
		it('sets shared input array', () => {
			act(() => {
				useRaceStore.getState().setSharedInput([5, 3, 8, 1, 9]);
			});
			expect(useRaceStore.getState().sharedInput).toEqual([5, 3, 8, 1, 9]);
		});
	});

	describe('reset', () => {
		it('resets to initial state', () => {
			act(() => {
				useRaceStore.getState().addLane('lane-1', 'Bubble Sort');
				useRaceStore.getState().startCountdown();
				useRaceStore.getState().setSharedInput([1, 2, 3]);
				useRaceStore.getState().reset();
			});

			const state = useRaceStore.getState();
			expect(state.status).toBe('idle');
			expect(state.laneIds).toHaveLength(0);
			expect(state.winnerId).toBeNull();
			expect(state.sharedInput).toEqual([]);
		});
	});
});
