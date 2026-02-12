/**
 * DSL Compiler — walks the AST and produces AnimationSequence data.
 *
 * The compiler evaluates expressions, tracks variables in scope,
 * and generates keyframes/markers for each animation command.
 * Control flow (for, while, if) is evaluated statically to unroll
 * loops and resolve conditions.
 *
 * Spec reference: Section 6.6 (Animation DSL)
 */

import type { AnimationSequence, Keyframe, TimelineMarker } from '@/types';
import type {
	AnimationCommand,
	AudioCommand,
	BinaryExpression,
	CameraCommand,
	CommandOption,
	DslProgram,
	ElementDeclaration,
	Expression,
	ForLoop,
	IfStatement,
	ParallelBlock,
	SceneBlock,
	Statement,
	UnaryExpression,
	VariableDeclaration,
	WaitCommand,
	WhileLoop,
} from './ast';

// ── Compiler Types ──

export interface CompileResult {
	scenes: CompiledScene[];
}

export interface CompiledScene {
	name: string;
	elements: CompiledElement[];
	sequence: AnimationSequence;
}

export interface CompiledElement {
	id: string;
	elementType: string;
	name: string;
	value: unknown;
	position?: { x: number; y: number };
}

export interface CompileError {
	message: string;
	line?: number;
	column?: number;
}

// ── Scope (variable environment) ──

type ScopeValue = number | string | boolean | unknown[] | Record<string, unknown> | null;

class Scope {
	private vars: Record<string, ScopeValue> = {};
	private parent: Scope | null;

	constructor(parent?: Scope) {
		this.parent = parent ?? null;
	}

	get(name: string): ScopeValue {
		if (name in this.vars) return this.vars[name];
		if (this.parent) return this.parent.get(name);
		return null;
	}

	set(name: string, value: ScopeValue): void {
		this.vars[name] = value;
	}

	child(): Scope {
		return new Scope(this);
	}
}

// ── Compiler ──

let nextId = 0;
function genId(prefix: string): string {
	return `${prefix}-${nextId++}`;
}

/**
 * Compile a DSL program AST into a CompileResult.
 */
export function compileDsl(program: DslProgram): CompileResult {
	nextId = 0;
	const scenes = program.scenes.map(compileScene);
	return { scenes };
}

function compileScene(scene: SceneBlock): CompiledScene {
	const scope = new Scope();
	const elements: CompiledElement[] = [];
	const keyframes: Keyframe[] = [];
	const markers: TimelineMarker[] = [];
	const ctx: CompileContext = { scope, elements, keyframes, markers, time: 0 };

	compileStatements(scene.body, ctx);

	const duration = ctx.time;
	const sequence: AnimationSequence = {
		id: genId('seq'),
		name: scene.name,
		duration,
		keyframes,
		markers,
	};

	return { name: scene.name, elements, sequence };
}

interface CompileContext {
	scope: Scope;
	elements: CompiledElement[];
	keyframes: Keyframe[];
	markers: TimelineMarker[];
	time: number;
}

function compileStatements(stmts: Statement[], ctx: CompileContext): void {
	for (const stmt of stmts) {
		compileStatement(stmt, ctx);
	}
}

function compileStatement(stmt: Statement, ctx: CompileContext): void {
	switch (stmt.type) {
		case 'ElementDeclaration':
			compileElementDecl(stmt, ctx);
			break;
		case 'VariableDeclaration':
			compileVarDecl(stmt, ctx);
			break;
		case 'Assignment':
			compileAssignment(stmt, ctx);
			break;
		case 'ForLoop':
			compileForLoop(stmt, ctx);
			break;
		case 'WhileLoop':
			compileWhileLoop(stmt, ctx);
			break;
		case 'IfStatement':
			compileIfStmt(stmt, ctx);
			break;
		case 'AnimationCommand':
			compileAnimCmd(stmt, ctx);
			break;
		case 'ParallelBlock':
			compileParallel(stmt, ctx);
			break;
		case 'CameraCommand':
			compileCameraCmd(stmt, ctx);
			break;
		case 'AudioCommand':
			compileAudioCmd(stmt, ctx);
			break;
		case 'WaitCommand':
			compileWaitCmd(stmt, ctx);
			break;
	}
}

// ── Element Declaration ──

function compileElementDecl(decl: ElementDeclaration, ctx: CompileContext): void {
	const value = evalExpr(decl.value, ctx.scope);
	const pos = decl.position
		? {
				x: Number(evalExpr(decl.position.x, ctx.scope)),
				y: Number(evalExpr(decl.position.y, ctx.scope)),
			}
		: undefined;

	const elem: CompiledElement = {
		id: genId(decl.elementType),
		elementType: decl.elementType,
		name: decl.name,
		value,
		position: pos,
	};

	ctx.elements.push(elem);
	ctx.scope.set(decl.name, value as ScopeValue);
}

// ── Variable Declaration ──

function compileVarDecl(decl: VariableDeclaration, ctx: CompileContext): void {
	const value = evalExpr(decl.value, ctx.scope);
	ctx.scope.set(decl.name, value as ScopeValue);
}

// ── Assignment ──

