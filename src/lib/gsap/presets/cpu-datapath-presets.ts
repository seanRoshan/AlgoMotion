/**
 * GSAP animation presets for CPU Datapath composite.
 *
 * Provides instruction cycle animations:
 * - Fetch: PC → Instruction Memory → IR
 * - Decode: Instruction → Control signals → Register read
 * - Execute: ALU operation with operand flow
 * - Memory: Data memory read/write
 * - Write-back: Result → Register file
 * - Data flow: Highlight path along buses
 *
 * Spec reference: Section 6.3.2 (CPU Datapath), Section 9.3 (Animation Presets)
 */

import gsap from 'gsap';

interface AnimatableComponent {
	alpha: number;
	_fillColor: number;
	scale?: { x: number; y: number };
}

interface AnimatableBus {
	alpha: number;
	_strokeColor?: number;
}

// ── Cycle Stage Animations ──

/**
 * Fetch cycle animation — highlights PC, then instruction memory, then instruction bus.
 * Simulates: PC → addr bus → instruction memory → instruction register.
 */
export function cpuFetchCycle(
	pc: AnimatableComponent,
	instrMem: AnimatableComponent,
	addrBus: AnimatableBus,
	instrBus: AnimatableBus,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const pcOriginal = pc._fillColor;
	const memOriginal = instrMem._fillColor;

	// Step 1: Highlight PC
	tl.to(pc, { _fillColor: highlightColor, duration: 0.2 }, 0);

	// Step 2: Data flows along address bus
	tl.to(addrBus, { alpha: 1, duration: 0.15 }, 0.2);

	// Step 3: Instruction memory activates
	tl.to(instrMem, { _fillColor: highlightColor, duration: 0.2 }, 0.35);

	// Step 4: Instruction flows out
	tl.to(instrBus, { alpha: 1, duration: 0.15 }, 0.55);

	// Step 5: Revert colors
	tl.to(pc, { _fillColor: pcOriginal, duration: 0.2 }, 0.8);
	tl.to(instrMem, { _fillColor: memOriginal, duration: 0.2 }, 0.8);

	return tl;
}

/**
 * Decode cycle animation — control unit processes instruction and sends signals.
 */
