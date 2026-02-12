import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConsolePanel } from './console-panel';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

// Mock execution store
let mockOutput: string[] = [];
const mockClearOutput = vi.fn();

vi.mock('@/lib/stores/execution-store', () => ({
	useExecutionStore: vi.fn((selector) =>
		selector({
			executionState: {
				output: mockOutput,
				currentLine: 0,
				status: 'idle',
				callStack: [],
				variables: {},
				heap: {},
				stepCount: 0,
				animationTime: 0,
			},
			breakpoints: {},
			sourceCode: '',
			clearOutput: mockClearOutput,
		}),
	),
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

describe('ConsolePanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOutput = [];
	});

	it('renders the console panel', () => {
		render(<ConsolePanel />, { wrapper: Wrapper });
		expect(screen.getByLabelText('Console output')).toBeDefined();
	});

	it('displays output lines', () => {
		mockOutput = ['hello world', 'value: 42'];
		render(<ConsolePanel />, { wrapper: Wrapper });

		expect(screen.getByText('hello world')).toBeDefined();
		expect(screen.getByText('value: 42')).toBeDefined();
	});

	it('shows empty state when no output', () => {
		mockOutput = [];
		render(<ConsolePanel />, { wrapper: Wrapper });

		expect(screen.getByText(/no output/i)).toBeDefined();
	});

	it('renders clear button', () => {
		render(<ConsolePanel />, { wrapper: Wrapper });
		expect(screen.getByLabelText('Clear console')).toBeDefined();
	});

	it('calls clearOutput when clear button is clicked', async () => {
		const user = userEvent.setup();
		mockOutput = ['some output'];
		render(<ConsolePanel />, { wrapper: Wrapper });

		await user.click(screen.getByLabelText('Clear console'));

		expect(mockClearOutput).toHaveBeenCalled();
	});

	it('renders copy button', () => {
		render(<ConsolePanel />, { wrapper: Wrapper });
		expect(screen.getByLabelText('Copy output')).toBeDefined();
	});

	it('displays output count', () => {
		mockOutput = ['line 1', 'line 2', 'line 3'];
		render(<ConsolePanel />, { wrapper: Wrapper });

		expect(screen.getByText('3 lines')).toBeDefined();
	});
});
