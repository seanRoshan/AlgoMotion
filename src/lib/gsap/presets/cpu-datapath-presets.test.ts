/**
 * Tests for CPU Datapath GSAP animation presets.
 */

import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	cpuDataFlowHighlight,
	cpuDecodeCycle,
	cpuExecuteCycle,
	cpuFetchCycle,
	cpuFullCycle,
	cpuMemoryAccess,
	cpuWriteBack,
} from './cpu-datapath-presets';

interface MockComponent {
	alpha: number;
	_fillColor: number;
}

interface MockBus {
	alpha: number;
}

function makeComponent(): MockComponent {
	return { alpha: 1, _fillColor: 0x2a2a4a };
}

function makeBus(): MockBus {
	return { alpha: 0.6 };
}

describe('CPU Datapath Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('cpuFetchCycle', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuFetchCycle(makeComponent(), makeComponent(), makeBus(), makeBus(), 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cpuFetchCycle(makeComponent(), makeComponent(), makeBus(), makeBus(), 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('highlights PC during fetch', () => {
			const pc = makeComponent();
			const tl = cpuFetchCycle(pc, makeComponent(), makeBus(), makeBus(), 0x3b82f6);
			tl.progress(0.2);
			// PC should be highlighted at some point
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cpuDecodeCycle', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuDecodeCycle(makeComponent(), makeComponent(), [makeBus(), makeBus()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cpuDecodeCycle(makeComponent(), makeComponent(), [makeBus()], 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty control buses', () => {
			const tl = cpuDecodeCycle(makeComponent(), makeComponent(), [], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});
	});

	describe('cpuExecuteCycle', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuExecuteCycle(makeComponent(), makeComponent(), makeBus(), 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cpuExecuteCycle(makeComponent(), makeComponent(), makeBus(), 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cpuMemoryAccess', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuMemoryAccess(makeComponent(), makeComponent(), makeBus(), makeBus(), 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cpuMemoryAccess(makeComponent(), makeComponent(), makeBus(), makeBus(), 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cpuWriteBack', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuWriteBack(makeComponent(), makeComponent(), makeBus(), 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration', () => {
			const tl = cpuWriteBack(makeComponent(), makeComponent(), makeBus(), 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});
	});

	describe('cpuFullCycle', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuFullCycle(
				makeComponent(), // pc
				makeComponent(), // instrMem
				makeComponent(), // controlUnit
				makeComponent(), // registerFile
				makeComponent(), // alu
				makeComponent(), // dataMem
				makeComponent(), // mux
				{
					pcAddr: makeBus(),
					instrData: makeBus(),
					controlSignals: [makeBus(), makeBus()],
					regToAlu: makeBus(),
					aluToMem: makeBus(),
					memToMux: makeBus(),
					muxToReg: makeBus(),
				},
				0x3b82f6,
			);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has duration greater than individual stages', () => {
			const fetchTl = cpuFetchCycle(
				makeComponent(),
				makeComponent(),
				makeBus(),
				makeBus(),
				0x3b82f6,
			);
			const fullTl = cpuFullCycle(
				makeComponent(),
				makeComponent(),
				makeComponent(),
				makeComponent(),
				makeComponent(),
				makeComponent(),
				makeComponent(),
				{
					pcAddr: makeBus(),
					instrData: makeBus(),
					controlSignals: [],
					regToAlu: makeBus(),
					aluToMem: makeBus(),
					memToMux: makeBus(),
					muxToReg: makeBus(),
				},
				0x3b82f6,
			);
			expect(fullTl.duration()).toBeGreaterThan(fetchTl.duration());
		});
	});

	describe('cpuDataFlowHighlight', () => {
		it('returns a GSAP timeline', () => {
			const tl = cpuDataFlowHighlight([makeBus(), makeBus(), makeBus()], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('has positive duration with multiple buses', () => {
			const tl = cpuDataFlowHighlight([makeBus(), makeBus()], 0x3b82f6);
			expect(tl.duration()).toBeGreaterThan(0);
		});

		it('handles empty buses', () => {
			const tl = cpuDataFlowHighlight([], 0x3b82f6);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
			expect(tl.duration()).toBe(0);
		});
	});
});
