import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LineHighlightManager } from './line-highlight-manager';

// Minimal mock of Monaco editor's decoration API
function createMockEditor() {
	const decorations: string[] = [];
	return {
		deltaDecorations: vi.fn((oldIds: string[], newDecorations: unknown[]) => {
			// Return new IDs for each decoration
			return newDecorations.map((_, i) => `dec-${decorations.length + i}`);
		}),
		revealLineInCenter: vi.fn(),
	};
}

describe('LineHighlightManager', () => {
	let manager: LineHighlightManager;
	let editor: ReturnType<typeof createMockEditor>;

	beforeEach(() => {
		editor = createMockEditor();
		manager = new LineHighlightManager();
		manager.setEditor(editor as never);
	});

	it('creates with no decorations', () => {
		expect(editor.deltaDecorations).not.toHaveBeenCalled();
	});

	it('highlights current execution line', () => {
		manager.update({ currentLine: 5, visitedLines: [], status: 'running' });

		expect(editor.deltaDecorations).toHaveBeenCalled();
		const [, newDecorations] = editor.deltaDecorations.mock.calls[0] as [
			string[],
			{ range: { startLineNumber: number }; options: { className: string } }[],
		];
		const current = newDecorations.find((d) => d.options.className === 'current-line-highlight');
		expect(current).toBeDefined();
		expect(current?.range.startLineNumber).toBe(5);
	});

	it('dims visited lines', () => {
		manager.update({ currentLine: 5, visitedLines: [1, 2, 3], status: 'running' });

		const [, newDecorations] = editor.deltaDecorations.mock.calls[0] as [
			string[],
			{ range: { startLineNumber: number }; options: { className: string } }[],
		];
		const visited = newDecorations.filter((d) => d.options.className === 'visited-line-dim');
		expect(visited).toHaveLength(3);
		expect(visited.map((v) => v.range.startLineNumber)).toEqual([1, 2, 3]);
	});

	it('indicates next-to-execute line', () => {
		manager.update({
			currentLine: 5,
			visitedLines: [],
			nextLine: 6,
			status: 'paused',
		});

		const [, newDecorations] = editor.deltaDecorations.mock.calls[0] as [
			string[],
			{ range: { startLineNumber: number }; options: { className: string } }[],
		];
		const next = newDecorations.find((d) => d.options.className === 'next-line-indicator');
		expect(next).toBeDefined();
		expect(next?.range.startLineNumber).toBe(6);
	});

	it('does not highlight when status is idle', () => {
		manager.update({ currentLine: 0, visitedLines: [], status: 'idle' });

		const [, newDecorations] = editor.deltaDecorations.mock.calls[0] as [string[], unknown[]];
		expect(newDecorations).toHaveLength(0);
	});

	it('excludes current line from visited decorations', () => {
		manager.update({ currentLine: 3, visitedLines: [1, 2, 3], status: 'running' });

		const [, newDecorations] = editor.deltaDecorations.mock.calls[0] as [
			string[],
			{ range: { startLineNumber: number }; options: { className: string } }[],
		];
		const visited = newDecorations.filter((d) => d.options.className === 'visited-line-dim');
		// Line 3 should NOT appear as visited since it's the current line
		expect(visited.map((v) => v.range.startLineNumber)).toEqual([1, 2]);
	});

	it('reveals current line in center of editor', () => {
		manager.update({ currentLine: 10, visitedLines: [], status: 'running' });

		expect(editor.revealLineInCenter).toHaveBeenCalledWith(10);
	});

	it('does not reveal line when idle', () => {
		manager.update({ currentLine: 0, visitedLines: [], status: 'idle' });

		expect(editor.revealLineInCenter).not.toHaveBeenCalled();
	});

	it('passes old decoration IDs to deltaDecorations for cleanup', () => {
		// First update
		manager.update({ currentLine: 5, visitedLines: [1], status: 'running' });
		const firstCallReturnedIds = editor.deltaDecorations.mock.results[0]?.value as string[];

		// Second update
		manager.update({ currentLine: 6, visitedLines: [1, 5], status: 'running' });
		const [oldIds] = editor.deltaDecorations.mock.calls[1] as [string[], unknown[]];
		expect(oldIds).toEqual(firstCallReturnedIds);
	});

	it('clears all decorations on dispose', () => {
		manager.update({ currentLine: 5, visitedLines: [1], status: 'running' });
		manager.dispose();

		// Last call should clear (pass empty array for new decorations)
		const lastCall = editor.deltaDecorations.mock.calls.at(-1) as [string[], unknown[]];
		expect(lastCall[1]).toEqual([]);
	});

	it('handles update without editor set', () => {
		const noEditorManager = new LineHighlightManager();
		// Should not throw
		expect(() => {
			noEditorManager.update({ currentLine: 5, visitedLines: [], status: 'running' });
		}).not.toThrow();
	});

	it('adds current line glyph for running/paused states', () => {
		manager.update({ currentLine: 5, visitedLines: [], status: 'paused' });

		const [, newDecorations] = editor.deltaDecorations.mock.calls[0] as [
			string[],
			{
				range: { startLineNumber: number };
				options: { glyphMarginClassName?: string };
			}[],
		];
		const withGlyph = newDecorations.find(
			(d) => d.options.glyphMarginClassName === 'current-line-glyph',
		);
		expect(withGlyph).toBeDefined();
	});
});
