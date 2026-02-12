import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StackFrame } from '@/types';
import { useExecutionStore } from './execution-store';

describe('executionStore', () => {
	beforeEach(() => {
		useExecutionStore.getState().reset();
	});

	afterEach(() => {
		useExecutionStore.getState().reset();
	});

	describe('initial state', () => {
		it('starts with idle status', () => {
			expect(useExecutionStore.getState().executionState.status).toBe('idle');
		});

		it('starts at line 0', () => {
			expect(useExecutionStore.getState().executionState.currentLine).toBe(0);
		});

		it('starts with empty call stack', () => {
			expect(useExecutionStore.getState().executionState.callStack).toEqual([]);
		});

		it('starts with empty breakpoints', () => {
			expect(useExecutionStore.getState().breakpoints).toEqual([]);
		});

		it('starts with empty source code', () => {
			expect(useExecutionStore.getState().sourceCode).toBe('');
		});
	});

	describe('status', () => {
		it('sets execution status', () => {
			useExecutionStore.getState().setStatus('running');
			expect(useExecutionStore.getState().executionState.status).toBe('running');
		});

		it('transitions through status lifecycle', () => {
			useExecutionStore.getState().setStatus('running');
			useExecutionStore.getState().setStatus('paused');
			useExecutionStore.getState().setStatus('stepped');
			useExecutionStore.getState().setStatus('complete');

			expect(useExecutionStore.getState().executionState.status).toBe('complete');
		});
	});

	describe('line tracking', () => {
		it('sets current line', () => {
			useExecutionStore.getState().setCurrentLine(42);
			expect(useExecutionStore.getState().executionState.currentLine).toBe(42);
		});
	});

	describe('variables', () => {
		it('sets variables', () => {
			useExecutionStore.getState().setVariables({
				x: { name: 'x', value: 5, type: 'number', previousValue: 0, changed: true },
			});

			const vars = useExecutionStore.getState().executionState.variables;
			expect(vars.x?.value).toBe(5);
			expect(vars.x?.changed).toBe(true);
		});
	});

	describe('call stack', () => {
		it('pushes a frame onto the call stack', () => {
			const frame: StackFrame = {
				functionName: 'bubbleSort',
				lineNumber: 10,
				localVariables: { i: 0, j: 1 },
				returnAddress: 5,
			};
			useExecutionStore.getState().pushCallStack(frame);

			expect(useExecutionStore.getState().executionState.callStack).toHaveLength(1);
			expect(useExecutionStore.getState().executionState.callStack[0]?.functionName).toBe(
				'bubbleSort',
			);
		});

		it('pops a frame from the call stack', () => {
			const frame: StackFrame = {
				functionName: 'main',
				lineNumber: 1,
				localVariables: {},
				returnAddress: 0,
			};
			useExecutionStore.getState().pushCallStack(frame);
			useExecutionStore.getState().popCallStack();

			expect(useExecutionStore.getState().executionState.callStack).toHaveLength(0);
		});

		it('sets the entire call stack', () => {
			const stack: StackFrame[] = [
				{ functionName: 'main', lineNumber: 1, localVariables: {}, returnAddress: 0 },
				{ functionName: 'sort', lineNumber: 10, localVariables: {}, returnAddress: 5 },
			];
			useExecutionStore.getState().setCallStack(stack);

			expect(useExecutionStore.getState().executionState.callStack).toHaveLength(2);
		});
	});

	describe('output', () => {
		it('appends output', () => {
			useExecutionStore.getState().appendOutput('Hello');
			useExecutionStore.getState().appendOutput('World');

			expect(useExecutionStore.getState().executionState.output).toEqual(['Hello', 'World']);
		});

		it('clears output', () => {
			useExecutionStore.getState().appendOutput('test');
			useExecutionStore.getState().clearOutput();

			expect(useExecutionStore.getState().executionState.output).toEqual([]);
		});
	});

	describe('step counter', () => {
		it('increments step count', () => {
			useExecutionStore.getState().incrementStep();
			useExecutionStore.getState().incrementStep();

			expect(useExecutionStore.getState().executionState.stepCount).toBe(2);
		});
	});

	describe('breakpoints', () => {
		it('sets a breakpoint', () => {
			useExecutionStore.getState().setBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints).toContain(10);
		});

		it('does not duplicate breakpoints', () => {
			useExecutionStore.getState().setBreakpoint(10);
			useExecutionStore.getState().setBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints).toEqual([10]);
		});

		it('removes a breakpoint', () => {
			useExecutionStore.getState().setBreakpoint(10);
			useExecutionStore.getState().removeBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints).not.toContain(10);
		});

		it('toggles breakpoint on/off', () => {
			useExecutionStore.getState().toggleBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints).toContain(10);

			useExecutionStore.getState().toggleBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints).not.toContain(10);
		});
	});

	describe('source code', () => {
		it('sets source code', () => {
			useExecutionStore.getState().setSourceCode('const x = 5;');
			expect(useExecutionStore.getState().sourceCode).toBe('const x = 5;');
		});
	});

	describe('serialization', () => {
		it('state contains no Map or Set', () => {
			useExecutionStore.getState().setVariables({
				x: { name: 'x', value: 5, type: 'number', previousValue: 0, changed: true },
			});
			useExecutionStore.getState().setBreakpoint(10);

			const state = useExecutionStore.getState();
			const json = JSON.stringify({
				executionState: state.executionState,
				breakpoints: state.breakpoints,
				sourceCode: state.sourceCode,
			});

			expect(() => JSON.parse(json)).not.toThrow();
		});
	});
});