export function cpuDecodeCycle(
	controlUnit: AnimatableComponent,
	registerFile: AnimatableComponent,
	controlBuses: AnimatableBus[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const ctrlOriginal = controlUnit._fillColor;
	const regOriginal = registerFile._fillColor;

	// Step 1: Control unit activates
	tl.to(controlUnit, { _fillColor: highlightColor, duration: 0.2 }, 0);

	// Step 2: Control signals propagate
	for (let i = 0; i < controlBuses.length; i++) {
		tl.to(controlBuses[i], { alpha: 1, duration: 0.1 }, 0.2 + i * 0.05);
	}

	// Step 3: Register file reads
	tl.to(registerFile, { _fillColor: highlightColor, duration: 0.2 }, 0.4);

	// Step 4: Revert
	tl.to(controlUnit, { _fillColor: ctrlOriginal, duration: 0.2 }, 0.7);
	tl.to(registerFile, { _fillColor: regOriginal, duration: 0.2 }, 0.7);

	return tl;
}

/**
 * Execute cycle animation — operands flow to ALU, result computed.
 */
export function cpuExecuteCycle(
	registerFile: AnimatableComponent,
	alu: AnimatableComponent,
	dataBus: AnimatableBus,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const regOriginal = registerFile._fillColor;
	const aluOriginal = alu._fillColor;

	// Step 1: Register file sends operands
	tl.to(registerFile, { _fillColor: highlightColor, duration: 0.2 }, 0);
	tl.to(dataBus, { alpha: 1, duration: 0.15 }, 0.2);

	// Step 2: ALU computes
	tl.to(alu, { _fillColor: highlightColor, duration: 0.3 }, 0.35);

	// Step 3: Revert
	tl.to(registerFile, { _fillColor: regOriginal, duration: 0.2 }, 0.75);
	tl.to(alu, { _fillColor: aluOriginal, duration: 0.2 }, 0.75);

	return tl;
}

/**
 * Memory access cycle — ALU result used as address, data memory read/write.
 */
export function cpuMemoryAccess(
	alu: AnimatableComponent,
	dataMem: AnimatableComponent,
	addrBus: AnimatableBus,
	dataBus: AnimatableBus,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const aluOriginal = alu._fillColor;
	const memOriginal = dataMem._fillColor;

	// Step 1: ALU sends address
	tl.to(alu, { _fillColor: highlightColor, duration: 0.2 }, 0);
	tl.to(addrBus, { alpha: 1, duration: 0.15 }, 0.2);

	// Step 2: Data memory activates
	tl.to(dataMem, { _fillColor: highlightColor, duration: 0.2 }, 0.35);

	// Step 3: Data flows out
	tl.to(dataBus, { alpha: 1, duration: 0.15 }, 0.55);

	// Step 4: Revert
	tl.to(alu, { _fillColor: aluOriginal, duration: 0.2 }, 0.8);
	tl.to(dataMem, { _fillColor: memOriginal, duration: 0.2 }, 0.8);

	return tl;
}

/**
 * Write-back cycle — result flows through MUX to register file.
 */
export function cpuWriteBack(
	mux: AnimatableComponent,
	registerFile: AnimatableComponent,
	dataBus: AnimatableBus,
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();
	const muxOriginal = mux._fillColor;
	const regOriginal = registerFile._fillColor;

	// Step 1: MUX selects result
	tl.to(mux, { _fillColor: highlightColor, duration: 0.2 }, 0);

	// Step 2: Data flows to register file
	tl.to(dataBus, { alpha: 1, duration: 0.15 }, 0.2);

	// Step 3: Register file writes
	tl.to(registerFile, { _fillColor: highlightColor, duration: 0.2 }, 0.35);

	// Step 4: Revert
	tl.to(mux, { _fillColor: muxOriginal, duration: 0.2 }, 0.65);
	tl.to(registerFile, { _fillColor: regOriginal, duration: 0.2 }, 0.65);

	return tl;
}

/**
 * Full instruction cycle — chains all 5 stages sequentially.
 */
export function cpuFullCycle(
	pc: AnimatableComponent,
	instrMem: AnimatableComponent,
	controlUnit: AnimatableComponent,
	registerFile: AnimatableComponent,
	alu: AnimatableComponent,
	dataMem: AnimatableComponent,
	mux: AnimatableComponent,
	buses: {
		pcAddr: AnimatableBus;
		instrData: AnimatableBus;
		controlSignals: AnimatableBus[];
		regToAlu: AnimatableBus;
		aluToMem: AnimatableBus;
		memToMux: AnimatableBus;
		muxToReg: AnimatableBus;
	},
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	// Fetch
	tl.add(cpuFetchCycle(pc, instrMem, buses.pcAddr, buses.instrData, highlightColor));

	// Decode
	tl.add(cpuDecodeCycle(controlUnit, registerFile, buses.controlSignals, highlightColor), '>-0.1');

	// Execute
	tl.add(cpuExecuteCycle(registerFile, alu, buses.regToAlu, highlightColor), '>-0.1');

	// Memory
	tl.add(cpuMemoryAccess(alu, dataMem, buses.aluToMem, buses.memToMux, highlightColor), '>-0.1');

	// Write-back
	tl.add(cpuWriteBack(mux, registerFile, buses.muxToReg, highlightColor), '>-0.1');

	return tl;
}

/**
 * Data flow highlight — pulses a sequence of buses to show data path.
 */
export function cpuDataFlowHighlight(
	buses: AnimatableBus[],
	highlightColor: number,
): gsap.core.Timeline {
	const tl = gsap.timeline();

	for (let i = 0; i < buses.length; i++) {
		const bus = buses[i];
		tl.to(bus, { alpha: 1, duration: 0.15, ease: 'power2.out' }, i * 0.12);
		tl.to(bus, { alpha: 0.6, duration: 0.2, ease: 'power1.in' }, i * 0.12 + 0.25);
	}

	return tl;
}
