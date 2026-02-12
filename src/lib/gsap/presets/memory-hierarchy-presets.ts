/**
 * GSAP animation presets for Memory Hierarchy composite.
 *
 * Provides memory hierarchy animations:
 * - Access time comparison: Visual latency comparison across levels
 * - Page fault: TLB miss → page table walk → disk access → page load
 * - TLB lookup: TLB hit/miss paths
 * - Virtual → Physical mapping: Address translation animation
 *
 * Spec reference: Section 6.3.2 (Memory Hierarchy), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableLevel {
	alpha: number;
	_fillColor?: number;
}

// ── Access Time Comparison ──

/**
 * Access time comparison — highlights each level sequentially with
 * increasing delay to visually show relative latency differences.
 */
export function memoryAccessComparison(
	levels: AnimatableLevel[],
	highlightColor: number,
	baseDelay: number = 0.15,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < levels.length; i++) {
		const level = levels[i];
		const originalColor = level._fillColor ?? 0x2a2a4a;
		// Each level takes exponentially longer
		const delay = baseDelay * 2 ** i;

		tl.to(level, { _fillColor: highlightColor, alpha: 1, duration: 0.1 }, '>');
		tl.to(level, { _fillColor: originalColor, alpha: 0.8, duration: delay }, '>');
	}

	return tl;
}

// ── Page Fault ──

/**
 * Page fault animation — shows the full path of a page fault:
 * TLB miss → page table walk → disk access → page loaded into RAM.
 */
export function memoryPageFault(
	tlb: AnimatableLevel,
	pageTable: AnimatableLevel,
	disk: AnimatableLevel,
	ram: AnimatableLevel,
	missColor: number,
	loadColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const tlbOriginal = tlb._fillColor ?? 0x2a2a4a;
	const ptOriginal = pageTable._fillColor ?? 0x2a2a4a;
	const diskOriginal = disk._fillColor ?? 0x2a2a4a;
	const ramOriginal = ram._fillColor ?? 0x2a2a4a;

	// Step 1: TLB miss
	tl.to(tlb, { _fillColor: missColor, alpha: 1, duration: 0.15 }, 0);
	tl.to(tlb, { _fillColor: tlbOriginal, alpha: 0.8, duration: 0.1 }, 0.2);

	// Step 2: Page table walk
	tl.to(pageTable, { _fillColor: missColor, alpha: 1, duration: 0.2 }, 0.3);
	tl.to(pageTable, { _fillColor: ptOriginal, alpha: 0.8, duration: 0.1 }, 0.55);

	// Step 3: Disk access (slow — longer duration)
	tl.to(disk, { _fillColor: loadColor, alpha: 1, duration: 0.4 }, 0.65);

	// Step 4: Page loaded into RAM
	tl.to(ram, { _fillColor: loadColor, alpha: 1, duration: 0.2 }, 1.1);
	tl.to(disk, { _fillColor: diskOriginal, alpha: 0.8, duration: 0.15 }, 1.3);
	tl.to(ram, { _fillColor: ramOriginal, alpha: 0.8, duration: 0.15 }, 1.5);

	return tl;
}

// ── TLB Lookup ──

/**
 * TLB hit — quick highlight of TLB followed by target level.
 */
export function memoryTlbHit(
	tlb: AnimatableLevel,
	targetLevel: AnimatableLevel,
	hitColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const tlbOriginal = tlb._fillColor ?? 0x2a2a4a;
	const targetOriginal = targetLevel._fillColor ?? 0x2a2a4a;

	tl.to(tlb, { _fillColor: hitColor, alpha: 1, duration: 0.15 }, 0);
	tl.to(targetLevel, { _fillColor: hitColor, alpha: 1, duration: 0.15 }, 0.2);
	tl.to(tlb, { _fillColor: tlbOriginal, alpha: 0.8, duration: 0.15 }, 0.45);
	tl.to(targetLevel, { _fillColor: targetOriginal, alpha: 0.8, duration: 0.15 }, 0.45);

	return tl;
}

/**
 * TLB miss — flashes TLB red, then walks to lower levels.
 */
export function memoryTlbMiss(
	tlb: AnimatableLevel,
	walkLevels: AnimatableLevel[],
	missColor: number,
	walkColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const tlbOriginal = tlb._fillColor ?? 0x2a2a4a;

	// TLB miss flash
	tl.to(tlb, { _fillColor: missColor, alpha: 1, duration: 0.12 }, 0);
	tl.to(tlb, { _fillColor: tlbOriginal, alpha: 0.8, duration: 0.1 }, 0.15);

	// Walk through levels
	for (let i = 0; i < walkLevels.length; i++) {
		const level = walkLevels[i];
		const originalColor = level._fillColor ?? 0x2a2a4a;

		tl.to(level, { _fillColor: walkColor, alpha: 1, duration: 0.15 }, 0.3 + i * 0.2);
		tl.to(level, { _fillColor: originalColor, alpha: 0.8, duration: 0.1 }, 0.3 + i * 0.2 + 0.18);
	}

	return tl;
}

// ── Virtual → Physical Mapping ──

/**
 * Address translation animation — shows virtual address being
 * decomposed and mapped to a physical address.
 */
export function memoryAddressTranslation(
	virtualAddr: AnimatableLevel,
	tlb: AnimatableLevel,
	physicalAddr: AnimatableLevel,
	translationColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const vOriginal = virtualAddr._fillColor ?? 0x2a2a4a;
	const tlbOriginal = tlb._fillColor ?? 0x2a2a4a;
	const pOriginal = physicalAddr._fillColor ?? 0x2a2a4a;

	// Step 1: Virtual address activates
	tl.to(virtualAddr, { _fillColor: translationColor, alpha: 1, duration: 0.15 }, 0);

	// Step 2: TLB processes
	tl.to(tlb, { _fillColor: translationColor, alpha: 1, duration: 0.2 }, 0.2);

	// Step 3: Physical address produced
	tl.to(physicalAddr, { _fillColor: translationColor, alpha: 1, duration: 0.15 }, 0.45);

	// Step 4: Revert
	tl.to(virtualAddr, { _fillColor: vOriginal, alpha: 0.8, duration: 0.15 }, 0.7);
	tl.to(tlb, { _fillColor: tlbOriginal, alpha: 0.8, duration: 0.15 }, 0.7);
	tl.to(physicalAddr, { _fillColor: pOriginal, alpha: 0.8, duration: 0.15 }, 0.7);

	return tl;
}
