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
			expect(useExecutionStore.getState().breakpoints).toEqual({});
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
		it('adds a breakpoint with correct defaults', () => {
			useExecutionStore.getState().addBreakpoint(10);
			const bp = useExecutionStore.getState().breakpoints['line:10'];
			expect(bp).toBeDefined();
			expect(bp?.line).toBe(10);
			expect(bp?.enabled).toBe(true);
			expect(bp?.hitCount).toBe(0);
			expect(bp?.condition).toBeUndefined();
		});

		it('does not duplicate breakpoints on same line', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().addBreakpoint(10);
			expect(Object.keys(useExecutionStore.getState().breakpoints)).toHaveLength(1);
		});

		it('removes a breakpoint', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().removeBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints['line:10']).toBeUndefined();
		});

		it('toggles breakpoint on/off', () => {
			useExecutionStore.getState().toggleBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints['line:10']).toBeDefined();

			useExecutionStore.getState().toggleBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints['line:10']).toBeUndefined();
		});

		it('enables a disabled breakpoint', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().disableBreakpoint(10);
			useExecutionStore.getState().enableBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints['line:10']?.enabled).toBe(true);
		});

		it('disables an enabled breakpoint', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().disableBreakpoint(10);
			expect(useExecutionStore.getState().breakpoints['line:10']?.enabled).toBe(false);
		});

		it('sets a condition on a breakpoint', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().setBreakpointCondition(10, 'i > 5');
			expect(useExecutionStore.getState().breakpoints['line:10']?.condition).toBe('i > 5');
		});

		it('clears a condition on a breakpoint', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().setBreakpointCondition(10, 'i > 5');
			useExecutionStore.getState().setBreakpointCondition(10, undefined);
			expect(useExecutionStore.getState().breakpoints['line:10']?.condition).toBeUndefined();
		});

		it('increments hit count', () => {
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().incrementBreakpointHitCount(10);
			useExecutionStore.getState().incrementBreakpointHitCount(10);
			expect(useExecutionStore.getState().breakpoints['line:10']?.hitCount).toBe(2);
		});

		it('clears all breakpoints', () => {
			useExecutionStore.getState().addBreakpoint(5);
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().addBreakpoint(15);
			useExecutionStore.getState().clearAllBreakpoints();
			expect(useExecutionStore.getState().breakpoints).toEqual({});
		});

		it('getBreakpointLines returns enabled line numbers', () => {
			useExecutionStore.getState().addBreakpoint(5);
			useExecutionStore.getState().addBreakpoint(10);
			useExecutionStore.getState().addBreakpoint(15);
			useExecutionStore.getState().disableBreakpoint(10);
			const lines = useExecutionStore.getState().getBreakpointLines();
			expect(lines).toEqual([5, 15]);
		});
	});

	describe('source code', () => {
		it('sets source code', () => {
			useExecutionStore.getState().setSourceCode('const x = 5;');
			expect(useExecutionStore.getState().sourceCode).toBe('const x = 5;');
		});
	});

	describe('visited lines', () => {
		it('starts with empty visited lines', () => {
			expect(useExecutionStore.getState().executionState.visitedLines).toEqual([]);
		});

		it('adds a visited line', () => {
			useExecutionStore.getState().addVisitedLine(5);
			expect(useExecutionStore.getState().executionState.visitedLines).toContain(5);
		});

		it('does not duplicate visited lines', () => {
			useExecutionStore.getState().addVisitedLine(5);
			useExecutionStore.getState().addVisitedLine(5);
			expect(useExecutionStore.getState().executionState.visitedLines).toEqual([5]);
		});

		it('accumulates multiple visited lines', () => {
			useExecutionStore.getState().addVisitedLine(1);
			useExecutionStore.getState().addVisitedLine(3);
			useExecutionStore.getState().addVisitedLine(5);
			expect(useExecutionStore.getState().executionState.visitedLines).toEqual([1, 3, 5]);
		});

		it('clears visited lines', () => {
			useExecutionStore.getState().addVisitedLine(1);
			useExecutionStore.getState().addVisitedLine(3);
			useExecutionStore.getState().clearVisitedLines();
			expect(useExecutionStore.getState().executionState.visitedLines).toEqual([]);
		});
	});

	describe('next line', () => {
		it('starts with nextLine 0', () => {
			expect(useExecutionStore.getState().executionState.nextLine).toBe(0);
		});

		it('sets the next line', () => {
			useExecutionStore.getState().setNextLine(10);
			expect(useExecutionStore.getState().executionState.nextLine).toBe(10);
		});
	});

	describe('line annotations', () => {
		it('starts with empty line annotations', () => {
			expect(useExecutionStore.getState().executionState.lineAnnotations).toEqual({});
		});

		it('sets a line annotation linking a code line to a canvas element', () => {
			useExecutionStore.getState().setLineAnnotation(5, 'element-abc');
			expect(useExecutionStore.getState().executionState.lineAnnotations[5]).toBe('element-abc');
		});

		it('removes a line annotation', () => {
			useExecutionStore.getState().setLineAnnotation(5, 'element-abc');
			useExecutionStore.getState().removeLineAnnotation(5);
			expect(useExecutionStore.getState().executionState.lineAnnotations[5]).toBeUndefined();
		});

		it('clears all line annotations', () => {
			useExecutionStore.getState().setLineAnnotation(5, 'el-1');
			useExecutionStore.getState().setLineAnnotation(10, 'el-2');
			useExecutionStore.getState().clearLineAnnotations();
			expect(useExecutionStore.getState().executionState.lineAnnotations).toEqual({});
		});
	});

	describe('serialization', () => {
		it('state contains no Map or Set', () => {
			useExecutionStore.getState().setVariables({
				x: { name: 'x', value: 5, type: 'number', previousValue: 0, changed: true },
			});
			useExecutionStore.getState().addBreakpoint(10);

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
