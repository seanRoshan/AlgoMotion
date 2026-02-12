/**
 * RaceOrchestrator — coordinates side-by-side algorithm races.
 *
 * Manages multiple AnimationEngine instances, one per lane.
 * Provides synchronized start, per-lane speed control,
 * and automatic winner detection when the first engine completes.
 *
 * Spec reference: Section 16.2 (Algorithm Race Mode)
 */

export interface RaceEngine {
	play(): void;
	pause(): void;
	setSpeed(multiplier: number): void;
	destroy(): void;
	isPlaying: boolean;
	totalDuration: number;
	currentTime: number;
	onComplete: (() => void) | null;
}

export class RaceOrchestrator {
	private lanes: Map<string, RaceEngine> = new Map();
	private winnerFound = false;

	/** Called when the first engine completes (winner detected). */
	onRaceComplete: ((winnerId: string) => void) | null = null;

	getLaneCount(): number {
		return this.lanes.size;
	}

	registerLane(laneId: string, engine: RaceEngine): void {
		this.lanes.set(laneId, engine);
	}

	unregisterLane(laneId: string): void {
		this.lanes.delete(laneId);
	}

	startAll(): void {
		this.winnerFound = false;

		for (const [laneId, engine] of this.lanes) {
			engine.onComplete = () => this.handleLaneComplete(laneId);
			engine.play();
		}
	}

	pauseAll(): void {
		for (const engine of this.lanes.values()) {
			engine.pause();
		}
	}

	setLaneSpeed(laneId: string, speed: number): void {
		const engine = this.lanes.get(laneId);
		if (engine) {
			engine.setSpeed(speed);
		}
	}

	resetAll(): void {
		this.winnerFound = false;
	}

	destroy(): void {
		for (const engine of this.lanes.values()) {
			engine.destroy();
		}
		this.lanes.clear();
		this.onRaceComplete = null;
	}

	private handleLaneComplete(laneId: string): void {
		if (this.winnerFound) return;

		this.winnerFound = true;

		// Pause all other engines
		for (const [id, engine] of this.lanes) {
			if (id !== laneId) {
				engine.pause();
			}
		}

		this.onRaceComplete?.(laneId);
	}
}
