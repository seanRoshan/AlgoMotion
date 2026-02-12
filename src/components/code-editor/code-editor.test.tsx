import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CodeEditor } from './code-editor';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

// Mock the execution store
const mockToggleBreakpoint = vi.fn();
const mockSetSourceCode = vi.fn();

let mockStoreState = {
	executionState: {
		currentLine: 0,
		status: 'idle' as const,
		callStack: [],
		variables: {},
		heap: {},
		output: [],
		stepCount: 0,
		animationTime: 0,
	},
	breakpoints: {} as Record<string, unknown>,
	sourceCode: '// Hello World\nconsole.log("hello");',
	toggleBreakpoint: mockToggleBreakpoint,
	setSourceCode: mockSetSourceCode,
};

vi.mock('@/lib/stores/execution-store', () => ({
	useExecutionStore: vi.fn((selector) => selector(mockStoreState)),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

// Mock next/dynamic to render the component directly
// In real app, next/dynamic provides lazy-loading with a loading fallback
let mockOnMount: ((editor: unknown, monaco: unknown) => void) | null = null;
let mockEditorProps: Record<string, unknown> = {};

vi.mock('@monaco-editor/react', () => ({
	default: (props: Record<string, unknown>) => {
		mockEditorProps = props;
		if (props.onMount) {
			mockOnMount = props.onMount as typeof mockOnMount;
		}
		return (
			<div data-testid="monaco-editor" data-language={props.language} data-theme={props.theme} />
		);
	},
}));

describe('CodeEditor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOnMount = null;
		mockEditorProps = {};
		mockStoreState = {
			executionState: {
				currentLine: 0,
				status: 'idle',
				callStack: [],
				variables: {},
				heap: {},
				output: [],
				stepCount: 0,
				animationTime: 0,
			},
			breakpoints: {},
			sourceCode: '// Hello World\nconsole.log("hello");',
			toggleBreakpoint: mockToggleBreakpoint,
			setSourceCode: mockSetSourceCode,
		};
	});

	it('renders the monaco editor', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		expect(screen.getByTestId('monaco-editor')).toBeDefined();
	});

	it('passes dark theme to editor when theme is dark', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		const editor = screen.getByTestId('monaco-editor');
		expect(editor.getAttribute('data-theme')).toBe('algomotion-dark');
	});

	it('renders language selector with default JavaScript', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		expect(screen.getByRole('combobox')).toBeDefined();
	});

	it('passes source code from store as value', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		expect(mockEditorProps.value).toBe('// Hello World\nconsole.log("hello");');
	});

	it('calls setSourceCode when editor content changes', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		const onChange = mockEditorProps.onChange as (value: string | undefined) => void;
		onChange('const x = 1;');
		expect(mockSetSourceCode).toHaveBeenCalledWith('const x = 1;');
	});

	it('sets default language to javascript', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		const editor = screen.getByTestId('monaco-editor');
		expect(editor.getAttribute('data-language')).toBe('javascript');
	});

	it('renders read-only toggle button', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		expect(screen.getByLabelText('Toggle read-only mode')).toBeDefined();
	});

	it('toggles read-only mode on button click', async () => {
		const user = userEvent.setup();
		render(<CodeEditor />, { wrapper: Wrapper });

		// Initially not read-only
		expect(mockEditorProps.options).toEqual(expect.objectContaining({ readOnly: false }));

		// Click read-only toggle
		await user.click(screen.getByLabelText('Toggle read-only mode'));

		// Should now be read-only
		expect(mockEditorProps.options).toEqual(expect.objectContaining({ readOnly: true }));
	});

	it('calls onMount callback when editor mounts', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		expect(mockOnMount).toBeDefined();
	});

	it('configures glyph margin for breakpoints', () => {
		render(<CodeEditor />, { wrapper: Wrapper });
		expect(mockEditorProps.options).toEqual(expect.objectContaining({ glyphMargin: true }));
	});
});
