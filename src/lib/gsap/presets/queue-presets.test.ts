import gsap from 'gsap';
import { beforeEach, describe, expect, it } from 'vitest';
import { queueDequeue, queueEmpty, queueEnqueue, queueFull } from './queue-presets';

interface AnimatableCell {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

function makeCell(x: number): AnimatableCell {
	return {
		position: { x, y: 0 },
		alpha: 1,
		scale: { x: 1, y: 1 },
		_fillColor: 0x2a2a4a,
	};
}

describe('Queue Animation Presets', () => {
	beforeEach(() => {
		gsap.ticker.lagSmoothing(0);
	});

	describe('queueEnqueue', () => {
		it('returns a GSAP timeline', () => {
			const newCell = makeCell(200);
			newCell.alpha = 0;
			newCell.scale = { x: 0, y: 0 };
			const tl = queueEnqueue(newCell);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('animates new cell to visible', () => {
			const newCell = makeCell(200);
			newCell.alpha = 0;
			newCell.scale = { x: 0, y: 0 };
			const tl = queueEnqueue(newCell);
			tl.progress(1);
			expect(newCell.alpha).toBe(1);
			expect(newCell.scale.x).toBeCloseTo(1, 1);
		});
	});

	describe('queueDequeue', () => {
		it('returns a GSAP timeline', () => {
			const cell = makeCell(0);
			const tl = queueDequeue(cell);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('animates cell to invisible and shifts left', () => {
			const cell = makeCell(0);
			const tl = queueDequeue(cell);
			tl.progress(1);
			expect(cell.alpha).toBe(0);
		});
	});

	describe('queueFull', () => {
		it('returns a GSAP timeline', () => {
			const cells = [makeCell(0), makeCell(52)];
			const tl = queueFull(cells, 0xff4444);
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});

		it('flashes all cells with error color and reverts', () => {
			const cells = [makeCell(0), makeCell(52)];
			const originalColors = cells.map((c) => c._fillColor);
			const tl = queueFull(cells, 0xff4444);
			tl.progress(1);
			for (let i = 0; i < cells.length; i++) {
				expect(cells[i]._fillColor).toBe(originalColors[i]);
			}
		});
	});

	describe('queueEmpty', () => {
		it('returns a GSAP timeline for empty queue indicator', () => {
			const tl = queueEmpty();
			expect(tl).toBeInstanceOf(gsap.core.Timeline);
		});
	});
});
