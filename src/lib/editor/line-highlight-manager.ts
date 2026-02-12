import type { ExecutionStatus } from '@/types';

/**
 * Minimal interface for the Monaco editor decoration API.
 * Using this interface avoids importing the full monaco-editor package
 * in non-UI modules and keeps the manager testable without jsdom.
 */
interface EditorLike {
	deltaDecorations(oldDecorations: string[], newDecorations: DecorationInput[]): string[];
	revealLineInCenter(lineNumber: number): void;
}

interface DecorationInput {
	range: {
		startLineNumber: number;
		startColumn: number;
		endLineNumber: number;
		endColumn: number;
	};
	options: {
		isWholeLine: boolean;
		className?: string;
		glyphMarginClassName?: string;
	};
}

export interface HighlightState {
	currentLine: number;
	visitedLines: number[];
	nextLine?: number;
	status: ExecutionStatus;
}

/**
 * Manages Monaco editor line decorations for code execution highlighting.
 *
 * Three decoration types:
 * - **Current line** (blue glow): the line currently being executed
 * - **Visited lines** (dimmed): lines already executed
 * - **Next line** (subtle indicator): the line that will execute next
 */
export class LineHighlightManager {
	private editor: EditorLike | null = null;
	private decorationIds: string[] = [];

	setEditor(editor: EditorLike): void {
		this.editor = editor;
	}

	update(state: HighlightState): void {
		if (!this.editor) return;

		const isActive = state.status !== 'idle' && state.currentLine > 0;
		const decorations: DecorationInput[] = [];

		if (isActive) {
			// Visited lines (exclude current line)
			for (const line of state.visitedLines) {
				if (line !== state.currentLine) {
					decorations.push({
						range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
						options: { isWholeLine: true, className: 'visited-line-dim' },
					});
				}
			}

			// Current line
			decorations.push({
				range: {
					startLineNumber: state.currentLine,
					startColumn: 1,
					endLineNumber: state.currentLine,
					endColumn: 1,
				},
				options: {
					isWholeLine: true,
					className: 'current-line-highlight',
					glyphMarginClassName: 'current-line-glyph',
				},
			});

			// Next line
			if (state.nextLine && state.nextLine > 0) {
				decorations.push({
					range: {
						startLineNumber: state.nextLine,
						startColumn: 1,
						endLineNumber: state.nextLine,
						endColumn: 1,
					},
					options: { isWholeLine: true, className: 'next-line-indicator' },
				});
			}

			this.editor.revealLineInCenter(state.currentLine);
		}

		this.decorationIds = this.editor.deltaDecorations(this.decorationIds, decorations);
	}

	dispose(): void {
		if (this.editor) {
			this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
		}
	}
}
