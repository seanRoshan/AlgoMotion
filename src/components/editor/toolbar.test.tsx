import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useHistoryStore } from '@/lib/stores/history-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Toolbar } from './toolbar';

function TestWrapper({ children }: { children: ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

function renderToolbar() {
	return render(<Toolbar />, { wrapper: TestWrapper });
}

// Mock pixi.js imports for SceneManager dependency chain
vi.mock('pixi.js', () => ({}));

// ResizeObserver needed for shadcn components
class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('Toolbar', () => {
	beforeEach(() => {
		useUIStore.getState().reset();
		useTimelineStore.getState().reset();
		useSceneStore.getState().reset();
		useHistoryStore.getState().clearHistory();
	});

	afterEach(() => {
		cleanup();
	});

	describe('rendering', () => {
		it('renders the toolbar element', () => {
			renderToolbar();
			expect(screen.getByRole('toolbar')).toBeDefined();
		});

		it('renders the app logo', () => {
			renderToolbar();
			expect(screen.getByText('AlgoMotion')).toBeDefined();
		});

		it('renders File, Edit, View, Insert menus', () => {
			renderToolbar();
			expect(screen.getByText('File')).toBeDefined();
			expect(screen.getByText('Edit')).toBeDefined();
			expect(screen.getByText('View')).toBeDefined();
			expect(screen.getByText('Insert')).toBeDefined();
		});
	});

	describe('undo/redo buttons', () => {
		it('renders undo and redo buttons', () => {
			renderToolbar();
			expect(screen.getByLabelText('Undo')).toBeDefined();
			expect(screen.getByLabelText('Redo')).toBeDefined();
		});

		it('disables undo button when history stack is empty', () => {
			renderToolbar();
			const undoBtn = screen.getByLabelText('Undo');
			expect(undoBtn).toHaveProperty('disabled', true);
		});

		it('disables redo button when no redo entries exist', () => {
			renderToolbar();
			const redoBtn = screen.getByLabelText('Redo');
			expect(redoBtn).toHaveProperty('disabled', true);
		});
	});

	describe('zoom controls', () => {
		it('displays current zoom percentage', () => {
			renderToolbar();
			// Default zoom is 1 = 100%
			expect(screen.getByText('100%')).toBeDefined();
		});

		it('updates zoom display when camera zoom changes', () => {
			renderToolbar();
			act(() => {
				useSceneStore.getState().setCamera({ zoom: 2 });
			});
			expect(screen.getByText('200%')).toBeDefined();
		});
	});

	describe('playback controls', () => {
		it('renders play button', () => {
			renderToolbar();
			expect(screen.getByLabelText('Play')).toBeDefined();
		});

		it('renders pause button', () => {
			renderToolbar();
			expect(screen.getByLabelText('Pause')).toBeDefined();
		});

		it('renders stop button', () => {
			renderToolbar();
			expect(screen.getByLabelText('Stop')).toBeDefined();
		});
	});

	describe('speed control', () => {
		it('displays current speed', () => {
			renderToolbar();
			expect(screen.getByText('1x')).toBeDefined();
		});

		it('updates speed display when timeline speed changes', () => {
			renderToolbar();
			act(() => {
				useTimelineStore.getState().setSpeed(2);
			});
			expect(screen.getByText('2x')).toBeDefined();
		});
	});
});
