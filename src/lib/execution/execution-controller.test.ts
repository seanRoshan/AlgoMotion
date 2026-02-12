import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionController } from './execution-controller';

// Mock Worker since Vitest doesn't support real Web Workers
class MockWorker {
	onmessage: ((e: MessageEvent) => void) | null = null;
	postMessage = vi.fn();
	terminate = vi.fn();

	// Simulate worker sending a message back
	simulateMessage(data: unknown) {
		this.onmessage?.({ data } as MessageEvent);
	}
}

describe('ExecutionController', () => {
	let controller: ExecutionController;
	let mockWorker: MockWorker;

	beforeEach(() => {
		mockWorker = new MockWorker();
		controller = new ExecutionController(mockWorker as unknown as Worker);
	});

	afterEach(() => {
		controller.terminate();
	});

	it('sends run command with code to worker', () => {
		controller.run('let x = 5;');

		expect(mockWorker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'run',
				code: 'let x = 5;',
			}),
		);
	});

	it('sends step command to worker', () => {
		controller.run('let x = 5;');
		controller.step();

		expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'step' }));
	});

	it('sends continue command to worker', () => {
		controller.run('let x = 5;');
		controller.continue();

		expect(mockWorker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'continue' }),
		);
	});

	it('sends pause command to worker', () => {
		controller.run('let x = 5;');
		controller.pause();

		expect(mockWorker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'pause' }));
	});

	it('sends setBreakpoints command to worker', () => {
		controller.setBreakpoints([3, 7, 12]);

		expect(mockWorker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'setBreakpoints',
				breakpoints: [3, 7, 12],
			}),
		);
	});

	it('calls onStep callback when worker sends step event', () => {
		const onStep = vi.fn();
		controller.onStep = onStep;

		mockWorker.simulateMessage({
			type: 'step',
			line: 1,
			variables: {
				x: { name: 'x', value: 5, type: 'number', previousValue: undefined, changed: true },
			},
			callStack: [],
			stepIndex: 0,
		});

		expect(onStep).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'step',
				line: 1,
			}),
		);
	});

	it('calls onOutput callback when worker sends output event', () => {
		const onOutput = vi.fn();
		controller.onOutput = onOutput;

		mockWorker.simulateMessage({
			type: 'output',
			text: 'hello world',
		});

		expect(onOutput).toHaveBeenCalledWith('hello world');
	});

	it('calls onError callback when worker sends error event', () => {
		const onError = vi.fn();
		controller.onError = onError;

		mockWorker.simulateMessage({
			type: 'error',
			message: 'ReferenceError: foo is not defined',
			line: 3,
		});

		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'ReferenceError: foo is not defined',
				line: 3,
			}),
		);
	});

	it('calls onComplete callback when worker sends complete event', () => {
		const onComplete = vi.fn();
		controller.onComplete = onComplete;

		mockWorker.simulateMessage({
			type: 'complete',
			stepCount: 5,
		});

		expect(onComplete).toHaveBeenCalledWith(5);
	});

	it('terminates the worker', () => {
		controller.terminate();

		expect(mockWorker.terminate).toHaveBeenCalled();
	});

	it('reports running status after run command', () => {
		controller.run('let x = 5;');

		expect(controller.status).toBe('running');
	});

	it('resets status to idle after terminate', () => {
		controller.run('let x = 5;');
		controller.terminate();

		expect(controller.status).toBe('idle');
	});
});