function compileAssignment(
	stmt: { target: Expression; value: Expression },
	ctx: CompileContext,
): void {
	const value = evalExpr(stmt.value, ctx.scope);

	if (stmt.target.type === 'Identifier') {
		ctx.scope.set(stmt.target.name, value as ScopeValue);
	}
	// Index and member assignments update the underlying object in scope
}

// ── Control Flow ──

function compileForLoop(loop: ForLoop, ctx: CompileContext): void {
	const start = Number(evalExpr(loop.start, ctx.scope));
	const end = Number(evalExpr(loop.end, ctx.scope));
	const childScope = ctx.scope.child();
	const childCtx = { ...ctx, scope: childScope };

	for (let i = start; i < end; i++) {
		childScope.set(loop.variable, i);
		compileStatements(loop.body, childCtx);
	}

	ctx.time = childCtx.time;
}

function compileWhileLoop(loop: WhileLoop, ctx: CompileContext): void {
	const childScope = ctx.scope.child();
	const childCtx = { ...ctx, scope: childScope };
	const maxIter = 1000; // Safety limit
	let iter = 0;

	while (iter < maxIter) {
		const cond = evalExpr(loop.condition, childCtx.scope);
		if (!cond) break;
		compileStatements(loop.body, childCtx);
		iter++;
	}

	ctx.time = childCtx.time;
}

function compileIfStmt(stmt: IfStatement, ctx: CompileContext): void {
	const cond = evalExpr(stmt.condition, ctx.scope);
	if (cond) {
		compileStatements(stmt.consequent, ctx);
	} else if (stmt.alternate) {
		compileStatements(stmt.alternate, ctx);
	}
}

// ── Animation Commands ──

const DEFAULT_DURATION = 0.3;

function getOptionValue(options: CommandOption[], name: string, scope: Scope): ScopeValue {
	const opt = options.find((o) => o.name === name);
	if (!opt) return null;
	return evalExpr(opt.value, scope) as ScopeValue;
}

function compileAnimCmd(cmd: AnimationCommand, ctx: CompileContext): void {
	const duration =
		(getOptionValue(cmd.options, 'duration', ctx.scope) as number) ?? DEFAULT_DURATION;
	const delay = (getOptionValue(cmd.options, 'delay', ctx.scope) as number) ?? 0;
	const easing = (getOptionValue(cmd.options, 'easing', ctx.scope) as string) ?? 'power1.inOut';
	const color = (getOptionValue(cmd.options, 'color', ctx.scope) as string) ?? undefined;

	const startTime = ctx.time + delay;

	// Generate keyframes based on command type
	for (const target of cmd.targets) {
		const targetId = resolveTargetId(target, ctx.scope);

		switch (cmd.command) {
			case 'highlight':
				if (color) {
					ctx.keyframes.push({
						id: genId('kf'),
						elementId: targetId,
						time: startTime,
						property: 'style.fill',
						value: color,
						easing,
						duration,
					});
				}
				ctx.keyframes.push({
					id: genId('kf'),
					elementId: targetId,
					time: startTime,
					property: 'opacity',
					value: 1,
					easing,
					duration: duration * 0.5,
				});
				break;

			case 'unhighlight':
				ctx.keyframes.push({
					id: genId('kf'),
					elementId: targetId,
					time: startTime,
					property: 'style.fill',
					value: '#2a2a4a',
					easing,
					duration,
				});
				break;

			case 'swap':
				// Swap generates paired position keyframes
				if (cmd.targets.length >= 2) {
					const targetId2 = resolveTargetId(cmd.targets[1], ctx.scope);
					ctx.keyframes.push({
						id: genId('kf'),
						elementId: targetId,
						time: startTime,
						property: 'position.x',
						value: 0, // placeholder — actual positions resolved at runtime
						easing,
						duration,
					});
					ctx.keyframes.push({
						id: genId('kf'),
						elementId: targetId2,
						time: startTime,
						property: 'position.x',
						value: 0,
						easing,
						duration,
					});
				}
				break;

			case 'move':
				ctx.keyframes.push({
					id: genId('kf'),
					elementId: targetId,
					time: startTime,
					property: 'position.x',
					value: 0,
					easing,
					duration,
				});
				break;

			case 'mark':
				if (color) {
					ctx.keyframes.push({
						id: genId('kf'),
						elementId: targetId,
						time: startTime,
						property: 'style.fill',
						value: color,
						easing,
						duration,
					});
				}
				break;

			default:
				// For other commands, generate a generic opacity keyframe as placeholder
				ctx.keyframes.push({
					id: genId('kf'),
					elementId: targetId,
					time: startTime,
					property: 'opacity',
					value: 1,
					easing,
					duration,
				});
				break;
		}
	}

	// Add a timeline marker for named commands
	const label = getOptionValue(cmd.options, 'label', ctx.scope) as string | null;
	if (label) {
		ctx.markers.push({
			time: startTime,
			label,
			color: (color as string) ?? '#6366f1',
		});
	}

	ctx.time = startTime + duration;
}

// ── Parallel Block ──

