/**
 * DSL Parser — parses AlgoMotion Animation DSL source code into an AST.
 *
 * Uses Peggy.js 5.x to generate a PEG parser from a grammar string.
 * The grammar is compiled once at module load time.
 *
 * Spec reference: Section 6.6 (Animation DSL)
 */

import peggy from 'peggy';
import type { DslProgram, SourceLocation } from './ast';
import { GRAMMAR } from './grammar';

export interface DslParseError {
	message: string;
	location: SourceLocation;
	found: string | null;
	expected: Array<{ type: string; description: string }>;
}

export interface ParseResult {
	ok: true;
	program: DslProgram;
}

export interface ParseError {
	ok: false;
	error: DslParseError;
}

export type ParseOutcome = ParseResult | ParseError;

// Compile the grammar once at module load time
const parser = peggy.generate(GRAMMAR);

/**
 * Parse AlgoMotion DSL source code into an AST.
 *
 * @param source - The DSL source code string
 * @returns ParseOutcome — either { ok: true, program } or { ok: false, error }
 */
export function parseDsl(source: string): ParseOutcome {
	try {
		const program = parser.parse(source) as DslProgram;
		return { ok: true, program };
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'location' in err) {
			const pegErr = err as {
				message: string;
				location: {
					start: { line: number; column: number; offset: number };
					end: { line: number; column: number; offset: number };
				};
				found: string | null;
				expected: Array<{ type: string; description: string }>;
			};
			return {
				ok: false,
				error: {
					message: pegErr.message,
					location: pegErr.location as SourceLocation,
					found: pegErr.found ?? null,
					expected: pegErr.expected ?? [],
				},
			};
		}
		// Unknown error — wrap it
		return {
			ok: false,
			error: {
				message: err instanceof Error ? err.message : String(err),
				location: {
					start: { line: 1, column: 1, offset: 0 },
					end: { line: 1, column: 1, offset: 0 },
				},
				found: null,
				expected: [],
			},
		};
	}
}
