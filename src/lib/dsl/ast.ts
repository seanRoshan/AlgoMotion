/**
 * AST node types for the AlgoMotion Animation DSL.
 *
 * The parser (Peggy.js) produces these nodes, and the compiler
 * walks them to generate an AnimationSequence (keyframes + markers).
 *
 * Spec reference: Section 6.6 (Animation DSL)
 */

// ── Root ──

export interface DslProgram {
	type: 'Program';
	scenes: SceneBlock[];
}

// ── Scene ──

export interface SceneBlock {
	type: 'SceneBlock';
	name: string;
	body: Statement[];
}

// ── Statements ──

export type Statement =
	| ElementDeclaration
	| VariableDeclaration
	| Assignment
	| ForLoop
	| WhileLoop
	| IfStatement
	| AnimationCommand
	| ParallelBlock
	| CameraCommand
	| AudioCommand
	| WaitCommand;

export interface ElementDeclaration {
	type: 'ElementDeclaration';
	elementType: DslElementType;
	name: string;
	value: Expression;
	position?: { x: Expression; y: Expression };
}

export type DslElementType =
	| 'array'
	| 'tree'
	| 'graph'
	| 'node'
	| 'stack'
	| 'queue'
	| 'linkedList'
	| 'matrix'
	| 'hashTable';

export interface VariableDeclaration {
	type: 'VariableDeclaration';
	name: string;
	value: Expression;
}

export interface Assignment {
	type: 'Assignment';
	target: Expression;
	value: Expression;
}

export interface ForLoop {
	type: 'ForLoop';
	variable: string;
	start: Expression;
	end: Expression;
	body: Statement[];
}

export interface WhileLoop {
	type: 'WhileLoop';
	condition: Expression;
	body: Statement[];
}

export interface IfStatement {
	type: 'IfStatement';
	condition: Expression;
	consequent: Statement[];
	alternate?: Statement[];
}

// ── Animation Commands ──

export type AnimationCommandName =
	| 'highlight'
	| 'unhighlight'
	| 'swap'
	| 'move'
	| 'insert'
	| 'delete'
	| 'mark'
	| 'connect'
	| 'disconnect'
	| 'label'
	| 'annotate'
	| 'pause'
	| 'wait';

export interface AnimationCommand {
	type: 'AnimationCommand';
	command: AnimationCommandName;
	targets: Expression[];
	options: CommandOption[];
}

export interface CommandOption {
	type: 'CommandOption';
	name: CommandOptionName;
	value: Expression;
}

export type CommandOptionName = 'color' | 'duration' | 'easing' | 'delay' | 'stagger' | 'label';

// ── Parallel Block ──

export interface ParallelBlock {
	type: 'ParallelBlock';
	body: Statement[];
}

// ── Camera Commands ──

export type CameraCommandName = 'zoom' | 'pan' | 'focus';

export interface CameraCommand {
	type: 'CameraCommand';
	command: CameraCommandName;
	args: Expression[];
	options: CommandOption[];
}

// ── Audio Cue ──

export type AudioCue = 'beep' | 'click' | 'success' | 'error';

export interface AudioCommand {
	type: 'AudioCommand';
	sound: AudioCue;
}

// ── Wait ──

export interface WaitCommand {
	type: 'WaitCommand';
	duration: Expression;
}

// ── Expressions ──

export type Expression =
	| NumberLiteral
	| StringLiteral
	| BooleanLiteral
	| ArrayLiteral
	| ObjectLiteral
	| Identifier
	| MemberExpression
	| IndexExpression
	| BinaryExpression
	| UnaryExpression
	| DurationLiteral;

export interface NumberLiteral {
	type: 'NumberLiteral';
	value: number;
}

export interface StringLiteral {
	type: 'StringLiteral';
	value: string;
}

export interface BooleanLiteral {
	type: 'BooleanLiteral';
	value: boolean;
}

export interface ArrayLiteral {
	type: 'ArrayLiteral';
	elements: Expression[];
}

export interface ObjectLiteral {
	type: 'ObjectLiteral';
	properties: ObjectProperty[];
}

export interface ObjectProperty {
	type: 'ObjectProperty';
	key: string;
	value: Expression;
}

export interface Identifier {
	type: 'Identifier';
	name: string;
}

export interface MemberExpression {
	type: 'MemberExpression';
	object: Expression;
	property: string;
}

export interface IndexExpression {
	type: 'IndexExpression';
	object: Expression;
	index: Expression;
}

export type BinaryOperator =
	| '+'
	| '-'
	| '*'
	| '/'
	| '%'
	| '=='
	| '!='
	| '<'
	| '>'
	| '<='
	| '>='
	| '&&'
	| '||';

export interface BinaryExpression {
	type: 'BinaryExpression';
	operator: BinaryOperator;
	left: Expression;
	right: Expression;
}

export interface UnaryExpression {
	type: 'UnaryExpression';
	operator: '-' | '!';
	operand: Expression;
}

export interface DurationLiteral {
	type: 'DurationLiteral';
	value: number;
	unit: 's' | 'ms';
}

// ── Union of all AST nodes ──

export type AstNode =
	| DslProgram
	| SceneBlock
	| Statement
	| Expression
	| CommandOption
	| ObjectProperty;

// ── Source Location (attached by parser for error reporting) ──

export interface SourceLocation {
	start: { line: number; column: number; offset: number };
	end: { line: number; column: number; offset: number };
}
