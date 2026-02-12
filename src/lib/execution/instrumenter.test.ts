import { describe, expect, it } from 'vitest';
import { instrument } from './instrumenter';

describe('Code Instrumenter', () => {
	it('instruments a simple variable declaration', () => {
		const code = 'let x = 5;';
		const result = instrument(code);

		expect(result.instrumented).toContain('__step__');
		expect(result.instrumented).toContain('let x = 5');
	});

	it('instruments multiple statements', () => {
		const code = 'let x = 1;\nlet y = 2;\nlet z = x + y;';
		const result = instrument(code);

		// Each statement should have a step call
		const stepCount = (result.instrumented.match(/__step__/g) || []).length;
		expect(stepCount).toBeGreaterThanOrEqual(3);
	});

	it('instruments console.log by replacing with __output__', () => {
		const code = 'console.log("hello");';
		const result = instrument(code);

		expect(result.instrumented).toContain('__output__');
	});

	it('returns parsed line count', () => {
		const code = 'let a = 1;\nlet b = 2;\nlet c = 3;';
		const result = instrument(code);

		expect(result.lineCount).toBe(3);
	});

	it('preserves code semantics after instrumentation', () => {
		const code = 'let x = 5;\nlet y = x * 2;';
		const result = instrument(code);

		// Instrumented code should still contain the original expressions
		expect(result.instrumented).toContain('x = 5');
		expect(result.instrumented).toContain('x * 2');
	});

	it('instruments for loops', () => {
		const code = 'for (let i = 0; i < 3; i++) {\n  let x = i;\n}';
		const result = instrument(code);

		expect(result.instrumented).toContain('__step__');
		expect(result.instrumented).toContain('for');
	});

	it('instruments if statements', () => {
		const code = 'let x = 5;\nif (x > 3) {\n  let y = 1;\n}';
		const result = instrument(code);

		expect(result.instrumented).toContain('__step__');
		expect(result.instrumented).toContain('if');
	});

	it('instruments function declarations', () => {
		const code = 'function add(a, b) {\n  return a + b;\n}';
		const result = instrument(code);

		expect(result.instrumented).toContain('__step__');
		expect(result.instrumented).toContain('function add');
	});

	it('handles empty code gracefully', () => {
		const result = instrument('');

		expect(result.instrumented).toBeDefined();
		expect(result.lineCount).toBe(0);
	});

	it('handles syntax errors by throwing', () => {
		expect(() => instrument('let x = ;')).toThrow();
	});
});
