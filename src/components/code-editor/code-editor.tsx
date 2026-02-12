'use client';

import Editor from '@monaco-editor/react';
import { Lock, Unlock } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LineHighlightManager } from '@/lib/editor/line-highlight-manager';
import { useExecutionStore } from '@/lib/stores/execution-store';

type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'plaintext';

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'typescript', label: 'TypeScript' },
	{ value: 'python', label: 'Python' },
	{ value: 'cpp', label: 'C++' },
	{ value: 'java', label: 'Java' },
	{ value: 'plaintext', label: 'Pseudocode' },
];

const BREAKPOINT_DECORATION: monaco.editor.IModelDeltaDecoration = {
	range: { startLineNumber: 0, startColumn: 1, endLineNumber: 0, endColumn: 1 },
	options: {
		isWholeLine: false,
		glyphMarginClassName: 'breakpoint-glyph',
		glyphMarginHoverMessage: { value: 'Toggle breakpoint' },
	},
};

/**
 * Code Editor wrapper around Monaco Editor with lazy-loading.
 * Integrates with the execution store for breakpoints and line highlighting.
 *
 * Features:
 * - Lazy-loaded Monaco (~5MB) — textarea placeholder while loading
 * - 6 language syntax highlighting (JS, TS, Python, C++, Java, Pseudocode)
 * - Gutter breakpoints (click to toggle)
 * - Current execution line highlighting
 * - Dark/light theme matching workspace
 * - Read-only mode toggle
 */
export function CodeEditor() {
	const { resolvedTheme } = useTheme();
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const breakpointDecorationsRef = useRef<string[]>([]);
	const highlightManagerRef = useRef(new LineHighlightManager());

	const [language, setLanguage] = useState<SupportedLanguage>('javascript');
	const [readOnly, setReadOnly] = useState(false);

	const sourceCode = useExecutionStore((s) => s.sourceCode);
	const breakpoints = useExecutionStore((s) => s.breakpoints);
	const currentLine = useExecutionStore((s) => s.executionState.currentLine);
	const visitedLines = useExecutionStore((s) => s.executionState.visitedLines);
	const nextLine = useExecutionStore((s) => s.executionState.nextLine);
	const status = useExecutionStore((s) => s.executionState.status);
	const toggleBreakpoint = useExecutionStore((s) => s.toggleBreakpoint);
	const setSourceCode = useExecutionStore((s) => s.setSourceCode);

	const monacoTheme = resolvedTheme === 'light' ? 'algomotion-light' : 'algomotion-dark';

	const handleEditorChange = useCallback(
		(value: string | undefined) => {
			if (value !== undefined) {
				setSourceCode(value);
			}
		},
		[setSourceCode],
	);

	const handleEditorMount = useCallback(
		(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
			editorRef.current = editor;
			highlightManagerRef.current.setEditor(editor as never);

			// Define custom themes
			monacoInstance.editor.defineTheme('algomotion-dark', {
				base: 'vs-dark',
				inherit: true,
				rules: [],
				colors: {
					'editor.background': '#1a1a2e',
					'editor.lineHighlightBackground': '#2a2a4a40',
					'editorGutter.background': '#16162a',
				},
			});
			monacoInstance.editor.defineTheme('algomotion-light', {
				base: 'vs',
				inherit: true,
				rules: [],
				colors: {},
			});
			monacoInstance.editor.setTheme(
				resolvedTheme === 'light' ? 'algomotion-light' : 'algomotion-dark',
			);

			// Listen for gutter clicks to toggle breakpoints
			editor.onMouseDown((e) => {
				if (
					e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
					e.target.position
				) {
					toggleBreakpoint(e.target.position.lineNumber);
				}
			});
		},
		[resolvedTheme, toggleBreakpoint],
	);

	// Update breakpoint decorations when breakpoints change
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		const decorations: monaco.editor.IModelDeltaDecoration[] = Object.values(breakpoints).map(
			(bp) => ({
				...BREAKPOINT_DECORATION,
				range: {
					startLineNumber: bp.line,
					startColumn: 1,
					endLineNumber: bp.line,
					endColumn: 1,
				},
				options: {
					...BREAKPOINT_DECORATION.options,
					glyphMarginClassName: bp.enabled
						? bp.condition
							? 'breakpoint-conditional-glyph'
							: 'breakpoint-glyph'
						: 'breakpoint-disabled-glyph',
				},
			}),
		);

		breakpointDecorationsRef.current = editor.deltaDecorations(
			breakpointDecorationsRef.current,
			decorations,
		);
	}, [breakpoints]);

	// Update line highlights when execution state changes
	useEffect(() => {
		highlightManagerRef.current.update({
			currentLine,
			visitedLines,
			nextLine,
			status,
		});
	}, [currentLine, visitedLines, nextLine, status]);

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center gap-2 border-b px-2 py-1">
				<Select value={language} onValueChange={(v) => setLanguage(v as SupportedLanguage)}>
					<SelectTrigger size="sm" className="h-6 w-28 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LANGUAGE_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => setReadOnly((prev) => !prev)}
							aria-label="Toggle read-only mode"
						>
							{readOnly ? <Lock className="size-3" /> : <Unlock className="size-3" />}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">{readOnly ? 'Read-only' : 'Editable'}</TooltipContent>
				</Tooltip>
			</div>

			{/* Editor */}
			<div className="flex-1">
				<Editor
					language={language}
					theme={monacoTheme}
					value={sourceCode}
					onChange={handleEditorChange}
					onMount={handleEditorMount}
					loading={<EditorPlaceholder code={sourceCode} />}
					options={{
						readOnly,
						glyphMargin: true,
						minimap: { enabled: false },
						fontSize: 13,
						fontFamily: 'JetBrains Mono, monospace',
						lineNumbers: 'on',
						scrollBeyondLastLine: false,
						automaticLayout: true,
						tabSize: 2,
						padding: { top: 8 },
						renderLineHighlight: 'all',
						folding: true,
						wordWrap: 'on',
					}}
				/>
			</div>
		</div>
	);
}

function EditorPlaceholder({ code }: { code: string }) {
	return (
		<div className="flex h-full w-full flex-col bg-[#1a1a2e] p-2">
			<textarea
				readOnly
				value={code}
				className="flex-1 resize-none bg-transparent font-mono text-sm text-[#e0e0f0]/50 outline-none"
				aria-label="Code editor loading"
			/>
			<p className="text-center text-xs text-muted-foreground/40">Loading editor...</p>
		</div>
	);
}
