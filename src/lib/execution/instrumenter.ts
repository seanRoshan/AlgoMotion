import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export interface InstrumentResult {
	instrumented: string;
	lineCount: number;
}

/**
 * Instrument JavaScript source code for step-by-step execution.
 *
 * Parses the code into an AST using acorn, then walks the tree to find
 * each statement boundary. The output is a generator function body where
 * each statement is followed by a `yield __step__(line, getVars)` call.
 *
 * `console.log(...)` calls are replaced with `__output__(...)`.
 */
export function instrument(code: string): InstrumentResult {
	if (code.trim() === '') {
		return { instrumented: '', lineCount: 0 };
	}

	const ast = acorn.parse(code, {
		ecmaVersion: 'latest',
		sourceType: 'script',
		locations: true,
	});

	// Collect statement positions for step injection
	const insertions: { pos: number; line: number }[] = [];

	walk.simple(ast, {
		ExpressionStatement(node: acorn.ExpressionStatement) {
			if (node.loc) {
				insertions.push({ pos: node.end, line: node.loc.start.line });
			}
		},
		VariableDeclaration(node: acorn.VariableDeclaration) {
			if (node.loc) {
				insertions.push({ pos: node.end, line: node.loc.start.line });
			}
		},
		ReturnStatement(node: acorn.ReturnStatement) {
			if (node.loc) {
				insertions.push({ pos: node.end, line: node.loc.start.line });
			}
		},
		IfStatement(node: acorn.IfStatement) {
			if (node.loc) {
				// Insert step at the if keyword (test evaluation)
				insertions.push({ pos: node.test.end + 1, line: node.loc.start.line });
			}
		},
		ForStatement(node: acorn.ForStatement) {
			if (node.loc) {
				// Insert step when entering the loop body
				const bodyStart = (node.body as acorn.BlockStatement).start ?? node.body.start;
				insertions.push({ pos: bodyStart + 1, line: node.loc.start.line });
			}
		},
		WhileStatement(node: acorn.WhileStatement) {
			if (node.loc) {
				const bodyStart = (node.body as acorn.BlockStatement).start ?? node.body.start;
				insertions.push({ pos: bodyStart + 1, line: node.loc.start.line });
			}
		},
		FunctionDeclaration(node: acorn.Node) {
			const fnNode = node as acorn.FunctionDeclaration;
			if (fnNode.loc && fnNode.body.type === 'BlockStatement') {
				insertions.push({ pos: fnNode.body.start + 1, line: fnNode.loc.start.line });
			}
		},
	});

	// Sort by position descending so insertions don't shift earlier positions
	insertions.sort((a, b) => b.pos - a.pos);

	let instrumented = code;

	// Replace console.log with __output__
	instrumented = instrumented.replace(/console\.log\s*\(/g, '__output__(');

	for (const ins of insertions) {
		const stepCall = ` __step__(${ins.line});`;
		instrumented = `${instrumented.slice(0, ins.pos)}${stepCall}${instrumented.slice(ins.pos)}`;
	}

	// Count actual code lines (non-empty)
	const lineCount = code.split('\n').filter((l) => l.trim().length > 0).length;

	return { instrumented, lineCount };
}
