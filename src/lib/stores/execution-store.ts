import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ExecutionState, ExecutionStatus, StackFrame, VariableSnapshot } from '@/types';

export interface ExecutionStoreState {
	executionState: ExecutionState;
	breakpoints: number[];
	sourceCode: string;
}

export interface ExecutionActions {
	setStatus: (status: ExecutionStatus) => void;
	setCurrentLine: (line: number) => void;
	addVisitedLine: (line: number) => void;
	clearVisitedLines: () => void;
	setNextLine: (line: number) => void;
	setVariables: (variables: Record<string, VariableSnapshot>) => void;
	pushCallStack: (frame: StackFrame) => void;
	popCallStack: () => void;
	setCallStack: (stack: StackFrame[]) => void;
	appendOutput: (text: string) => void;
	clearOutput: () => void;
	incrementStep: () => void;
	setAnimationTime: (time: number) => void;
	setBreakpoint: (line: number) => void;
	removeBreakpoint: (line: number) => void;
	toggleBreakpoint: (line: number) => void;
	setSourceCode: (code: string) => void;
	setLineAnnotation: (line: number, elementId: string) => void;
	removeLineAnnotation: (line: number) => void;
	clearLineAnnotations: () => void;
	reset: () => void;
}

export type ExecutionStore = ExecutionStoreState & ExecutionActions;

const initialExecutionState: ExecutionState = {
	currentLine: 0,
	visitedLines: [],
	nextLine: 0,
	callStack: [],
	variables: {},
	heap: {},
	output: [],
	status: 'idle',
	stepCount: 0,
	animationTime: 0,
	lineAnnotations: {},
};

const initialState: ExecutionStoreState = {
	executionState: { ...initialExecutionState },
	breakpoints: [],
	sourceCode: '',
};

export const useExecutionStore = create<ExecutionStore>()(
	devtools(
		immer((set) => ({
			...initialState,

			setStatus: (status) =>
				set((state) => {
					state.executionState.status = status;
				}),

			setCurrentLine: (line) =>
				set((state) => {
					state.executionState.currentLine = line;
				}),

			addVisitedLine: (line) =>
				set((state) => {
					if (!state.executionState.visitedLines.includes(line)) {
						state.executionState.visitedLines.push(line);
					}
				}),

			clearVisitedLines: () =>
				set((state) => {
					state.executionState.visitedLines = [];
				}),

			setNextLine: (line) =>
				set((state) => {
					state.executionState.nextLine = line;
				}),

			setVariables: (variables) =>
				set((state) => {
					state.executionState.variables = variables;
				}),

			pushCallStack: (frame) =>
				set((state) => {
					state.executionState.callStack.push(frame);
				}),

			popCallStack: () =>
				set((state) => {
					state.executionState.callStack.pop();
				}),

			setCallStack: (stack) =>
				set((state) => {
					state.executionState.callStack = stack;
				}),

			appendOutput: (text) =>
				set((state) => {
					state.executionState.output.push(text);
				}),

			clearOutput: () =>
				set((state) => {
					state.executionState.output = [];
				}),

			incrementStep: () =>
				set((state) => {
					state.executionState.stepCount += 1;
				}),

			setAnimationTime: (time) =>
				set((state) => {
					state.executionState.animationTime = time;
				}),

			setBreakpoint: (line) =>
				set((state) => {
					if (!state.breakpoints.includes(line)) {
						state.breakpoints.push(line);
					}
				}),

			removeBreakpoint: (line) =>
				set((state) => {
					state.breakpoints = state.breakpoints.filter((bp) => bp !== line);
				}),

			toggleBreakpoint: (line) =>
				set((state) => {
					const idx = state.breakpoints.indexOf(line);
					if (idx >= 0) {
						state.breakpoints.splice(idx, 1);
					} else {
						state.breakpoints.push(line);
					}
				}),

			setSourceCode: (code) =>
				set((state) => {
					state.sourceCode = code;
				}),

			setLineAnnotation: (line, elementId) =>
				set((state) => {
					state.executionState.lineAnnotations[line] = elementId;
				}),

			removeLineAnnotation: (line) =>
				set((state) => {
					delete state.executionState.lineAnnotations[line];
				}),

			clearLineAnnotations: () =>
				set((state) => {
					state.executionState.lineAnnotations = {};
				}),

			reset: () => set(initialState),
		})),
		{ name: 'ExecutionStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
