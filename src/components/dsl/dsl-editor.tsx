'use client';

import Editor from '@monaco-editor/react';
import { AlertCircle, Play } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DSL_LANGUAGE_ID, registerDslLanguage } from '@/lib/dsl/monaco-language';
import { type ParseOutcome, parseDsl } from '@/lib/dsl/parser';

const DEFAULT_DSL = `scene "Hello World" {
  array arr = [5, 3, 8, 1, 4] at (400, 300)

  for i in 0..arr.length {
    highlight arr[i] color "#FFD700" duration 0.3s
    wait 0.2s
    unhighlight arr[i] duration 0.2s
  }
}
`;

/**
 * DSL Editor — Monaco editor configured for AlgoMotion DSL with
 * syntax highlighting, auto-complete, and live error reporting.
 *
 * Spec reference: Section 6.6 (Animation DSL)
 */
export function DslEditor() {
	const { resolvedTheme } = useTheme();
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof monaco | null>(null);
	const errorDecorationsRef = useRef<string[]>([]);

	const [dslSource, setDslSource] = useState(DEFAULT_DSL);
	const [parseResult, setParseResult] = useState<ParseOutcome | null>(null);

	const monacoTheme = resolvedTheme === 'light' ? 'algomotion-light' : 'algomotion-dark';

	const validateDsl = useCallback(
		(
			source: string,
			editor: monaco.editor.IStandaloneCodeEditor,
			monacoInstance: typeof monaco,
		) => {
			const result = parseDsl(source);
			setParseResult(result);

			const model = editor.getModel();
			if (!model) return;

			if (!result.ok) {
				const { location } = result.error;
				const markers: monaco.editor.IMarkerData[] = [
					{
						severity: monacoInstance.MarkerSeverity.Error,
						message: result.error.message,
						startLineNumber: location.start.line,
						startColumn: location.start.column,
						endLineNumber: location.end.line,
						endColumn: location.end.column + 1,
					},
				];
				monacoInstance.editor.setModelMarkers(model, DSL_LANGUAGE_ID, markers);

				// Add error decoration
				errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, [
					{
						range: {
							startLineNumber: location.start.line,
							startColumn: 1,
							endLineNumber: location.start.line,
							endColumn: 1,
						},
						options: {
							isWholeLine: true,
							className: 'dsl-error-line',
							glyphMarginClassName: 'dsl-error-glyph',
						},
					},
				]);
			} else {
				monacoInstance.editor.setModelMarkers(model, DSL_LANGUAGE_ID, []);
				errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, []);
			}
		},
		[],
	);

	const handleEditorMount = useCallback(
		(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
			editorRef.current = editor;
			monacoRef.current = monacoInstance;

			// Register DSL language
			registerDslLanguage(monacoInstance);

			// Define themes if not already defined
			monacoInstance.editor.defineTheme('algomotion-dark', {
				base: 'vs-dark',
				inherit: true,
				rules: [
					{ token: 'keyword.animation', foreground: '22d3ee', fontStyle: 'bold' },
					{ token: 'keyword.camera', foreground: 'a78bfa' },
					{ token: 'keyword.audio', foreground: 'f472b6' },
					{ token: 'keyword.wait', foreground: 'fb923c' },
					{ token: 'keyword.option', foreground: '94a3b8', fontStyle: 'italic' },
					{ token: 'type', foreground: '4ade80', fontStyle: 'bold' },
					{ token: 'number.duration', foreground: 'fbbf24' },
				],
				colors: {
					'editor.background': '#1a1a2e',
					'editor.lineHighlightBackground': '#2a2a4a40',
					'editorGutter.background': '#16162a',
				},
			});
			monacoInstance.editor.defineTheme('algomotion-light', {
				base: 'vs',
				inherit: true,
				rules: [
					{ token: 'keyword.animation', foreground: '0891b2', fontStyle: 'bold' },
					{ token: 'keyword.camera', foreground: '7c3aed' },
					{ token: 'keyword.audio', foreground: 'db2777' },
					{ token: 'keyword.wait', foreground: 'ea580c' },
					{ token: 'keyword.option', foreground: '64748b', fontStyle: 'italic' },
					{ token: 'type', foreground: '16a34a', fontStyle: 'bold' },
					{ token: 'number.duration', foreground: 'd97706' },
				],
				colors: {},
			});

			monacoInstance.editor.setTheme(monacoTheme);

			// Parse initial content
			validateDsl(DEFAULT_DSL, editor, monacoInstance);
		},
		[monacoTheme, validateDsl],
	);

	const handleChange = useCallback(
		(value: string | undefined) => {
			const source = value ?? '';
			setDslSource(source);

			const editor = editorRef.current;
			const monacoInstance = monacoRef.current;
			if (editor && monacoInstance) {
				validateDsl(source, editor, monacoInstance);
			}
		},
		[validateDsl],
	);

	// Update theme when system theme changes
	useEffect(() => {
		const monacoInstance = monacoRef.current;
		if (monacoInstance) {
			monacoInstance.editor.setTheme(monacoTheme);
		}
	}, [monacoTheme]);

	const errorMessage =
		parseResult && !parseResult.ok
			? `Line ${parseResult.error.location.start.line}: ${parseResult.error.message}`
			: null;

	const sceneCount = parseResult?.ok ? parseResult.program.scenes.length : 0;

	return (
		<div className="flex h-full flex-col" data-testid="dsl-editor">
			{/* Toolbar */}
			<div className="flex items-center justify-between border-b px-2 py-1">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground">DSL Editor</span>
					{parseResult?.ok && (
						<span className="text-xs text-green-500">
							{sceneCount} scene{sceneCount !== 1 ? 's' : ''}
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-xs"
								disabled={!parseResult?.ok}
								aria-label="Run DSL"
							>
								<Play className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Run animation</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Editor */}
			<div className="flex-1">
				<Editor
					language={DSL_LANGUAGE_ID}
					theme={monacoTheme}
					value={dslSource}
					onChange={handleChange}
					onMount={handleEditorMount}
					loading={
						<div className="flex h-full items-center justify-center bg-[#1a1a2e]">
							<p className="text-xs text-muted-foreground/40">Loading DSL editor...</p>
						</div>
					}
					options={{
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
						suggest: {
							showKeywords: true,
							showSnippets: true,
						},
					}}
				/>
			</div>

			{/* Error bar */}
			{errorMessage && (
				<div className="flex items-center gap-1.5 border-t border-red-500/20 bg-red-500/10 px-2 py-1">
					<AlertCircle className="size-3 shrink-0 text-red-400" />
					<span className="truncate text-xs text-red-400">{errorMessage}</span>
				</div>
			)}
		</div>
	);
}
