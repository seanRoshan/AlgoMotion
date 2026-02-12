/**
 * Tests for RaceOrchestrator — coordinates side-by-side algorithm races.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaceOrchestrator } from './race-orchestrator';

function makeEngine() {
	return {
		play: vi.fn(),
		pause: vi.fn(),
		setSpeed: vi.fn(),
		destroy: vi.fn(),
		isPlaying: false,
		totalDuration: 10,
		currentTime: 0,
		onComplete: null as (() => void) | null,
	};
}

describe('RaceOrchestrator', () => {
	let orchestrator: RaceOrchestrator;

	beforeEach(() => {
		orchestrator = new RaceOrchestrator();
	});

	describe('registerLane', () => {
		it('registers a lane with an engine', () => {
			const engine = makeEngine();
			orchestrator.registerLane('lane-1', engine);
			expect(orchestrator.getLaneCount()).toBe(1);
		});

		it('registers multiple lanes', () => {
			orchestrator.registerLane('lane-1', makeEngine());
			orchestrator.registerLane('lane-2', makeEngine());
			expect(orchestrator.getLaneCount()).toBe(2);
		});
	});

	describe('unregisterLane', () => {
		it('removes a lane', () => {
			orchestrator.registerLane('lane-1', makeEngine());
			orchestrator.unregisterLane('lane-1');
			expect(orchestrator.getLaneCount()).toBe(0);
		});
	});

	describe('startAll', () => {
		it('calls play on all engines', () => {
			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.startAll();

			expect(e1.play).toHaveBeenCalledOnce();
			expect(e2.play).toHaveBeenCalledOnce();
		});
	});

	describe('pauseAll', () => {
		it('calls pause on all engines', () => {
			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.pauseAll();

			expect(e1.pause).toHaveBeenCalledOnce();
			expect(e2.pause).toHaveBeenCalledOnce();
		});
	});

	describe('setLaneSpeed', () => {
		it('sets speed on the specified lane engine', () => {
			const e1 = makeEngine();
			orchestrator.registerLane('lane-1', e1);

			orchestrator.setLaneSpeed('lane-1', 2);

			expect(e1.setSpeed).toHaveBeenCalledWith(2);
		});

		it('ignores unknown lane', () => {
			// Should not throw
			orchestrator.setLaneSpeed('nonexistent', 2);
		});
	});

	describe('winner detection', () => {
		it('calls onRaceComplete when first engine completes', () => {
			const onComplete = vi.fn();
			orchestrator.onRaceComplete = onComplete;

			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.startAll();

			// Simulate engine 2 completing first
			e2.onComplete?.();

			expect(onComplete).toHaveBeenCalledWith('lane-2');
		});

		it('does not call onRaceComplete for second finisher', () => {
			const onComplete = vi.fn();
			orchestrator.onRaceComplete = onComplete;

			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.startAll();

			e2.onComplete?.();
			e1.onComplete?.();

			expect(onComplete).toHaveBeenCalledOnce();
		});

		it('pauses remaining engines after winner', () => {
			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.startAll();
			e1.onComplete?.();

			expect(e2.pause).toHaveBeenCalled();
		});
	});

	describe('resetAll', () => {
		it('clears winner state', () => {
			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.startAll();
			e1.onComplete?.();
			orchestrator.resetAll();

			// After reset, should be able to detect winner again
			const onComplete = vi.fn();
			orchestrator.onRaceComplete = onComplete;
			orchestrator.startAll();
			e2.onComplete?.();
			expect(onComplete).toHaveBeenCalledWith('lane-2');
		});
	});

	describe('destroy', () => {
		it('destroys all engines', () => {
			const e1 = makeEngine();
			const e2 = makeEngine();
			orchestrator.registerLane('lane-1', e1);
			orchestrator.registerLane('lane-2', e2);

			orchestrator.destroy();

			expect(e1.destroy).toHaveBeenCalledOnce();
			expect(e2.destroy).toHaveBeenCalledOnce();
			expect(orchestrator.getLaneCount()).toBe(0);
		});
	});
});
