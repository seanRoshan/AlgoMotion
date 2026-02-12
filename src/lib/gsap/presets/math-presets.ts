/**
 * GSAP animation presets for Math composites.
 *
 * Provides animations for coordinate plane, matrix, and number line:
 * - Point plot (fade in points sequentially)
 * - Line trace (draw line progressively)
 * - Matrix element highlight (row/col sweep)
 * - Matrix multiply step
 * - Number line marker slide
 *
 * Spec reference: Section 6.3.3 (Math composites), Section 9.3
 */

import gsap from 'gsap';

interface AnimatableNode {
	alpha: number;
	_fillColor?: number;
	position?: { x: number; y: number };
}

// ── Coordinate Plane ──

/**
 * Point plot — fades in points sequentially on the coordinate plane.
 */
export function mathPlotPoints(points: AnimatableNode[], plotColor: number): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < points.length; i++) {
		tl.fromTo(
			points[i],
			{ alpha: 0, _fillColor: plotColor },
			{ alpha: 1, duration: 0.15, ease: 'back.out' },
			i * 0.12,
		);
	}

	return tl;
}

/**
 * Line trace — animates drawing a line progressively.
 * Uses alpha fade since we can't animate SVG path length in Pixi.
 */
export function mathLineTrace(
	lineSegments: AnimatableNode[],
	traceColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < lineSegments.length; i++) {
		tl.fromTo(
			lineSegments[i],
			{ alpha: 0, _fillColor: traceColor },
			{ alpha: 1, duration: 0.1 },
			i * 0.08,
		);
	}

	return tl;
}

// ── Matrix ──

/**
 * Matrix row highlight — sweeps across a row.
 */
export function mathMatrixRowHighlight(
	cells: AnimatableNode[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];
		const originalColor = cell._fillColor ?? 0x2a2a4a;
		tl.to(cell, { _fillColor: highlightColor, alpha: 1, duration: 0.1 }, i * 0.08);
		tl.to(cell, { _fillColor: originalColor, alpha: 0.8, duration: 0.08 }, i * 0.08 + 0.12);
	}

	return tl;
}

/**
 * Matrix multiply step — highlights one cell computation:
 * row elements + column elements flash, result cell lights up.
 */
export function mathMatrixMultiplyStep(
	rowCells: AnimatableNode[],
	colCells: AnimatableNode[],
	resultCell: AnimatableNode,
	rowColor: number,
	colColor: number,
	resultColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Highlight row
	for (let i = 0; i < rowCells.length; i++) {
		tl.to(rowCells[i], { _fillColor: rowColor, alpha: 1, duration: 0.08 }, i * 0.06);
	}

	// Highlight column
	const rowDuration = rowCells.length * 0.06 + 0.1;
	for (let i = 0; i < colCells.length; i++) {
		tl.to(colCells[i], { _fillColor: colColor, alpha: 1, duration: 0.08 }, rowDuration + i * 0.06);
	}

	// Result
	const colDuration = rowDuration + colCells.length * 0.06 + 0.1;
	tl.to(resultCell, { _fillColor: resultColor, alpha: 1, duration: 0.15 }, colDuration);

	// Settle all
	const settleDuration = colDuration + 0.2;
	for (const cell of [...rowCells, ...colCells]) {
		tl.to(cell, { alpha: 0.8, duration: 0.08 }, settleDuration);
	}
	tl.to(resultCell, { alpha: 0.8, duration: 0.08 }, settleDuration + 0.1);

	return tl;
}

// ── Number Line ──

/**
 * Number line marker slide — moves a marker along the line.
 */
export function mathNumberLineSlide(
	marker: AnimatableNode,
	targetX: number,
	slideColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.to(marker, { _fillColor: slideColor, alpha: 1, duration: 0.1 }, 0);
	if (marker.position) {
		tl.to(marker.position, { x: targetX, duration: 0.4, ease: 'power2.inOut' }, 0.1);
	}
	tl.to(marker, { alpha: 0.8, duration: 0.1 }, 0.55);

	return tl;
}
