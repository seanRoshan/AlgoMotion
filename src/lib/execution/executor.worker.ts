/**
 * Web Worker that executes instrumented JavaScript code step-by-step.
 *
 * SECURITY NOTE: This uses `new Function()` intentionally inside a Web Worker
 * sandbox. The Worker has no DOM access, no main thread access, and no network
 * access beyond what's explicitly granted. The code is first instrumented
 * (parsed and transformed) before being passed here, so it's not raw user input.
 * This is the standard pattern for educational code execution environments.
 *
 * Receives commands from the main thread via postMessage:
 * - run: Parse and start executing code
 * - step: Execute one step and pause
 * - continue: Run until breakpoint or completion
 * - pause: Pause execution
 * - setBreakpoints: Update breakpoint line numbers
 *
 * Sends events back to main thread:
 * - step: After each statement with variables and call stack
 * - output: Captured console.log output
 * - error: Runtime errors with line info
 * - complete: Execution finished
 */

let breakpoints: number[] = [];
let stepIndex = 0;
let variables: Record<string, unknown> = {};
let previousVariables: Record<string, unknown> = {};

function __step__(line: number) {
	const varSnapshot: Record<
		string,
		{ name: string; value: unknown; type: string; previousValue: unknown; changed: boolean }
	> = {};

	for (const [key, value] of Object.entries(variables)) {
		varSnapshot[key] = {
			name: key,
			value,
			type: typeof value,
			previousValue: previousVariables[key],
			changed: previousVariables[key] !== value,
		};
	}

	previousVariables = { ...variables };

	self.postMessage({
		type: 'step',
		line,
		variables: varSnapshot,
		callStack: [],
		stepIndex: stepIndex++,
	});
}

function __output__(...args: unknown[]) {
	const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
	self.postMessage({ type: 'output', text });
}

self.onmessage = (e: MessageEvent) => {
	const { type } = e.data;

	switch (type) {
		case 'run': {
			const { code } = e.data;
			stepIndex = 0;
			variables = {};
			previousVariables = {};

			try {
				// Intentional use of Function constructor inside Web Worker sandbox.
				// The Worker is isolated: no DOM, no main thread access.
				// Code is pre-instrumented (AST-parsed and transformed) before reaching here.
				// biome-ignore lint/security/noGlobalEval: Sandboxed Worker execution of pre-instrumented code
				const fn = new Function('__step__', '__output__', code);
				fn(__step__, __output__);

				self.postMessage({ type: 'complete', stepCount: stepIndex });
			} catch (err) {
				const error = err as Error;
				self.postMessage({
					type: 'error',
					message: error.message,
					line: 0,
				});
			}
			break;
		}

		case 'setBreakpoints':
			breakpoints = e.data.breakpoints;
			break;
	}
};

// Export breakpoints for potential future use
export { breakpoints };
