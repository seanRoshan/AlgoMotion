import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore } from '@/lib/stores/ui-store';
import { ToolSelector } from './tool-selector';

function TestWrapper({ children }: { children: ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

function renderToolSelector() {
	return render(<ToolSelector />, { wrapper: TestWrapper });
}

class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('ToolSelector', () => {
	beforeEach(() => {
		useUIStore.getState().reset();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders all tool buttons', () => {
		renderToolSelector();
		expect(screen.getByLabelText('Select')).toBeDefined();
		expect(screen.getByLabelText('Hand')).toBeDefined();
		expect(screen.getByLabelText('Rectangle')).toBeDefined();
		expect(screen.getByLabelText('Ellipse')).toBeDefined();
		expect(screen.getByLabelText('Text')).toBeDefined();
		expect(screen.getByLabelText('Arrow')).toBeDefined();
		expect(screen.getByLabelText('Line')).toBeDefined();
	});

	it('reflects the active tool from UI store', () => {
		renderToolSelector();
		const selectBtn = screen.getByLabelText('Select');
		// ToggleGroup type="single" uses role="radio" with aria-checked
		expect(selectBtn.getAttribute('aria-checked')).toBe('true');
	});

	it('updates UI store when a tool is clicked', async () => {
		const user = userEvent.setup();
		renderToolSelector();

		await user.click(screen.getByLabelText('Hand'));
		expect(useUIStore.getState().tool).toBe('pan');
	});

	it('syncs when store changes externally', () => {
		renderToolSelector();
		act(() => {
			useUIStore.getState().setTool('draw-rect');
		});
		const rectBtn = screen.getByLabelText('Rectangle');
		expect(rectBtn.getAttribute('aria-checked')).toBe('true');
	});
});
