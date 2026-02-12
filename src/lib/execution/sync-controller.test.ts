import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncController } from './sync-controller';

describe('SyncController', () => {
	let controller: SyncController;

	beforeEach(() => {
		controller = new SyncController();
	});

	describe('line mapping', () => {
		it('registers line-to-sequence mappings', () => {
			controller.setLineMapping(1, 'seq-highlight');
			controller.setLineMapping(3, 'seq-swap');

			expect(controller.getSequenceForLine(1)).toBe('seq-highlight');
			expect(controller.getSequenceForLine(3)).toBe('seq-swap');
		});

		it('returns undefined for unmapped lines', () => {
			expect(controller.getSequenceForLine(99)).toBeUndefined();
		});

		it('registers bulk line mappings', () => {
			controller.setLineMappings({
				1: 'seq-init',
				3: 'seq-compare',
				5: 'seq-swap',
			});

			expect(controller.getSequenceForLine(1)).toBe('seq-init');
			expect(controller.getSequenceForLine(3)).toBe('seq-compare');
			expect(controller.getSequenceForLine(5)).toBe('seq-swap');
		});

		it('clears all mappings', () => {
			controller.setLineMapping(1, 'seq-init');
			controller.clearMappings();

			expect(controller.getSequenceForLine(1)).toBeUndefined();
		});
	});

	describe('step-to-time mapping', () => {
		it('maps step index to timeline position', () => {
			controller.setStepTime(0, 0.0);
			controller.setStepTime(1, 0.5);
			controller.setStepTime(2, 1.2);

			expect(controller.getTimeForStep(0)).toBe(0.0);
			expect(controller.getTimeForStep(1)).toBe(0.5);
			expect(controller.getTimeForStep(2)).toBe(1.2);
		});

		it('returns 0 for unmapped steps', () => {
			expect(controller.getTimeForStep(99)).toBe(0);
		});

		it('finds the nearest step for a given time', () => {
			controller.setStepTime(0, 0.0);
			controller.setStepTime(1, 0.5);
			controller.setStepTime(2, 1.2);
			controller.setStepTime(3, 2.0);

			expect(controller.getStepForTime(0.3)).toBe(0);
			expect(controller.getStepForTime(0.7)).toBe(1);
			expect(controller.getStepForTime(1.5)).toBe(2);
			expect(controller.getStepForTime(2.5)).toBe(3);
		});
	});

	describe('step-to-line mapping', () => {
		it('maps step index to code line', () => {
			controller.setStepLine(0, 1);
			controller.setStepLine(1, 2);
			controller.setStepLine(2, 3);

			expect(controller.getLineForStep(0)).toBe(1);
			expect(controller.getLineForStep(1)).toBe(2);
			expect(controller.getLineForStep(2)).toBe(3);
		});

		it('returns 0 for unmapped steps', () => {
			expect(controller.getLineForStep(99)).toBe(0);
		});

		it('finds line for a given time via step lookup', () => {
			controller.setStepTime(0, 0.0);
			controller.setStepTime(1, 0.5);
			controller.setStepLine(0, 1);
			controller.setStepLine(1, 3);

			expect(controller.getLineForTime(0.0)).toBe(1);
			expect(controller.getLineForTime(0.6)).toBe(3);
		});
	});

	describe('callbacks', () => {
		it('calls onSeekTimeline when stepping to a mapped time', () => {
			const onSeek = vi.fn();
			controller.onSeekTimeline = onSeek;

			controller.setStepTime(0, 0.0);
			controller.setStepTime(1, 0.5);

			controller.advanceToStep(1);

			expect(onSeek).toHaveBeenCalledWith(0.5);
		});

		it('calls onHighlightLine when seeking timeline', () => {
			const onHighlight = vi.fn();
			controller.onHighlightLine = onHighlight;

			controller.setStepTime(0, 0.0);
			controller.setStepTime(1, 0.5);
			controller.setStepLine(0, 1);
			controller.setStepLine(1, 3);

			controller.syncFromTime(0.5);

			expect(onHighlight).toHaveBeenCalledWith(3);
		});
	});

	describe('state', () => {
		it('tracks current step index', () => {
			controller.setStepTime(0, 0.0);
			controller.setStepTime(1, 0.5);

			controller.advanceToStep(1);

			expect(controller.currentStep).toBe(1);
		});

		it('resets state', () => {
			controller.setStepTime(0, 0.0);
			controller.setStepLine(0, 1);
			controller.setLineMapping(1, 'seq-init');
			controller.advanceToStep(0);

			controller.reset();

			expect(controller.currentStep).toBe(-1);
			expect(controller.getTimeForStep(0)).toBe(0);
		});
	});
});
