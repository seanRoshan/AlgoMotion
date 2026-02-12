import type { JsonValue } from './common';

/**
 * Status of the code execution engine.
 *
 * Spec reference: Section 6.5
 */
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'stepped' | 'complete' | 'error';

/**
 * Actions emitted by the execution engine per step.
 */
export type StepAction =
	| 'variableChange'
	| 'functionCall'
	| 'functionReturn'
	| 'lineAdvance'
	| 'breakpointHit'
	| 'output'
	| 'error';

/**
 * Snapshot of a single variable at a point in execution.
 *
 * Spec reference: Section 6.5
 */
export interface VariableSnapshot {
	name: string;
	value: JsonValue;
	type: string;
	previousValue: JsonValue;
	/** Whether this variable changed in the current step */
	changed: boolean;
}

/**
 * Enhanced breakpoint with conditional support, hit counts, and enable/disable.
 *
 * Spec reference: Section 6.5
 */
export interface Breakpoint {
	id: string;
	line: number;
	enabled: boolean;
	condition?: string;
	hitCount: number;
}

/**
 * A heap-allocated object tracked by the execution engine.
 */
export interface HeapObject {
	id: string;
	type: string;
	value: JsonValue;
	/** Element IDs referencing this heap object on the canvas */
	referencedBy: string[];
}

/**
 * A single frame in the call stack.
 *
 * Spec reference: Section 6.5
 */
export interface StackFrame {
	functionName: string;
	lineNumber: number;
	localVariables: Record<string, JsonValue>;
	returnAddress: number;
}

/**
 * Event emitted by the execution engine after each step.
 * The main thread maps each StepEvent to a timeline position
 * and triggers the corresponding canvas animation.
 *
 * Spec reference: Section 6.5
 */
export interface StepEvent {
	stepIndex: number;
	line: number;
	action: StepAction;
	/** Animation sequence ID to trigger for this step */
	animationSequenceId?: string;
	variables: Record<string, VariableSnapshot>;
	callStack: StackFrame[];
	output?: string;
}

/**
 * Full execution state for the execution store.
 * Uses Record<> for Zustand serialization (NOT Map<>).
 *
 * Spec reference: Section 6.5
 */
export interface ExecutionState {
	currentLine: number;
	/** Lines already executed, used for dimmed highlighting */
	visitedLines: number[];
	/** The line that will execute next (0 = unknown) */
	nextLine: number;
	callStack: StackFrame[];
	variables: Record<string, VariableSnapshot>;
	heap: Record<string, HeapObject>;
	output: string[];
	status: ExecutionStatus;
	stepCount: number;
	/** Maps execution step → timeline position in seconds */
	animationTime: number;
	/** Maps code line numbers to canvas element IDs for annotations */
	lineAnnotations: Record<number, string>;
}
