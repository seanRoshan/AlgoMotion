/**
 * Tests for Pipeline GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	pipelineBranchPredict,
	pipelineClockTick,
	pipelineForwarding,
	pipelineHazardDetect,
	pipelineInstructionFlow,
	pipelineStallBubble,
} from './pipeline-presets';

interface MockCell {
	alpha: number;
	_fillColor: number;
}

interface MockPath {
	alpha: number;
}

function makeCell(): MockCell {
	return { alpha: 0.8, _fillColor: 0x2a2a4a };
}

function makePath(): MockPath {
	return { alpha: 0 };
}

describe('Pipeline Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('pipelineInstructionFlow', () => {
		it('returns a GSAP timeline', () => {
			const tl = pipelineInstructionFlow([makeCell(), makeCell(), makeCell()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration with cells', () => {
			const tl = pipelineInstructionFlow(
				[makeCell(), makeCell(), makeCell(), makeCell(), makeCell()],
				0x3b82f6,
			);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has zero duration with empty cells', () => {
			const tl = pipelineInstructionFlow([], 0x3b82f6);
			expect(tl.duration()).toBe(0);
		});

		it('accepts custom stage delay', () => {
			const fast = pipelineInstructionFlow([makeCell(), makeCell()], 0x3b82f6, 0.1);
			const slow = pipelineInstructionFlow([makeCell(), makeCell()], 0x3b82f6, 0.5);
			expect(slow.duration()).toBeGreaterThan(fast.duration());
		});
	});

	describe('pipelineHazardDetect', () => {
		it('returns a GSAP timeline', () => {
			const tl = pipelineHazardDetect([makeCell(), makeCell()], 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = pipelineHazardDetect([makeCell()], 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty cells', () => {
			const tl = pipelineHazardDetect([], 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('pipelineStallBubble', () => {
		it('returns a GSAP timeline', () => {
			const tl = pipelineStallBubble(makeCell(), [makeCell(), makeCell()], 0x374151);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = pipelineStallBubble(makeCell(), [makeCell()], 0x374151);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty shifted cells', () => {
			const tl = pipelineStallBubble(makeCell(), [], 0x374151);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('pipelineForwarding', () => {
		it('returns a GSAP timeline', () => {
			const tl = pipelineForwarding([makeCell()], [makeCell()], makePath(), 0xf97316);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = pipelineForwarding([makeCell()], [makeCell()], makePath(), 0xf97316);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty source and dest cells', () => {
			const tl = pipelineForwarding([], [], makePath(), 0xf97316);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});
	});

	describe('pipelineBranchPredict', () => {
		it('returns a GSAP timeline for correct prediction', () => {
			const tl = pipelineBranchPredict([makeCell(), makeCell()], true, 0x22c55e, 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('returns a GSAP timeline for misprediction', () => {
			const tl = pipelineBranchPredict([makeCell(), makeCell()], false, 0x22c55e, 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration for correct prediction', () => {
			const tl = pipelineBranchPredict([makeCell()], true, 0x22c55e, 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has positive duration for misprediction', () => {
			const tl = pipelineBranchPredict([makeCell()], false, 0x22c55e, 0xef4444);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty speculative cells', () => {
			const tl = pipelineBranchPredict([], true, 0x22c55e, 0xef4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});
	});

	describe('pipelineClockTick', () => {
		it('returns a GSAP timeline', () => {
			const tl = pipelineClockTick(
				[
					[makeCell(), makeCell()],
					[makeCell(), makeCell()],
				],
				0x3b82f6,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration with rows', () => {
			const tl = pipelineClockTick([[makeCell(), makeCell(), makeCell()]], 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('has zero duration with empty rows', () => {
			const tl = pipelineClockTick([], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});

		it('accepts custom cycle duration', () => {
			const fast = pipelineClockTick([[makeCell()]], 0x3b82f6, 0.2);
			const slow = pipelineClockTick([[makeCell()]], 0x3b82f6, 0.8);
			expect(slow.duration()).toBeGreaterThan(fast.duration());
		});

		it('duration scales with row count', () => {
			const oneRow = pipelineClockTick([[makeCell(), makeCell()]], 0x3b82f6);
			const threeRows = pipelineClockTick(
				[
					[makeCell(), makeCell()],
					[makeCell(), makeCell()],
					[makeCell(), makeCell()],
				],
				0x3b82f6,
			);
			expect(threeRows.duration()).toBeGreaterThan(oneRow.duration());
		});
	});
});
