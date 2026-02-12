import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { VariableSnapshot } from '@/types';
import { VariableWatchPanel } from './variable-watch-panel';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

let mockVariables: Record<string, VariableSnapshot> = {};
let mockStatus = 'idle' as string;

vi.mock('@/lib/stores/execution-store', () => ({
	useExecutionStore: vi.fn((selector) =>
		selector({
			executionState: {
				variables: mockVariables,
				status: mockStatus,
				currentLine: 0,
				visitedLines: [],
				nextLine: 0,
				callStack: [],
				heap: {},
				output: [],
				stepCount: 0,
				animationTime: 0,
				lineAnnotations: {},
			},
			breakpoints: [],
			sourceCode: '',
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

function makeVar(
	name: string,
	value: unknown,
	type: string,
	opts?: { previousValue?: unknown; changed?: boolean },
): VariableSnapshot {
	return {
		name,
		value: value as VariableSnapshot['value'],
		type,
		previousValue: (opts?.previousValue ?? null) as VariableSnapshot['previousValue'],
		changed: opts?.changed ?? false,
	};
}

describe('VariableWatchPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockVariables = {};
		mockStatus = 'idle';
	});

	it('shows empty state when no variables exist', () => {
		render(<VariableWatchPanel />, { wrapper: Wrapper });
		expect(screen.getByText(/no variables/i)).toBeDefined();
	});

	it('displays variable names', () => {
		mockVariables = {
			x: makeVar('x', 5, 'number'),
			y: makeVar('y', 'hello', 'string'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('x')).toBeDefined();
		expect(screen.getByText('y')).toBeDefined();
	});

	it('displays variable types', () => {
		mockVariables = {
			count: makeVar('count', 42, 'number'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('number')).toBeDefined();
	});

	it('formats number values plainly', () => {
		mockVariables = {
			n: makeVar('n', 42, 'number'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('42')).toBeDefined();
	});

	it('formats string values with quotes', () => {
		mockVariables = {
			s: makeVar('s', 'hello', 'string'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('"hello"')).toBeDefined();
	});

	it('formats boolean values', () => {
		mockVariables = {
			flag: makeVar('flag', true, 'boolean'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('true')).toBeDefined();
	});

	it('shows previous value for changed variables', () => {
		mockVariables = {
			x: makeVar('x', 10, 'number', { previousValue: 5, changed: true }),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		// Should show both current and previous values
		expect(screen.getByText('10')).toBeDefined();
		expect(screen.getByText('5')).toBeDefined();
	});

	it('highlights changed variables with a visual indicator', () => {
		mockVariables = {
			x: makeVar('x', 10, 'number', { previousValue: 5, changed: true }),
			y: makeVar('y', 3, 'number', { changed: false }),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		// Changed variable row should have a distinguishing class
		const rows = screen.getAllByRole('row');
		const changedRow = rows.find((row) => within(row).queryByText('x'));
		expect(changedRow?.className).toMatch(/changed/);
	});

	it('has ARIA live region for accessibility', () => {
		mockVariables = {
			x: makeVar('x', 5, 'number'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		const liveRegion = screen.getByRole('log');
		expect(liveRegion).toBeDefined();
	});

	it('sorts variables alphabetically by default', () => {
		mockVariables = {
			z: makeVar('z', 3, 'number'),
			a: makeVar('a', 1, 'number'),
			m: makeVar('m', 2, 'number'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		const names = screen.getAllByRole('row').slice(1); // skip header
		const nameTexts = names.map((row) => within(row).getAllByRole('cell')[0]?.textContent);
		expect(nameTexts).toEqual(['a', 'm', 'z']);
	});

	it('can sort by last changed', async () => {
		const user = userEvent.setup();
		mockVariables = {
			a: makeVar('a', 1, 'number', { changed: false }),
			b: makeVar('b', 2, 'number', { changed: true }),
			c: makeVar('c', 3, 'number', { changed: false }),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		const sortButton = screen.getByLabelText(/sort/i);
		await user.click(sortButton);

		// Changed variables should come first
		const rows = screen.getAllByRole('row').slice(1);
		const firstRowName = within(rows[0]!).getAllByRole('cell')[0]?.textContent;
		expect(firstRowName).toBe('b');
	});

	it('displays arrays as expandable', () => {
		mockVariables = {
			arr: makeVar('arr', [1, 2, 3], 'object'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('arr')).toBeDefined();
		expect(screen.getByText('[1, 2, 3]')).toBeDefined();
	});

	it('displays objects as expandable', () => {
		mockVariables = {
			obj: makeVar('obj', { a: 1, b: 2 }, 'object'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('obj')).toBeDefined();
	});

	it('displays null value', () => {
		mockVariables = {
			n: makeVar('n', null, 'object'),
		};
		mockStatus = 'running';
		render(<VariableWatchPanel />, { wrapper: Wrapper });

		expect(screen.getByText('null')).toBeDefined();
	});
});
