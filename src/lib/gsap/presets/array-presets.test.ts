import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	arrayCompare,
	arrayDelete,
	arrayHighlight,
	arrayInsert,
	arrayMarkSorted,
	arrayShift,
	arraySwap,
} from './array-presets';

/**
 * Create mock cell objects that mimic Pixi.js Container position/style.
 * GSAP will actually mutate these objects during tests.
 */
function createMockCells(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		position: { x: i * 52, y: 0 },
		alpha: 1,
		scale: { x: 1, y: 1 },
		// Mock Graphics child for fill color changes
		_fillColor: 0x2a2a4a,
	}));
}

describe('Array Animation Presets', () => {
	beforeEach(() => {
		// Ensure GSAP ticker is manually controlled for deterministic tests
		gsap.ticker.lagSmoothing(0);
	});

	afterEach(() => {
		gsap.globalTimeline.clear();
	});

	describe('arraySwap', () => {
		it('creates a timeline that swaps two cell positions', () => {
			const cells = createMockCells(5);
			const tl = arraySwap(cells, 1, 3);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);

			// Complete the animation instantly
			tl.progress(1);

			// Cells 1 and 3 should have swapped x positions
			expect(cells[1].position.x).toBeCloseTo(3 * 52);
			expect(cells[3].position.x).toBeCloseTo(1 * 52);
		});

		it('lifts cells during swap (y offset)', () => {
			const cells = createMockCells(5);
			const tl = arraySwap(cells, 0, 2);

			// At mid-animation, cells should be lifted
			tl.progress(0.3);
			expect(cells[0].position.y).toBeLessThan(0);
		});
	});

	describe('arrayShift', () => {
		it('shifts cells right from a given index', () => {
			const cells = createMockCells(5);
			const originalPositions = cells.map((c) => c.position.x);
			const tl = arrayShift(cells, 2, 'right');

			tl.progress(1);

			// Cells 2, 3, 4 should shift right by one cell width
			expect(cells[2].position.x).toBeGreaterThan(originalPositions[2]);
			expect(cells[3].position.x).toBeGreaterThan(originalPositions[3]);
			expect(cells[4].position.x).toBeGreaterThan(originalPositions[4]);

			// Cells 0, 1 should stay in place
			expect(cells[0].position.x).toBe(originalPositions[0]);
			expect(cells[1].position.x).toBe(originalPositions[1]);
		});
	});

	describe('arrayHighlight', () => {
		it('creates a highlight pulse on specified cells', () => {
			const cells = createMockCells(5);
			const tl = arrayHighlight(cells, [1, 3], 0x3b82f6);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('arrayCompare', () => {
		it('creates a timeline that highlights two cells for comparison', () => {
			const cells = createMockCells(5);
			const tl = arrayCompare(cells, 1, 3);

			expect(tl).toBeDefined();
			expect(tl.totalDuration()).toBeGreaterThan(0);
		});
	});

	describe('arrayInsert', () => {
		it('creates a timeline that shifts right and fades in a new cell', () => {
			const cells = createMockCells(5);
			// The new cell to insert at index 2
			const newCell = {
				position: { x: 2 * 52, y: 0 },
				alpha: 0,
				scale: { x: 1, y: 1 },
				_fillColor: 0x2a2a4a,
			};
			const tl = arrayInsert(cells, 2, newCell);

			tl.progress(1);

			// New cell should be fully visible
			expect(newCell.alpha).toBe(1);
		});
	});

	describe('arrayDelete', () => {
		it('creates a timeline that fades out cell and shifts remaining left', () => {
			const cells = createMockCells(5);
			const tl = arrayDelete(cells, 2);

			tl.progress(1);

			// Deleted cell should be invisible
			expect(cells[2].alpha).toBe(0);
		});
	});

	describe('arrayMarkSorted', () => {
		it('creates a timeline that scales and recolors a cell', () => {
			const cells = createMockCells(5);
			const tl = arrayMarkSorted(cells, [2, 4], 0x10b981);

			expect(tl).toBeDefined();
			tl.progress(1);

			// Sorted cells should have the sorted fill color
			expect(cells[2]._fillColor).toBe(0x10b981);
			expect(cells[4]._fillColor).toBe(0x10b981);
		});
	});
});
