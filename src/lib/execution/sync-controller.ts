/**
 * Synchronization controller that bridges code execution and animation timeline.
 *
 * Maintains three mapping tables:
 * 1. lineMapping: code line → animation sequence ID
 * 2. stepTime: step index → timeline position (seconds)
 * 3. stepLine: step index → code line number
 *
 * When stepping through code, it advances the timeline.
 * When seeking the timeline, it highlights the corresponding code line.
 */
export class SyncController {
	private lineMapping: Record<number, string> = {};
	private stepTimeMap: Record<number, number> = {};
	private stepLineMap: Record<number, number> = {};
	private _currentStep = -1;

	onSeekTimeline: ((time: number) => void) | null = null;
	onHighlightLine: ((line: number) => void) | null = null;

	get currentStep(): number {
		return this._currentStep;
	}

	// ── Line Mapping (code line → sequence ID) ──

	setLineMapping(line: number, sequenceId: string): void {
		this.lineMapping[line] = sequenceId;
	}

	setLineMappings(mappings: Record<number, string>): void {
		for (const [line, seqId] of Object.entries(mappings)) {
			this.lineMapping[Number(line)] = seqId;
		}
	}

	getSequenceForLine(line: number): string | undefined {
		return this.lineMapping[line];
	}

	clearMappings(): void {
		this.lineMapping = {};
	}

	// ── Step-to-Time Mapping ──

	setStepTime(stepIndex: number, time: number): void {
		this.stepTimeMap[stepIndex] = time;
	}

	getTimeForStep(stepIndex: number): number {
		return this.stepTimeMap[stepIndex] ?? 0;
	}

	getStepForTime(time: number): number {
		const entries = Object.entries(this.stepTimeMap)
			.map(([idx, t]) => ({ index: Number(idx), time: t }))
			.sort((a, b) => a.time - b.time);

		if (entries.length === 0) return 0;

		// Find closest step whose time <= given time
		let closest = entries[0];
		for (const entry of entries) {
			if (entry.time <= time) {
				closest = entry;
			} else {
				break;
			}
		}

		return closest.index;
	}

	// ── Step-to-Line Mapping ──

	setStepLine(stepIndex: number, line: number): void {
		this.stepLineMap[stepIndex] = line;
	}

	getLineForStep(stepIndex: number): number {
		return this.stepLineMap[stepIndex] ?? 0;
	}

	getLineForTime(time: number): number {
		const step = this.getStepForTime(time);
		return this.getLineForStep(step);
	}

	// ── Synchronization Actions ──

	advanceToStep(stepIndex: number): void {
		this._currentStep = stepIndex;
		const time = this.getTimeForStep(stepIndex);
		this.onSeekTimeline?.(time);
	}

	syncFromTime(time: number): void {
		const step = this.getStepForTime(time);
		this._currentStep = step;
		const line = this.getLineForStep(step);
		if (line > 0) {
			this.onHighlightLine?.(line);
		}
	}

	// ── Reset ──

	reset(): void {
		this._currentStep = -1;
		this.lineMapping = {};
		this.stepTimeMap = {};
		this.stepLineMap = {};
		this.onSeekTimeline = null;
		this.onHighlightLine = null;
	}
}
