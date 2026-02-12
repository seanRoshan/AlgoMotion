import { describe, expect, it } from 'vitest';
import type {
	AnimationCommand,
	ArrayLiteral,
	AudioCommand,
	BinaryExpression,
	BooleanLiteral,
	CameraCommand,
	DslProgram,
	DurationLiteral,
	ElementDeclaration,
	ForLoop,
	Identifier,
	IfStatement,
	IndexExpression,
	MemberExpression,
	NumberLiteral,
	ObjectLiteral,
	ParallelBlock,
	StringLiteral,
	UnaryExpression,
	VariableDeclaration,
	WaitCommand,
	WhileLoop,
} from './ast';
import { type ParseOutcome, parseDsl } from './parser';

function parseOk(source: string): DslProgram {
	const result = parseDsl(source);
	if (!result.ok) {
		throw new Error(`Parse failed: ${result.error.message}`);
	}
	return result.program;
}

function parseErr(source: string): ParseOutcome & { ok: false } {
	const result = parseDsl(source);
	if (result.ok) {
		throw new Error('Expected parse error but got success');
	}
	return result;
}

describe('DSL Parser', () => {
	// ── Scene Blocks ──

	describe('scene blocks', () => {
		it('parses an empty scene', () => {
			const prog = parseOk('scene "Hello" {}');
			expect(prog.type).toBe('Program');
			expect(prog.scenes).toHaveLength(1);
			expect(prog.scenes[0].type).toBe('SceneBlock');
			expect(prog.scenes[0].name).toBe('Hello');
			expect(prog.scenes[0].body).toHaveLength(0);
		});

		it('parses multiple scenes', () => {
			const prog = parseOk(`
				scene "First" {}
				scene "Second" {}
			`);
			expect(prog.scenes).toHaveLength(2);
			expect(prog.scenes[0].name).toBe('First');
			expect(prog.scenes[1].name).toBe('Second');
		});

		it('parses a scene with statements', () => {
			const prog = parseOk(`
				scene "Test" {
					let x = 5
				}
			`);
			expect(prog.scenes[0].body).toHaveLength(1);
		});
	});

	// ── Element Declarations ──

	describe('element declarations', () => {
		it('parses array declaration with position', () => {
			const prog = parseOk(`
				scene "Test" {
					array arr = [5, 3, 8] at (400, 300)
				}
			`);
			const decl = prog.scenes[0].body[0] as ElementDeclaration;
			expect(decl.type).toBe('ElementDeclaration');
			expect(decl.elementType).toBe('array');
			expect(decl.name).toBe('arr');
			expect((decl.value as ArrayLiteral).elements).toHaveLength(3);
			expect(decl.position).toBeDefined();
			expect((decl.position?.x as NumberLiteral).value).toBe(400);
			expect((decl.position?.y as NumberLiteral).value).toBe(300);
		});

		it('parses element declaration without position', () => {
			const prog = parseOk(`
				scene "Test" {
					graph g = { A: ["B", "C"], B: ["D"] }
				}
			`);
			const decl = prog.scenes[0].body[0] as ElementDeclaration;
			expect(decl.type).toBe('ElementDeclaration');
			expect(decl.elementType).toBe('graph');
			expect(decl.name).toBe('g');
			expect(decl.position).toBeUndefined();
		});

		it('parses various element types', () => {
			const types = [
				'array',
				'tree',
				'graph',
				'node',
				'stack',
				'queue',
				'linkedList',
				'matrix',
				'hashTable',
			];
			for (const t of types) {
				const prog = parseOk(`scene "T" { ${t} x = [1] }`);
				const decl = prog.scenes[0].body[0] as ElementDeclaration;
				expect(decl.elementType).toBe(t);
			}
		});
	});

	// ── Variable Declarations ──

	describe('variable declarations', () => {
		it('parses let declaration with number', () => {
			const prog = parseOk('scene "T" { let x = 42 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			expect(decl.type).toBe('VariableDeclaration');
			expect(decl.name).toBe('x');
			expect((decl.value as NumberLiteral).value).toBe(42);
		});

		it('parses let declaration with string', () => {
			const prog = parseOk('scene "T" { let name = "hello" }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			expect(decl.name).toBe('name');
			expect((decl.value as StringLiteral).value).toBe('hello');
		});

		it('parses let declaration with boolean', () => {
			const prog = parseOk('scene "T" { let flag = true }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			expect((decl.value as BooleanLiteral).value).toBe(true);
		});

		it('parses let declaration with expression', () => {
			const prog = parseOk('scene "T" { let x = 1 + 2 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			expect((decl.value as BinaryExpression).operator).toBe('+');
		});
	});

	// ── Control Flow ──

	describe('for loops', () => {
		it('parses for-in range loop', () => {
			const prog = parseOk(`
				scene "T" {
					for i in 0..10 {
						let x = i
					}
				}
			`);
			const loop = prog.scenes[0].body[0] as ForLoop;
			expect(loop.type).toBe('ForLoop');
			expect(loop.variable).toBe('i');
			expect((loop.start as NumberLiteral).value).toBe(0);
			expect((loop.end as NumberLiteral).value).toBe(10);
			expect(loop.body).toHaveLength(1);
		});

		it('parses for loop with expression range', () => {
			const prog = parseOk(`
				scene "T" {
					for j in 0..arr.length - 1 {
						let x = j
					}
				}
			`);
			const loop = prog.scenes[0].body[0] as ForLoop;
			expect(loop.variable).toBe('j');
			expect((loop.end as BinaryExpression).operator).toBe('-');
		});
	});

	describe('while loops', () => {
		it('parses while loop', () => {
			const prog = parseOk(`
				scene "T" {
					while x > 0 {
						let x = x - 1
					}
				}
			`);
			const loop = prog.scenes[0].body[0] as WhileLoop;
			expect(loop.type).toBe('WhileLoop');
			expect((loop.condition as BinaryExpression).operator).toBe('>');
			expect(loop.body).toHaveLength(1);
		});
	});

	describe('if statements', () => {
		it('parses if without else', () => {
			const prog = parseOk(`
				scene "T" {
					if x > 5 {
						let y = 1
					}
				}
			`);
			const stmt = prog.scenes[0].body[0] as IfStatement;
			expect(stmt.type).toBe('IfStatement');
			expect(stmt.consequent).toHaveLength(1);
			expect(stmt.alternate).toBeUndefined();
		});

		it('parses if-else', () => {
			const prog = parseOk(`
				scene "T" {
					if x > 5 {
						let y = 1
					} else {
						let y = 2
					}
				}
			`);
			const stmt = prog.scenes[0].body[0] as IfStatement;
			expect(stmt.consequent).toHaveLength(1);
			expect(stmt.alternate).toHaveLength(1);
		});
	});

	// ── Animation Commands ──

	describe('animation commands', () => {
		it('parses highlight with options', () => {
			const prog = parseOk(`
				scene "T" {
					highlight arr[0], arr[1] color "#FFD700" duration 0.3s
				}
			`);
			const cmd = prog.scenes[0].body[0] as AnimationCommand;
			expect(cmd.type).toBe('AnimationCommand');
			expect(cmd.command).toBe('highlight');
			expect(cmd.targets).toHaveLength(2);
			expect(cmd.options).toHaveLength(2);
			expect(cmd.options[0].name).toBe('color');
			expect((cmd.options[0].value as StringLiteral).value).toBe('#FFD700');
			expect(cmd.options[1].name).toBe('duration');
			expect((cmd.options[1].value as DurationLiteral).value).toBe(0.3);
		});

		it('parses swap command', () => {
			const prog = parseOk(`
				scene "T" {
					swap arr[i], arr[j] duration 0.5s easing "spring"
				}
			`);
			const cmd = prog.scenes[0].body[0] as AnimationCommand;
			expect(cmd.command).toBe('swap');
			expect(cmd.targets).toHaveLength(2);
			expect(cmd.options).toHaveLength(2);
		});

		it('parses mark command', () => {
			const prog = parseOk(`
				scene "T" {
					mark arr[0] color "#4CAF50"
				}
			`);
			const cmd = prog.scenes[0].body[0] as AnimationCommand;
			expect(cmd.command).toBe('mark');
			expect(cmd.targets).toHaveLength(1);
		});

		it('parses all animation command names', () => {
			const commands = [
				'highlight x',
				'unhighlight x',
				'swap x, y',
				'move x',
				'insert x',
				'delete x',
				'mark x',
				'connect x, y',
				'disconnect x, y',
				'label x',
				'annotate x',
			];
			for (const c of commands) {
				const prog = parseOk(`scene "T" { ${c} }`);
				expect(prog.scenes[0].body[0].type).toBe('AnimationCommand');
			}
		});

		it('parses command with delay option', () => {
			const prog = parseOk(`
				scene "T" {
					highlight x delay 0.5s
				}
			`);
			const cmd = prog.scenes[0].body[0] as AnimationCommand;
			expect(cmd.options[0].name).toBe('delay');
		});

		it('parses command with stagger option', () => {
			const prog = parseOk(`
				scene "T" {
					highlight x stagger 0.1s
				}
			`);
			const cmd = prog.scenes[0].body[0] as AnimationCommand;
			expect(cmd.options[0].name).toBe('stagger');
		});
	});

	// ── Parallel Block ──

	describe('parallel blocks', () => {
		it('parses parallel block', () => {
			const prog = parseOk(`
				scene "T" {
					parallel {
						highlight arr[0] color "#FFD700"
						highlight arr[1] color "#FFD700"
					}
				}
			`);
			const block = prog.scenes[0].body[0] as ParallelBlock;
			expect(block.type).toBe('ParallelBlock');
			expect(block.body).toHaveLength(2);
		});
	});

	// ── Camera Commands ──

	describe('camera commands', () => {
		it('parses zoom command', () => {
			const prog = parseOk(`
				scene "T" {
					zoom 2 duration 0.5s
				}
			`);
			const cmd = prog.scenes[0].body[0] as CameraCommand;
			expect(cmd.type).toBe('CameraCommand');
			expect(cmd.command).toBe('zoom');
			expect(cmd.args).toHaveLength(1);
			expect((cmd.args[0] as NumberLiteral).value).toBe(2);
		});

		it('parses pan command', () => {
			const prog = parseOk(`
				scene "T" {
					pan 100, 200 duration 0.5s
				}
			`);
			const cmd = prog.scenes[0].body[0] as CameraCommand;
			expect(cmd.command).toBe('pan');
			expect(cmd.args).toHaveLength(2);
		});

		it('parses focus command', () => {
			const prog = parseOk(`
				scene "T" {
					focus myElement duration 0.3s
				}
			`);
			const cmd = prog.scenes[0].body[0] as CameraCommand;
			expect(cmd.command).toBe('focus');
		});
	});

	// ── Audio Commands ──

	describe('audio commands', () => {
		it('parses audio cue commands', () => {
			const sounds = ['beep', 'click', 'success', 'error'] as const;
			for (const sound of sounds) {
				const prog = parseOk(`scene "T" { ${sound} }`);
				const cmd = prog.scenes[0].body[0] as AudioCommand;
				expect(cmd.type).toBe('AudioCommand');
				expect(cmd.sound).toBe(sound);
			}
		});
	});

	// ── Wait Command ──

	describe('wait commands', () => {
		it('parses wait with duration', () => {
			const prog = parseOk(`
				scene "T" {
					wait 1s
				}
			`);
			const cmd = prog.scenes[0].body[0] as WaitCommand;
			expect(cmd.type).toBe('WaitCommand');
			expect((cmd.duration as DurationLiteral).value).toBe(1);
		});

		it('parses pause command', () => {
			const prog = parseOk(`
				scene "T" {
					pause 500ms
				}
			`);
			const cmd = prog.scenes[0].body[0] as WaitCommand;
			expect(cmd.type).toBe('WaitCommand');
			expect((cmd.duration as DurationLiteral).value).toBe(0.5);
			expect((cmd.duration as DurationLiteral).unit).toBe('ms');
		});
	});

	// ── Expressions ──

	describe('expressions', () => {
		it('parses number literals', () => {
			const prog = parseOk('scene "T" { let x = 42 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as NumberLiteral;
			expect(val.type).toBe('NumberLiteral');
			expect(val.value).toBe(42);
		});

		it('parses float literals', () => {
			const prog = parseOk('scene "T" { let x = 3.14 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			expect((decl.value as NumberLiteral).value).toBe(3.14);
		});

		it('parses negative numbers', () => {
			const prog = parseOk('scene "T" { let x = -5 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as UnaryExpression;
			expect(val.type).toBe('UnaryExpression');
			expect(val.operator).toBe('-');
			expect((val.operand as NumberLiteral).value).toBe(5);
		});

		it('parses string literals', () => {
			const prog = parseOk('scene "T" { let s = "hello world" }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as StringLiteral;
			expect(val.type).toBe('StringLiteral');
			expect(val.value).toBe('hello world');
		});

		it('parses boolean literals', () => {
			const prog = parseOk('scene "T" { let a = true }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			expect((decl.value as BooleanLiteral).value).toBe(true);

			const prog2 = parseOk('scene "T" { let b = false }');
			const decl2 = prog2.scenes[0].body[0] as VariableDeclaration;
			expect((decl2.value as BooleanLiteral).value).toBe(false);
		});

		it('parses array literals', () => {
			const prog = parseOk('scene "T" { let arr = [1, 2, 3] }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as ArrayLiteral;
			expect(val.type).toBe('ArrayLiteral');
			expect(val.elements).toHaveLength(3);
		});

		it('parses object literals', () => {
			const prog = parseOk('scene "T" { let obj = { a: 1, b: "x" } }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as ObjectLiteral;
			expect(val.type).toBe('ObjectLiteral');
			expect(val.properties).toHaveLength(2);
			expect(val.properties[0].key).toBe('a');
			expect(val.properties[1].key).toBe('b');
		});

		it('parses identifier expressions', () => {
			const prog = parseOk('scene "T" { let y = x }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as Identifier;
			expect(val.type).toBe('Identifier');
			expect(val.name).toBe('x');
		});

		it('parses member expressions', () => {
			const prog = parseOk('scene "T" { let x = arr.length }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as MemberExpression;
			expect(val.type).toBe('MemberExpression');
			expect(val.property).toBe('length');
		});

		it('parses index expressions', () => {
			const prog = parseOk('scene "T" { let x = arr[0] }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as IndexExpression;
			expect(val.type).toBe('IndexExpression');
			expect((val.index as NumberLiteral).value).toBe(0);
		});

		it('parses chained member and index access', () => {
			const prog = parseOk('scene "T" { let x = arr[i].value }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const val = decl.value as MemberExpression;
			expect(val.type).toBe('MemberExpression');
			expect(val.property).toBe('value');
			expect((val.object as IndexExpression).type).toBe('IndexExpression');
		});

		it('parses duration literals', () => {
			const prog = parseOk('scene "T" { wait 0.5s }');
			const cmd = prog.scenes[0].body[0] as WaitCommand;
			const dur = cmd.duration as DurationLiteral;
			expect(dur.type).toBe('DurationLiteral');
			expect(dur.value).toBe(0.5);
			expect(dur.unit).toBe('s');
		});

		it('parses millisecond duration literals', () => {
			const prog = parseOk('scene "T" { wait 300ms }');
			const cmd = prog.scenes[0].body[0] as WaitCommand;
			const dur = cmd.duration as DurationLiteral;
			expect(dur.value).toBe(0.3);
			expect(dur.unit).toBe('ms');
		});
	});

	// ── Binary Expressions ──

	describe('binary expressions', () => {
		it('parses arithmetic operators', () => {
			const ops = ['+', '-', '*', '/', '%'] as const;
			for (const op of ops) {
				const prog = parseOk(`scene "T" { let x = 1 ${op} 2 }`);
				const decl = prog.scenes[0].body[0] as VariableDeclaration;
				const expr = decl.value as BinaryExpression;
				expect(expr.type).toBe('BinaryExpression');
				expect(expr.operator).toBe(op);
			}
		});

		it('parses comparison operators', () => {
			const ops = ['==', '!=', '<', '>', '<=', '>='] as const;
			for (const op of ops) {
				const prog = parseOk(`scene "T" { if x ${op} 5 { let y = 1 } }`);
				const stmt = prog.scenes[0].body[0] as IfStatement;
				const cond = stmt.condition as BinaryExpression;
				expect(cond.operator).toBe(op);
			}
		});

		it('parses logical operators', () => {
			const prog = parseOk(`
				scene "T" {
					if a && b || c {
						let x = 1
					}
				}
			`);
			const stmt = prog.scenes[0].body[0] as IfStatement;
			// || has lower precedence than &&, so should be root
			const cond = stmt.condition as BinaryExpression;
			expect(cond.operator).toBe('||');
			expect((cond.left as BinaryExpression).operator).toBe('&&');
		});

		it('respects arithmetic precedence (* before +)', () => {
			const prog = parseOk('scene "T" { let x = 1 + 2 * 3 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const expr = decl.value as BinaryExpression;
			expect(expr.operator).toBe('+');
			expect((expr.right as BinaryExpression).operator).toBe('*');
		});

		it('handles parenthesized expressions', () => {
			const prog = parseOk('scene "T" { let x = (1 + 2) * 3 }');
			const decl = prog.scenes[0].body[0] as VariableDeclaration;
			const expr = decl.value as BinaryExpression;
			expect(expr.operator).toBe('*');
			expect((expr.left as BinaryExpression).operator).toBe('+');
		});
	});

	// ── Unary Expressions ──

	describe('unary expressions', () => {
		it('parses logical not', () => {
			const prog = parseOk('scene "T" { if !flag { let x = 1 } }');
			const stmt = prog.scenes[0].body[0] as IfStatement;
			const cond = stmt.condition as UnaryExpression;
			expect(cond.type).toBe('UnaryExpression');
			expect(cond.operator).toBe('!');
		});
	});

	// ── Comments ──

	describe('comments', () => {
		it('ignores single-line comments', () => {
			const prog = parseOk(`
				scene "T" {
					// This is a comment
					let x = 5
				}
			`);
			expect(prog.scenes[0].body).toHaveLength(1);
		});

		it('ignores multi-line comments', () => {
			const prog = parseOk(`
				scene "T" {
					/* This is a
					   multi-line comment */
					let x = 5
				}
			`);
			expect(prog.scenes[0].body).toHaveLength(1);
		});

		it('handles inline comments', () => {
			const prog = parseOk(`
				scene "T" {
					let x = 5 // inline comment
				}
			`);
			expect(prog.scenes[0].body).toHaveLength(1);
		});
	});

	// ── Assignment ──

	describe('assignments', () => {
		it('parses simple assignment', () => {
			const prog = parseOk('scene "T" { x = 10 }');
			const stmt = prog.scenes[0].body[0];
			expect(stmt.type).toBe('Assignment');
		});

		it('parses indexed assignment', () => {
			const prog = parseOk('scene "T" { arr[0] = 5 }');
			const stmt = prog.scenes[0].body[0];
			expect(stmt.type).toBe('Assignment');
		});
	});

	// ── Complex Programs ──

	describe('complex programs', () => {
		it('parses bubble sort example from spec', () => {
			const source = `
				scene "Bubble Sort" {
					array arr = [5, 3, 8, 1, 9, 2] at (400, 300)

					for i in 0..arr.length {
						for j in 0..arr.length - i - 1 {
							highlight arr[j], arr[j + 1] color "#FFD700" duration 0.3s
							if arr[j] > arr[j + 1] {
								swap arr[j], arr[j + 1] duration 0.5s easing "spring"
							}
							unhighlight arr[j], arr[j + 1] duration 0.2s
						}
						mark arr[arr.length - i - 1] color "#4CAF50"
					}
				}
			`;
			const prog = parseOk(source);
			expect(prog.scenes).toHaveLength(1);
			expect(prog.scenes[0].name).toBe('Bubble Sort');
			expect(prog.scenes[0].body.length).toBeGreaterThan(1);
		});

		it('parses nested control flow', () => {
			const prog = parseOk(`
				scene "T" {
					for i in 0..10 {
						if i > 5 {
							while x > 0 {
								let x = x - 1
							}
						}
					}
				}
			`);
			const loop = prog.scenes[0].body[0] as ForLoop;
			const ifStmt = loop.body[0] as IfStatement;
			const whileLoop = ifStmt.consequent[0] as WhileLoop;
			expect(whileLoop.type).toBe('WhileLoop');
		});
	});

	// ── Error Handling ──

	describe('error handling', () => {
		it('accepts empty input as valid empty program', () => {
			const prog = parseOk('');
			expect(prog.scenes).toHaveLength(0);
		});

		it('returns error for missing scene name', () => {
			const result = parseErr('scene { }');
			expect(result.ok).toBe(false);
		});

		it('returns error for unclosed brace', () => {
			const result = parseErr('scene "T" {');
			expect(result.ok).toBe(false);
		});

		it('returns error with location info', () => {
			const result = parseErr('scene "T" { ??? }');
			expect(result.ok).toBe(false);
			expect(result.error.location).toBeDefined();
			expect(result.error.location.start.line).toBeGreaterThan(0);
			expect(result.error.location.start.column).toBeGreaterThan(0);
		});
	});

	// ── Whitespace Handling ──

	describe('whitespace handling', () => {
		it('handles tabs and multiple spaces', () => {
			const prog = parseOk(`scene\t"T"\t{\t\tlet\tx\t=\t5\t}`);
			expect(prog.scenes).toHaveLength(1);
		});

		it('handles empty lines between statements', () => {
			const prog = parseOk(`
				scene "T" {

					let x = 5

					let y = 10

				}
			`);
			expect(prog.scenes[0].body).toHaveLength(2);
		});
	});
});
