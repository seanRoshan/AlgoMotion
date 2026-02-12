import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
	Breakpoint,
	ExecutionState,
	ExecutionStatus,
	StackFrame,
	VariableSnapshot,
} from '@/types';

export interface ExecutionStoreState {
	executionState: ExecutionState;
	breakpoints: Record<string, Breakpoint>;
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
	addBreakpoint: (line: number) => void;
	removeBreakpoint: (line: number) => void;
	toggleBreakpoint: (line: number) => void;
	enableBreakpoint: (line: number) => void;
	disableBreakpoint: (line: number) => void;
	setBreakpointCondition: (line: number, condition: string | undefined) => void;
	incrementBreakpointHitCount: (line: number) => void;
	clearAllBreakpoints: () => void;
	getBreakpointLines: () => number[];
	setSourceCode: (code: string) => void;
	setLineAnnotation: (line: number, elementId: string) => void;
	removeLineAnnotation: (line: number) => void;
	clearLineAnnotations: () => void;
	reset: () => void;
}

export type ExecutionStore = ExecutionStoreState & ExecutionActions;

function breakpointId(line: number): string {
	return `line:${line}`;
}

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
	breakpoints: {},
	sourceCode: '',
};

export const useExecutionStore = create<ExecutionStore>()(
	devtools(
		immer((set, get) => ({
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

			addBreakpoint: (line) =>
				set((state) => {
					const id = breakpointId(line);
					if (!state.breakpoints[id]) {
						state.breakpoints[id] = {
							id,
							line,
							enabled: true,
							hitCount: 0,
						};
					}
				}),

			removeBreakpoint: (line) =>
				set((state) => {
					delete state.breakpoints[breakpointId(line)];
				}),

			toggleBreakpoint: (line) =>
				set((state) => {
					const id = breakpointId(line);
					if (state.breakpoints[id]) {
						delete state.breakpoints[id];
					} else {
						state.breakpoints[id] = {
							id,
							line,
							enabled: true,
							hitCount: 0,
						};
					}
				}),

			enableBreakpoint: (line) =>
				set((state) => {
					const bp = state.breakpoints[breakpointId(line)];
					if (bp) bp.enabled = true;
				}),

			disableBreakpoint: (line) =>
				set((state) => {
					const bp = state.breakpoints[breakpointId(line)];
					if (bp) bp.enabled = false;
				}),

			setBreakpointCondition: (line, condition) =>
				set((state) => {
					const bp = state.breakpoints[breakpointId(line)];
					if (bp) bp.condition = condition;
				}),

			incrementBreakpointHitCount: (line) =>
				set((state) => {
					const bp = state.breakpoints[breakpointId(line)];
					if (bp) bp.hitCount += 1;
				}),

			clearAllBreakpoints: () =>
				set((state) => {
					state.breakpoints = {};
				}),

			getBreakpointLines: () => {
				const bps = get().breakpoints;
				return Object.values(bps)
					.filter((bp) => bp.enabled)
					.map((bp) => bp.line);
			},

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
