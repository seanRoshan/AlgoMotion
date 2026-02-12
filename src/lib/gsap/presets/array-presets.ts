import gsap from 'gsap';

/**
 * Minimal interface for animatable cell objects.
 * Matches the Pixi.js Container position/style properties
 * that GSAP will manipulate during array animations.
 */
interface AnimatableCell {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

/** Default cell width + gap used by the array renderer. */
const CELL_STRIDE = 52; // 48 cellSize + 4 gap
const LIFT_Y = -30;

/**
 * Swap two cells in an array with a lift-cross-drop choreography.
 *
 * 1. Both cells lift up (y offset)
 * 2. Cells cross to each other's x position
 * 3. Both drop back down
 *
 * Spec reference: Section 9.3 (Array swap preset)
 */
export function arraySwap(
	cells: AnimatableCell[],
	indexA: number,
	indexB: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const cellA = cells[indexA];
	const cellB = cells[indexB];
	const targetAx = cellB.position.x;
	const targetBx = cellA.position.x;

	// Phase 1: Lift both cells
	tl.to(cellA.position, { y: LIFT_Y, duration: 0.15, ease: 'power2.out' }, 0);
	tl.to(cellB.position, { y: LIFT_Y, duration: 0.15, ease: 'power2.out' }, 0);

	// Phase 2: Cross — move to each other's x positions
	tl.to(cellA.position, { x: targetAx, duration: 0.3, ease: 'power1.inOut' }, 0.15);
	tl.to(cellB.position, { x: targetBx, duration: 0.3, ease: 'power1.inOut' }, 0.15);

	// Phase 3: Drop back down
	tl.to(cellA.position, { y: 0, duration: 0.15, ease: 'power2.in' }, 0.45);
	tl.to(cellB.position, { y: 0, duration: 0.15, ease: 'power2.in' }, 0.45);

	return tl;
}

/**
 * Shift cells from a given index in the specified direction.
 * Used during insert (shift right) and delete (shift left) operations.
 */
export function arrayShift(
	cells: AnimatableCell[],
	fromIndex: number,
	direction: 'left' | 'right',
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const offset = direction === 'right' ? CELL_STRIDE : -CELL_STRIDE;

	for (let i = fromIndex; i < cells.length; i++) {
		tl.to(
			cells[i].position,
			{ x: cells[i].position.x + offset, duration: 0.25, ease: 'power1.out' },
			0,
		);
	}

	return tl;
}

/**
 * Highlight specific cells with a color pulse effect.
 * Scales up slightly and changes fill color, then reverts.
 */
export function arrayHighlight(
	cells: AnimatableCell[],
	indices: number[],
	color: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (const idx of indices) {
		const cell = cells[idx];
		const originalColor = cell._fillColor;

		// Pulse: scale up and color
		tl.to(cell.scale, { x: 1.15, y: 1.15, duration: 0.15, ease: 'power2.out' }, 0);
		tl.to(cell, { _fillColor: color, duration: 0.15 }, 0);

		// Revert
		tl.to(cell.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.in' }, 0.3);
		tl.to(cell, { _fillColor: originalColor, duration: 0.15 }, 0.3);
	}

	return tl;
}

/**
 * Highlight two cells for comparison — both light up simultaneously.
 */
export function arrayCompare(
	cells: AnimatableCell[],
	indexA: number,
	indexB: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Scale up both cells
	tl.to(cells[indexA].scale, { x: 1.1, y: 1.1, duration: 0.2, ease: 'power2.out' }, 0);
	tl.to(cells[indexB].scale, { x: 1.1, y: 1.1, duration: 0.2, ease: 'power2.out' }, 0);

	// Revert
	tl.to(cells[indexA].scale, { x: 1, y: 1, duration: 0.2, ease: 'power2.in' }, 0.3);
	tl.to(cells[indexB].scale, { x: 1, y: 1, duration: 0.2, ease: 'power2.in' }, 0.3);

	return tl;
}

/**
 * Insert a new cell at a given index:
 * 1. Shift existing cells right from the index
 * 2. Fade in the new cell at the target position
 */
export function arrayInsert(
	cells: AnimatableCell[],
	insertIndex: number,
	newCell: AnimatableCell,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Phase 1: Shift cells right from insertIndex
	for (let i = insertIndex; i < cells.length; i++) {
		tl.to(
			cells[i].position,
			{ x: cells[i].position.x + CELL_STRIDE, duration: 0.25, ease: 'power1.out' },
			0,
		);
	}

	// Phase 2: Fade in new cell
	tl.to(newCell, { alpha: 1, duration: 0.2, ease: 'power1.out' }, 0.25);
	tl.to(newCell.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out' }, 0.25);

	return tl;
}

/**
 * Delete a cell at a given index:
 * 1. Fade out the target cell
 * 2. Shift remaining cells left to fill the gap
 */
export function arrayDelete(cells: AnimatableCell[], deleteIndex: number): gsap.core.Timeline {
	const tl = gsap.timeline();
	const cell = cells[deleteIndex];

	// Phase 1: Fade out
	tl.to(cell, { alpha: 0, duration: 0.2, ease: 'power1.in' }, 0);
	tl.to(cell.scale, { x: 0.8, y: 0.8, duration: 0.2, ease: 'power1.in' }, 0);

	// Phase 2: Shift remaining cells left
	for (let i = deleteIndex + 1; i < cells.length; i++) {
		tl.to(
			cells[i].position,
			{ x: cells[i].position.x - CELL_STRIDE, duration: 0.25, ease: 'power1.out' },
			0.2,
		);
	}

	return tl;
}

/**
 * Mark cells as sorted — bounce and recolor to the sorted color.
 */
export function arrayMarkSorted(
	cells: AnimatableCell[],
	indices: number[],
	sortedColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < indices.length; i++) {
		const cell = cells[indices[i]];
		const stagger = i * 0.08;

		// Scale bounce
		tl.to(cell.scale, { x: 1.15, y: 1.15, duration: 0.12, ease: 'power2.out' }, stagger);
		tl.to(cell.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' }, stagger + 0.12);

		// Recolor
		tl.to(cell, { _fillColor: sortedColor, duration: 0.2 }, stagger);
	}

	return tl;
}
