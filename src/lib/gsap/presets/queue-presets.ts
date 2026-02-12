import gsap from 'gsap';

interface AnimatableCell {
	position: { x: number; y: number };
	alpha: number;
	scale: { x: number; y: number };
	_fillColor: number;
}

/**
 * Enqueue animation — fades in and scales up a new cell at the rear.
 * The cell should start with alpha: 0 and scale: { x: 0, y: 0 }.
 */
export function queueEnqueue(newCell: AnimatableCell): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(newCell, { alpha: 1, duration: 0.2, ease: 'power1.out' }, 0);
	tl.to(newCell.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out' }, 0);

	return tl;
}

/**
 * Dequeue animation — fades out and slides the front cell to the left.
 */
export function queueDequeue(cell: AnimatableCell): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(cell, { alpha: 0, duration: 0.2, ease: 'power1.in' }, 0);
	tl.to(cell.position, { x: cell.position.x - 40, duration: 0.2, ease: 'power1.in' }, 0);
	tl.to(cell.scale, { x: 0.8, y: 0.8, duration: 0.2, ease: 'power1.in' }, 0);

	return tl;
}

/**
 * Full queue error animation — flashes all cells with an error color, then reverts.
 */
export function queueFull(cells: AnimatableCell[], errorColor: number): gsap.core.Timeline {
	const tl = gsap.timeline();
	const originalColors = cells.map((c) => c._fillColor);

	for (const cell of cells) {
		tl.to(cell, { _fillColor: errorColor, duration: 0.15 }, 0);
	}

	for (let i = 0; i < cells.length; i++) {
		tl.to(cells[i], { _fillColor: originalColors[i], duration: 0.15 }, 0.3);
	}

	return tl;
}

/**
 * Empty queue indicator animation — a brief duration to mark the empty state.
 */
export function queueEmpty(): gsap.core.Timeline {
	const tl = gsap.timeline();
	tl.to({}, { duration: 0.3 });
	return tl;
}
