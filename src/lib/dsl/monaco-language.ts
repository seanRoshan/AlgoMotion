/**
 * Monaco Editor language definition for AlgoMotion DSL.
 *
 * Provides:
 * - Monarch tokenizer for syntax highlighting
 * - Language configuration (brackets, comments, auto-close)
 * - Completion item provider for DSL keywords
 *
 * Spec reference: Section 6.6 (Animation DSL)
 */

import type * as monaco from 'monaco-editor';

export const DSL_LANGUAGE_ID = 'algomotion-dsl';

/**
 * Monarch tokenizer for DSL syntax highlighting.
 */
export const DSL_MONARCH_TOKENIZER: monaco.languages.IMonarchLanguage = {
	keywords: ['scene', 'let', 'for', 'in', 'while', 'if', 'else', 'parallel', 'at', 'true', 'false'],

	animationCommands: [
		'highlight',
		'unhighlight',
		'swap',
		'move',
		'insert',
		'delete',
		'mark',
		'connect',
		'disconnect',
		'label',
		'annotate',
	],

	cameraCommands: ['zoom', 'pan', 'focus'],

	audioCommands: ['beep', 'click', 'success', 'error'],

	waitCommands: ['wait', 'pause'],

	optionKeywords: ['color', 'duration', 'easing', 'delay', 'stagger'],

	elementTypes: [
		'array',
		'tree',
		'graph',
		'node',
		'stack',
		'queue',
		'linkedList',
		'matrix',
		'hashTable',
	],

	operators: [
		'==',
		'!=',
		'<=',
		'>=',
		'&&',
		'||',
		'+',
		'-',
		'*',
		'/',
		'%',
		'<',
		'>',
		'!',
		'=',
		'..',
	],

	tokenizer: {
		root: [
			// Whitespace
			[/[ \t\r\n]+/, ''],

			// Comments
			[/\/\/.*$/, 'comment'],
			[/\/\*/, 'comment', '@comment'],

			// Strings
			[/"[^"]*"/, 'string'],

			// Duration literals (must come before numbers)
			[/\d+(\.\d+)?(ms|s)\b/, 'number.duration'],

			// Numbers
			[/\d+(\.\d+)?/, 'number'],

			// Range operator
			[/\.\./, 'operator'],

			// Identifiers and keywords
			[
				/[a-zA-Z_]\w*/,
				{
					cases: {
						'@keywords': 'keyword',
						'@animationCommands': 'keyword.animation',
						'@cameraCommands': 'keyword.camera',
						'@audioCommands': 'keyword.audio',
						'@waitCommands': 'keyword.wait',
						'@optionKeywords': 'keyword.option',
						'@elementTypes': 'type',
						'@default': 'identifier',
					},
				},
			],

			// Operators
			[/[=!<>]=|&&|\|\||[+\-*/%<>=!]/, 'operator'],

			// Brackets
			[/[{}()[\]]/, '@brackets'],

			// Comma
			[/,/, 'delimiter'],

			// Color hex values
			[/#[0-9a-fA-F]{3,8}/, 'number.hex'],
		],

		comment: [
			[/[^/*]+/, 'comment'],
			[/\*\//, 'comment', '@pop'],
			[/[/*]/, 'comment'],
		],
	},
};

/**
 * Language configuration for brackets, comments, auto-close.
 */
export const DSL_LANGUAGE_CONFIG: monaco.languages.LanguageConfiguration = {
	comments: {
		lineComment: '//',
		blockComment: ['/*', '*/'],
	},
	brackets: [
		['{', '}'],
		['[', ']'],
		['(', ')'],
	],
	autoClosingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"', notIn: ['string'] },
	],
	surroundingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"' },
	],
	folding: {
		markers: {
			start: /\{/,
			end: /\}/,
		},
	},
};

/**
 * DSL completion suggestions.
 * Uses Monaco snippet syntax (e.g. ${1:name}) which Biome misidentifies as template literals.
 */
// biome-ignore lint/suspicious/noTemplateCurlyInString: Monaco snippet syntax, not JS templates
const DSL_COMPLETIONS: Array<{
	label: string;
	kind: 'Keyword' | 'Function' | 'Snippet';
	insertText: string;
	detail: string;
}> = [
	{
		label: 'scene',
		kind: 'Snippet',
		insertText: 'scene "${1:name}" {\n\t$0\n}',
		detail: 'Define a scene block',
	},
	{
		label: 'let',
		kind: 'Keyword',
		insertText: 'let ${1:name} = ${2:value}',
		detail: 'Declare a variable',
	},
	{
		label: 'array',
		kind: 'Keyword',
		insertText: 'array ${1:name} = [${2:values}] at (${3:x}, ${4:y})',
		detail: 'Declare an array element',
	},
	{
		label: 'tree',
		kind: 'Keyword',
		insertText: 'tree ${1:name} = ${2:value} at (${3:x}, ${4:y})',
		detail: 'Declare a tree element',
	},
	{
		label: 'graph',
		kind: 'Keyword',
		insertText: 'graph ${1:name} = ${2:value} at (${3:x}, ${4:y})',
		detail: 'Declare a graph element',
	},
	{
		label: 'for',
		kind: 'Snippet',
		insertText: 'for ${1:i} in ${2:0}..${3:n} {\n\t$0\n}',
		detail: 'For loop with range',
	},
	{
		label: 'while',
		kind: 'Snippet',
		insertText: 'while ${1:condition} {\n\t$0\n}',
		detail: 'While loop',
	},
	{
		label: 'if',
		kind: 'Snippet',
		insertText: 'if ${1:condition} {\n\t$0\n}',
		detail: 'If statement',
	},
	{
		label: 'parallel',
		kind: 'Snippet',
		insertText: 'parallel {\n\t$0\n}',
		detail: 'Run animations concurrently',
	},
	{
		label: 'highlight',
		kind: 'Function',
		insertText: 'highlight ${1:target} color "${2:#FFD700}" duration ${3:0.3}s',
		detail: 'Highlight an element',
	},
	{
		label: 'unhighlight',
		kind: 'Function',
		insertText: 'unhighlight ${1:target} duration ${2:0.2}s',
		detail: 'Remove highlight',
	},
	{
		label: 'swap',
		kind: 'Function',
		insertText: 'swap ${1:a}, ${2:b} duration ${3:0.5}s easing "${4:spring}"',
		detail: 'Swap two elements',
	},
	{
		label: 'mark',
		kind: 'Function',
		insertText: 'mark ${1:target} color "${2:#4CAF50}"',
		detail: 'Mark an element as complete',
	},
	{
		label: 'move',
		kind: 'Function',
		insertText: 'move ${1:target} duration ${2:0.3}s',
		detail: 'Move an element',
	},
	{ label: 'wait', kind: 'Function', insertText: 'wait ${1:1}s', detail: 'Pause animation' },
	{
		label: 'zoom',
		kind: 'Function',
		insertText: 'zoom ${1:2} duration ${2:0.5}s',
		detail: 'Zoom camera',
	},
	{
		label: 'pan',
		kind: 'Function',
		insertText: 'pan ${1:x}, ${2:y} duration ${3:0.5}s',
		detail: 'Pan camera',
	},
	{
		label: 'focus',
		kind: 'Function',
		insertText: 'focus ${1:element} duration ${2:0.3}s',
		detail: 'Focus camera on element',
	},
];

/**
 * Register the AlgoMotion DSL language with Monaco.
 * Call this once when Monaco is available (e.g., in onMount callback).
 */
export function registerDslLanguage(monacoInstance: typeof monaco): void {
	// Only register once
	const languages = monacoInstance.languages.getLanguages();
	if (languages.some((lang) => lang.id === DSL_LANGUAGE_ID)) return;

	monacoInstance.languages.register({ id: DSL_LANGUAGE_ID });
	monacoInstance.languages.setMonarchTokensProvider(DSL_LANGUAGE_ID, DSL_MONARCH_TOKENIZER);
	monacoInstance.languages.setLanguageConfiguration(DSL_LANGUAGE_ID, DSL_LANGUAGE_CONFIG);

	// Register completion provider
	monacoInstance.languages.registerCompletionItemProvider(DSL_LANGUAGE_ID, {
		provideCompletionItems: (model, position) => {
			const word = model.getWordUntilPosition(position);
			const range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn: word.endColumn,
			};

			const kindMap: Record<string, monaco.languages.CompletionItemKind> = {
				Keyword: monacoInstance.languages.CompletionItemKind.Keyword,
				Function: monacoInstance.languages.CompletionItemKind.Function,
				Snippet: monacoInstance.languages.CompletionItemKind.Snippet,
			};

			const suggestions: monaco.languages.CompletionItem[] = DSL_COMPLETIONS.map((c) => ({
				label: c.label,
				kind: kindMap[c.kind] ?? monacoInstance.languages.CompletionItemKind.Text,
				insertText: c.insertText,
				insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
				detail: c.detail,
				range,
			}));

			return { suggestions };
		},
	});
}
