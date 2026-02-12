import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '@/lib/stores/ui-store';
import { EditorLayout } from './editor-layout';

// Mock child components to isolate layout behavior
vi.mock('@/components/canvas/pixi-canvas', () => ({
	PixiCanvas: () => <div data-testid="pixi-canvas">Canvas</div>,
}));
vi.mock('@/components/panels/left-panel', () => ({
	LeftPanel: () => <div data-testid="left-panel-content">Left</div>,
}));
vi.mock('@/components/panels/right-panel', () => ({
	RightPanel: () => <div data-testid="right-panel-content">Right</div>,
}));
vi.mock('@/components/panels/bottom-panel', () => ({
	BottomPanel: () => <div data-testid="bottom-panel-content">Bottom</div>,
}));
vi.mock('./toolbar', () => ({
	Toolbar: () => <div data-testid="toolbar">Toolbar</div>,
}));

// react-resizable-panels requires ResizeObserver
class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('EditorLayout', () => {
	beforeEach(() => {
		useUIStore.getState().reset();
	});

	afterEach(() => {
		cleanup();
		useUIStore.getState().reset();
	});

	describe('rendering', () => {
		it('renders the toolbar', () => {
			render(<EditorLayout />);
			expect(screen.getByTestId('toolbar')).toBeDefined();
		});

		it('renders the canvas area', () => {
			render(<EditorLayout />);
			expect(screen.getByTestId('pixi-canvas')).toBeDefined();
		});

		it('renders left panel', () => {
			render(<EditorLayout />);
			expect(screen.getByTestId('left-panel-content')).toBeDefined();
		});

		it('renders right panel', () => {
			render(<EditorLayout />);
			expect(screen.getByTestId('right-panel-content')).toBeDefined();
		});

		it('renders bottom panel', () => {
			render(<EditorLayout />);
			expect(screen.getByTestId('bottom-panel-content')).toBeDefined();
		});
	});

	describe('store integration — panel sizes', () => {
		it('reads initial panel sizes from the UI store', () => {
			const { panelSizes } = useUIStore.getState();
			render(<EditorLayout />);
			// Default sizes from store: left=18, right=20, bottom=35
			expect(panelSizes.left).toBe(18);
			expect(panelSizes.right).toBe(20);
			expect(panelSizes.bottom).toBe(35);
		});

		it('uses custom panel sizes from store', () => {
			useUIStore.getState().setPanelSize('left', 25);
			const { panelSizes } = useUIStore.getState();
			expect(panelSizes.left).toBe(25);
		});
	});

	describe('store integration — panel visibility', () => {
		it('syncs left panel visibility toggle to store', () => {
			useUIStore.getState().togglePanel('left');
			expect(useUIStore.getState().panels.left).toBe(false);
		});

		it('syncs right panel visibility toggle to store', () => {
			useUIStore.getState().togglePanel('right');
			expect(useUIStore.getState().panels.right).toBe(false);
		});

		it('syncs bottom panel visibility toggle to store', () => {
			useUIStore.getState().togglePanel('bottom');
			expect(useUIStore.getState().panels.bottom).toBe(false);
		});
	});

	describe('keyboard shortcuts for panel toggle', () => {
		it('Ctrl+B toggles left panel visibility', () => {
			render(<EditorLayout />);
			expect(useUIStore.getState().panels.left).toBe(true);

			act(() => {
				fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
			});
			expect(useUIStore.getState().panels.left).toBe(false);

			act(() => {
				fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
			});
			expect(useUIStore.getState().panels.left).toBe(true);
		});

		it('Ctrl+I toggles right panel visibility', () => {
			render(<EditorLayout />);
			expect(useUIStore.getState().panels.right).toBe(true);

			act(() => {
				fireEvent.keyDown(document, { key: 'i', ctrlKey: true });
			});
			expect(useUIStore.getState().panels.right).toBe(false);
		});

		it('Ctrl+` toggles bottom panel visibility', () => {
			render(<EditorLayout />);
			expect(useUIStore.getState().panels.bottom).toBe(true);

			act(() => {
				fireEvent.keyDown(document, { key: '`', ctrlKey: true });
			});
			expect(useUIStore.getState().panels.bottom).toBe(false);
		});

		it('Cmd+B toggles left panel on Mac', () => {
			render(<EditorLayout />);
			act(() => {
				fireEvent.keyDown(document, { key: 'b', metaKey: true });
			});
			expect(useUIStore.getState().panels.left).toBe(false);
		});

		it('does not toggle panels without modifier key', () => {
			render(<EditorLayout />);
			act(() => {
				fireEvent.keyDown(document, { key: 'b' });
			});
			expect(useUIStore.getState().panels.left).toBe(true);
		});
	});

	describe('layout structure', () => {
		it('has correct flex column layout', () => {
			const { container } = render(<EditorLayout />);
			const outerDiv = container.firstElementChild;
			expect(outerDiv?.className).toContain('flex');
			expect(outerDiv?.className).toContain('flex-col');
			expect(outerDiv?.className).toContain('h-screen');
		});
	});

	describe('panel size preservation on toggle cycle', () => {
		it('preserves left panel size across collapse/expand cycle', () => {
			useUIStore.getState().setPanelSize('left', 22);
			render(<EditorLayout />);

			// Toggle off
			act(() => {
				useUIStore.getState().togglePanel('left');
			});
			expect(useUIStore.getState().panels.left).toBe(false);
			expect(useUIStore.getState().lastPanelSizes.left).toBe(22);

			// Toggle back on
			act(() => {
				useUIStore.getState().togglePanel('left');
			});
			expect(useUIStore.getState().panels.left).toBe(true);
			// panelSizes should be restored, not 0
			expect(useUIStore.getState().panelSizes.left).toBe(22);
		});

		it('preserves right panel size across collapse/expand cycle', () => {
			useUIStore.getState().setPanelSize('right', 25);
			render(<EditorLayout />);

			act(() => {
				useUIStore.getState().togglePanel('right');
			});
			expect(useUIStore.getState().lastPanelSizes.right).toBe(25);

			act(() => {
				useUIStore.getState().togglePanel('right');
			});
			expect(useUIStore.getState().panelSizes.right).toBe(25);
		});

		it('preserves bottom panel size across collapse/expand cycle', () => {
			useUIStore.getState().setPanelSize('bottom', 40);
			render(<EditorLayout />);

			act(() => {
				useUIStore.getState().togglePanel('bottom');
			});
			expect(useUIStore.getState().lastPanelSizes.bottom).toBe(40);

			act(() => {
				useUIStore.getState().togglePanel('bottom');
			});
			expect(useUIStore.getState().panelSizes.bottom).toBe(40);
		});

		it('keyboard shortcut Ctrl+B preserves panel size', () => {
			useUIStore.getState().setPanelSize('left', 22);
			render(<EditorLayout />);

			// Collapse via shortcut
			act(() => {
				fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
			});
			expect(useUIStore.getState().panels.left).toBe(false);
			expect(useUIStore.getState().lastPanelSizes.left).toBe(22);

			// Expand via shortcut
			act(() => {
				fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
			});
			expect(useUIStore.getState().panels.left).toBe(true);
			expect(useUIStore.getState().panelSizes.left).toBe(22);
		});
	});

	describe('resize callback does not corrupt sizes', () => {
		it('does not save panelSizes as 0 when panel is collapsed via toggle', () => {
			render(<EditorLayout />);

			act(() => {
				useUIStore.getState().togglePanel('left');
			});

			// Even after collapse, panelSizes should retain the last valid value
			// (not be overwritten to 0 by the resize callback)
			expect(useUIStore.getState().lastPanelSizes.left).toBeGreaterThan(0);
		});
	});

	describe('cleanup', () => {
		it('keyboard shortcuts stop working after unmount', () => {
			const { unmount } = render(<EditorLayout />);
			unmount();

			// After unmount, keyboard shortcuts should have no effect
			act(() => {
				fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
			});
			// Panel should still be true (default) since handler was removed
			expect(useUIStore.getState().panels.left).toBe(true);
		});
	});
});
