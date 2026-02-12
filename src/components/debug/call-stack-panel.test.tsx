import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { StackFrame } from '@/types';
import { CallStackPanel } from './call-stack-panel';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

let mockCallStack: StackFrame[] = [];
let mockStatus = 'idle' as string;
const mockSetCurrentLine = vi.fn();

vi.mock('@/lib/stores/execution-store', () => ({
	useExecutionStore: vi.fn((selector) =>
		selector({
			executionState: {
				callStack: mockCallStack,
				status: mockStatus,
				currentLine: 0,
				visitedLines: [],
				nextLine: 0,
				variables: {},
				heap: {},
				output: [],
				stepCount: 0,
				animationTime: 0,
				lineAnnotations: {},
			},
			breakpoints: {},
			sourceCode: '',
			setCurrentLine: mockSetCurrentLine,
		}),
	),
}));

vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

function makeFrame(
	functionName: string,
	lineNumber: number,
	localVariables?: Record<string, unknown>,
): StackFrame {
	return {
		functionName,
		lineNumber,
		localVariables: (localVariables ?? {}) as StackFrame['localVariables'],
		returnAddress: 0,
	};
}

describe('CallStackPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCallStack = [];
		mockStatus = 'idle';
	});

	it('shows empty state when no stack frames exist', () => {
		render(<CallStackPanel />, { wrapper: Wrapper });
		expect(screen.getByText(/no call stack/i)).toBeDefined();
	});

	it('displays stack frames with function names', () => {
		mockCallStack = [makeFrame('main', 1), makeFrame('bubbleSort', 5)];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		expect(screen.getByText('main')).toBeDefined();
		expect(screen.getByText('bubbleSort')).toBeDefined();
	});

	it('displays line numbers for each frame', () => {
		mockCallStack = [makeFrame('main', 1), makeFrame('swap', 12)];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		expect(screen.getByText(/^Line 1$/)).toBeDefined();
		expect(screen.getByText(/^Line 12$/)).toBeDefined();
	});

	it('shows current (top) frame with a visual indicator', () => {
		mockCallStack = [makeFrame('main', 1), makeFrame('sort', 5)];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		// The top frame (last in array = most recent) should have a distinct style
		const items = screen.getAllByRole('listitem');
		const topFrame = items[0];
		expect(topFrame?.className).toMatch(/current/);
	});

	it('shows frames in reverse order (most recent on top)', () => {
		mockCallStack = [makeFrame('main', 1), makeFrame('outer', 5), makeFrame('inner', 10)];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		const items = screen.getAllByRole('listitem');
		expect(within(items[0] as HTMLElement).getByText('inner')).toBeDefined();
		expect(within(items[1] as HTMLElement).getByText('outer')).toBeDefined();
		expect(within(items[2] as HTMLElement).getByText('main')).toBeDefined();
	});

	it('navigates to frame line on click', async () => {
		const user = userEvent.setup();
		mockCallStack = [makeFrame('main', 1), makeFrame('sort', 15)];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		// Click on the 'main' frame (bottom frame = second item)
		const mainButton = screen.getByText('main').closest('button') as HTMLElement;
		await user.click(mainButton);

		expect(mockSetCurrentLine).toHaveBeenCalledWith(1);
	});

	it('shows local variables when frame is expanded', async () => {
		const user = userEvent.setup();
		mockCallStack = [makeFrame('main', 1, { x: 5, name: 'hello' })];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		// Expand the frame to see local variables
		const expandButton = screen.getByLabelText(/expand/i);
		await user.click(expandButton);

		expect(screen.getByText('x')).toBeDefined();
		expect(screen.getByText('5')).toBeDefined();
		expect(screen.getByText('name')).toBeDefined();
	});

	it('shows frame with no local variables as empty when expanded', async () => {
		const user = userEvent.setup();
		mockCallStack = [makeFrame('main', 1)];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		const expandButton = screen.getByLabelText(/expand/i);
		await user.click(expandButton);

		expect(screen.getByText(/no local variables/i)).toBeDefined();
	});

	it('displays frame depth count in toolbar', () => {
		mockCallStack = [makeFrame('main', 1), makeFrame('sort', 5), makeFrame('swap', 10)];
		mockStatus = 'running';
		render(<CallStackPanel />, { wrapper: Wrapper });

		expect(screen.getByText(/3 frames/i)).toBeDefined();
	});

	it('displays singular "frame" for single frame', () => {
		mockCallStack = [makeFrame('main', 1)];
		mockStatus = 'running';
		render(<CallStackPanel />, { wrapper: Wrapper });

		expect(screen.getByText(/1 frame$/i)).toBeDefined();
	});

	it('has ARIA live region for accessibility', () => {
		mockCallStack = [makeFrame('main', 1)];
		mockStatus = 'running';
		render(<CallStackPanel />, { wrapper: Wrapper });

		const liveRegion = screen.getByRole('list');
		expect(liveRegion.getAttribute('aria-live')).toBe('polite');
	});

	it('formats value for display in local variables', async () => {
		const user = userEvent.setup();
		mockCallStack = [makeFrame('fn', 1, { arr: [1, 2, 3], flag: true, s: 'test' })];
		mockStatus = 'paused';
		render(<CallStackPanel />, { wrapper: Wrapper });

		const expandButton = screen.getByLabelText(/expand/i);
		await user.click(expandButton);

		expect(screen.getByText('[1, 2, 3]')).toBeDefined();
		expect(screen.getByText('true')).toBeDefined();
		expect(screen.getByText('"test"')).toBeDefined();
	});
});