function compileParallel(block: ParallelBlock, ctx: CompileContext): void {
	const startTime = ctx.time;
	let maxEndTime = startTime;

	for (const stmt of block.body) {
		const childCtx: CompileContext = { ...ctx, time: startTime };
		compileStatement(stmt, childCtx);
		maxEndTime = Math.max(maxEndTime, childCtx.time);
		// Collect keyframes/markers from child
	}

	ctx.time = maxEndTime;
}

// ── Camera Commands ──

function compileCameraCmd(cmd: CameraCommand, ctx: CompileContext): void {
	const duration =
		(getOptionValue(cmd.options, 'duration', ctx.scope) as number) ?? DEFAULT_DURATION;

	switch (cmd.command) {
		case 'zoom': {
			const level = Number(evalExpr(cmd.args[0], ctx.scope));
			ctx.markers.push({ time: ctx.time, label: `zoom:${level}`, color: '#818cf8' });
			break;
		}
		case 'pan': {
			const x = Number(evalExpr(cmd.args[0], ctx.scope));
			const y = cmd.args.length > 1 ? Number(evalExpr(cmd.args[1], ctx.scope)) : 0;
			ctx.markers.push({ time: ctx.time, label: `pan:${x},${y}`, color: '#818cf8' });
			break;
		}
		case 'focus': {
			const targetId = resolveTargetId(cmd.args[0], ctx.scope);
			ctx.markers.push({ time: ctx.time, label: `focus:${targetId}`, color: '#818cf8' });
			break;
		}
	}

	ctx.time += duration;
}

// ── Audio Commands ──

function compileAudioCmd(cmd: AudioCommand, ctx: CompileContext): void {
	ctx.markers.push({ time: ctx.time, label: `audio:${cmd.sound}`, color: '#a78bfa' });
}

// ── Wait Command ──

function compileWaitCmd(cmd: WaitCommand, ctx: CompileContext): void {
	const duration = Number(evalExpr(cmd.duration, ctx.scope));
	ctx.time += duration;
}

// ── Expression Evaluation ──

function evalExpr(expr: Expression, scope: Scope): ScopeValue {
	switch (expr.type) {
		case 'NumberLiteral':
			return expr.value;
		case 'StringLiteral':
			return expr.value;
		case 'BooleanLiteral':
			return expr.value;
		case 'DurationLiteral':
			return expr.value; // Already in seconds
		case 'ArrayLiteral':
			return expr.elements.map((e) => evalExpr(e, scope));
		case 'ObjectLiteral': {
			const obj: Record<string, unknown> = {};
			for (const prop of expr.properties) {
				obj[prop.key] = evalExpr(prop.value, scope);
			}
			return obj as ScopeValue;
		}
		case 'Identifier':
			return scope.get(expr.name);
		case 'MemberExpression': {
			const obj = evalExpr(expr.object, scope);
			if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
				return (obj as Record<string, ScopeValue>)[expr.property] ?? null;
			}
			if (Array.isArray(obj) && expr.property === 'length') {
				return obj.length;
			}
			return null;
		}
		case 'IndexExpression': {
			const obj = evalExpr(expr.object, scope);
			const idx = evalExpr(expr.index, scope);
			if (Array.isArray(obj) && typeof idx === 'number') {
				return (obj[idx] ?? null) as ScopeValue;
			}
			if (obj && typeof obj === 'object' && typeof idx === 'string') {
				return (obj as Record<string, ScopeValue>)[idx] ?? null;
			}
			return null;
		}
		case 'BinaryExpression':
			return evalBinary(expr, scope);
		case 'UnaryExpression':
			return evalUnary(expr, scope);
	}
}

function evalBinary(expr: BinaryExpression, scope: Scope): ScopeValue {
	const left = evalExpr(expr.left, scope);
	const right = evalExpr(expr.right, scope);
	const l = Number(left);
	const r = Number(right);

	switch (expr.operator) {
		case '+':
			return l + r;
		case '-':
			return l - r;
		case '*':
			return l * r;
		case '/':
			return r === 0 ? 0 : l / r;
		case '%':
			return r === 0 ? 0 : l % r;
		case '==':
			return left === right;
		case '!=':
			return left !== right;
		case '<':
			return l < r;
		case '>':
			return l > r;
		case '<=':
			return l <= r;
		case '>=':
			return l >= r;
		case '&&':
			return Boolean(left) && Boolean(right);
		case '||':
			return Boolean(left) || Boolean(right);
	}
}

function evalUnary(expr: UnaryExpression, scope: Scope): ScopeValue {
	const operand = evalExpr(expr.operand, scope);
	switch (expr.operator) {
		case '-':
			return -Number(operand);
		case '!':
			return !operand;
	}
}

// ── Target Resolution ──

function resolveTargetId(expr: Expression, scope: Scope): string {
	if (expr.type === 'Identifier') {
		return expr.name;
	}
	if (expr.type === 'IndexExpression' && expr.object.type === 'Identifier') {
		const idx = evalExpr(expr.index, scope);
		return `${expr.object.name}[${idx}]`;
	}
	if (expr.type === 'MemberExpression' && expr.object.type === 'Identifier') {
		return `${expr.object.name}.${expr.property}`;
	}
	return genId('target');
}
