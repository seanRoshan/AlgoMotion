/**
 * GSAP animation presets for CPU Pipeline composite.
 *
 * Provides pipeline-specific animations:
 * - Instruction flow: Highlight cells as instruction progresses through stages
 * - Hazard detection: Flash hazard-affected cells
 * - Stall/bubble: Insert bubble animation
 * - Forwarding: Animate bypass path
 * - Branch prediction: Flush/squash animation for mispredicted instructions
 *
 * Spec reference: Section 6.3.2 (Pipeline), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableCell {
	alpha: number;
	_fillColor?: number;
}

interface AnimatablePath {
	alpha: number;
}

// ── Instruction Flow ──

/**
 * Instruction flow animation — highlights cells left-to-right as an
 * instruction moves through pipeline stages in successive clock cycles.
 */
export function pipelineInstructionFlow(
	cells: AnimatableCell[],
	highlightColor: number,
	stageDelay: number = 0.3,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];
		const originalColor = cell._fillColor ?? 0x2a2a4a;

		// Highlight cell
		tl.to(
			cell,
			{ _fillColor: highlightColor, alpha: 1, duration: 0.15, ease: 'power2.out' },
			i * stageDelay,
		);

		// Revert after brief hold
		tl.to(cell, { _fillColor: originalColor, alpha: 0.8, duration: 0.2 }, i * stageDelay + 0.2);
	}

	return tl;
}

// ── Hazard Detection ──

/**
 * Hazard detection animation — flashes hazard-affected cells with the
 * hazard color, then reverts. Used for data, control, and structural hazards.
 */
export function pipelineHazardDetect(
	affectedCells: AnimatableCell[],
	hazardColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Flash all affected cells simultaneously
	for (const cell of affectedCells) {
		const originalColor = cell._fillColor ?? 0x2a2a4a;

		// Flash to hazard color
		tl.to(cell, { _fillColor: hazardColor, alpha: 1, duration: 0.1 }, 0);

		// Hold, then revert
		tl.to(cell, { _fillColor: originalColor, duration: 0.2 }, 0.3);
	}

	return tl;
}

// ── Stall / Bubble ──

/**
 * Stall (bubble) animation — fades in a bubble cell while shifting
 * downstream stages. The bubble cell appears with reduced alpha.
 */
export function pipelineStallBubble(
	bubbleCell: AnimatableCell,
	shiftedCells: AnimatableCell[],
	bubbleColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Fade in bubble
	tl.fromTo(
		bubbleCell,
		{ alpha: 0, _fillColor: bubbleColor },
		{ alpha: 0.5, duration: 0.2, ease: 'power1.out' },
		0,
	);

	// Step 2: Shift downstream cells (visual pulse to indicate delay)
	for (let i = 0; i < shiftedCells.length; i++) {
		const cell = shiftedCells[i];
		tl.to(cell, { alpha: 0.4, duration: 0.1 }, 0.1);
		tl.to(cell, { alpha: 0.8, duration: 0.15 }, 0.25 + i * 0.05);
	}

	return tl;
}

// ── Forwarding ──

/**
 * Forwarding path animation — highlights the bypass path from source
 * to destination, showing data being forwarded to avoid a stall.
 */
export function pipelineForwarding(
	sourceCells: AnimatableCell[],
	destCells: AnimatableCell[],
	forwardingPath: AnimatablePath,
	forwardColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Step 1: Highlight source cells
	for (const cell of sourceCells) {
		tl.to(cell, { _fillColor: forwardColor, alpha: 1, duration: 0.15 }, 0);
	}

	// Step 2: Animate forwarding path
	tl.fromTo(forwardingPath, { alpha: 0 }, { alpha: 1, duration: 0.2, ease: 'power2.out' }, 0.15);

	// Step 3: Highlight destination cells
	for (const cell of destCells) {
		tl.to(cell, { _fillColor: forwardColor, alpha: 1, duration: 0.15 }, 0.35);
	}

	// Step 4: Fade path and revert
	tl.to(forwardingPath, { alpha: 0.3, duration: 0.3 }, 0.6);

	return tl;
}

// ── Branch Prediction ──

/**
 * Branch prediction animation — shows speculative execution, then either
 * confirms (correct prediction) or flushes (misprediction).
 */
export function pipelineBranchPredict(
	speculativeCells: AnimatableCell[],
	correct: boolean,
	correctColor: number,
	flushColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	if (correct) {
		// Correct prediction — brief green flash
		for (const cell of speculativeCells) {
			tl.to(cell, { _fillColor: correctColor, alpha: 1, duration: 0.15 }, 0);
			tl.to(cell, { alpha: 0.8, duration: 0.2 }, 0.3);
		}
	} else {
		// Misprediction — flash red and fade out (flush)
		for (const cell of speculativeCells) {
			tl.to(cell, { _fillColor: flushColor, alpha: 1, duration: 0.1 }, 0);
			tl.to(cell, { alpha: 0, duration: 0.3, ease: 'power2.in' }, 0.2);
		}
	}

	return tl;
}

// ── Full Pipeline Cycle ──

/**
 * Full pipeline cycle — animates one complete clock cycle across all
 * instructions in the pipeline, advancing each by one stage.
 */
export function pipelineClockTick(
	rows: AnimatableCell[][],
	highlightColor: number,
	cycleDuration: number = 0.4,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let row = 0; row < rows.length; row++) {
		const cells = rows[row];
		for (let col = 0; col < cells.length; col++) {
			const cell = cells[col];
			const originalColor = cell._fillColor ?? 0x2a2a4a;

			// Brief highlight pulse
			tl.to(
				cell,
				{ _fillColor: highlightColor, alpha: 1, duration: cycleDuration * 0.3 },
				row * 0.05,
			);
			tl.to(
				cell,
				{ _fillColor: originalColor, alpha: 0.8, duration: cycleDuration * 0.4 },
				row * 0.05 + cycleDuration * 0.5,
			);
		}
	}

	return tl;
}
