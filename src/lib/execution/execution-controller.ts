import type { ExecutionStatus } from '@/types';

export interface StepEventData {
	type: 'step';
	line: number;
	variables: Record<
		string,
		{ name: string; value: unknown; type: string; previousValue: unknown; changed: boolean }
	>;
	callStack: {
		functionName: string;
		lineNumber: number;
		localVariables: Record<string, unknown>;
		returnAddress: number;
	}[];
	stepIndex: number;
}

export interface ErrorEventData {
	type: 'error';
	message: string;
	line: number;
}

export type WorkerMessage =
	| StepEventData
	| { type: 'output'; text: string }
	| ErrorEventData
	| { type: 'complete'; stepCount: number };

export type WorkerCommand =
	| { type: 'run'; code: string }
	| { type: 'step' }
	| { type: 'continue' }
	| { type: 'pause' }
	| { type: 'setBreakpoints'; breakpoints: number[] };

/**
 * Controls the Web Worker execution engine from the main thread.
 *
 * Sends commands (run, step, continue, pause, setBreakpoints) to the Worker
 * and receives events (step, output, error, complete) back.
 *
 * The Worker runs instrumented JavaScript code step-by-step using a
 * generator pattern, yielding StepEvents between each statement.
 */
export class ExecutionController {
	private worker: Worker;
	private _status: ExecutionStatus = 'idle';

	onStep: ((event: StepEventData) => void) | null = null;
	onOutput: ((text: string) => void) | null = null;
	onError: ((error: ErrorEventData) => void) | null = null;
	onComplete: ((stepCount: number) => void) | null = null;

	constructor(worker: Worker) {
		this.worker = worker;
		this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
			this.handleMessage(e.data);
		};
	}

	get status(): ExecutionStatus {
		return this._status;
	}

	run(code: string): void {
		this._status = 'running';
		this.worker.postMessage({ type: 'run', code } satisfies WorkerCommand);
	}

	step(): void {
		this._status = 'stepped';
		this.worker.postMessage({ type: 'step' } satisfies WorkerCommand);
	}

	continue(): void {
		this._status = 'running';
		this.worker.postMessage({ type: 'continue' } satisfies WorkerCommand);
	}

	pause(): void {
		this._status = 'paused';
		this.worker.postMessage({ type: 'pause' } satisfies WorkerCommand);
	}

	setBreakpoints(breakpoints: number[]): void {
		this.worker.postMessage({ type: 'setBreakpoints', breakpoints } satisfies WorkerCommand);
	}

	terminate(): void {
		this._status = 'idle';
		this.worker.terminate();
	}

	private handleMessage(data: WorkerMessage): void {
		switch (data.type) {
			case 'step':
				this._status = 'stepped';
				this.onStep?.(data);
				break;
			case 'output':
				this.onOutput?.(data.text);
				break;
			case 'error':
				this._status = 'error';
				this.onError?.(data);
				break;
			case 'complete':
				this._status = 'complete';
				this.onComplete?.(data.stepCount);
				break;
		}
	}
}
