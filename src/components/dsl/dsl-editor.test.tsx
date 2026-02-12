import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DslEditor } from './dsl-editor';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

// Mock Monaco Editor since it requires a DOM with full canvas support
vi.mock('@monaco-editor/react', () => ({
	default: function MockEditor({
		value,
		loading,
	}: {
		value: string;
		loading: React.ReactNode;
		language: string;
		theme: string;
		onChange: (v: string) => void;
		onMount: () => void;
		options: Record<string, unknown>;
	}) {
		if (!value) return loading;
		return (
			<div data-testid="mock-monaco-editor">
				<pre>{value}</pre>
			</div>
		);
	},
}));

describe('DslEditor', () => {
	it('renders the DSL editor container', () => {
		render(<DslEditor />, { wrapper: Wrapper });
		expect(screen.getByTestId('dsl-editor')).toBeDefined();
	});

	it('shows DSL Editor title in toolbar', () => {
		render(<DslEditor />, { wrapper: Wrapper });
		expect(screen.getByText('DSL Editor')).toBeDefined();
	});

	it('renders the mock Monaco editor with default DSL content', () => {
		render(<DslEditor />, { wrapper: Wrapper });
		const editor = screen.getByTestId('mock-monaco-editor');
		expect(editor).toBeDefined();
		expect(editor.textContent).toContain('scene');
	});

	it('shows a Run button', () => {
		render(<DslEditor />, { wrapper: Wrapper });
		expect(screen.getByLabelText('Run DSL')).toBeDefined();
	});
});
