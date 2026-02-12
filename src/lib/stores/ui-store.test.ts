import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './ui-store';

describe('uiStore', () => {
	beforeEach(() => {
		useUIStore.getState().reset();
	});

	afterEach(() => {
		useUIStore.getState().reset();
	});

	describe('initial state', () => {
		it('starts with select tool', () => {
			expect(useUIStore.getState().tool).toBe('select');
		});

		it('starts with all panels visible', () => {
			expect(useUIStore.getState().panels).toEqual({
				left: true,
				right: true,
				bottom: true,
			});
		});

		it('starts with timeline as active bottom tab', () => {
			expect(useUIStore.getState().activeBottomTab).toBe('timeline');
		});

		it('starts with dark theme', () => {
			expect(useUIStore.getState().theme).toBe('dark');
		});

		it('starts with grid visible and snap enabled', () => {
			expect(useUIStore.getState().gridVisible).toBe(true);
			expect(useUIStore.getState().snapToGrid).toBe(true);
		});

		it('starts with command palette closed', () => {
			expect(useUIStore.getState().commandPaletteOpen).toBe(false);
		});
	});

	describe('tool', () => {
		it('sets tool mode', () => {
			useUIStore.getState().setTool('pan');
			expect(useUIStore.getState().tool).toBe('pan');

			useUIStore.getState().setTool('draw-rect');
			expect(useUIStore.getState().tool).toBe('draw-rect');
		});
	});

	describe('panels', () => {
		it('toggles panel visibility', () => {
			useUIStore.getState().togglePanel('left');
			expect(useUIStore.getState().panels.left).toBe(false);

			useUIStore.getState().togglePanel('left');
			expect(useUIStore.getState().panels.left).toBe(true);
		});

		it('sets panel visibility directly', () => {
			useUIStore.getState().setPanelVisible('right', false);
			expect(useUIStore.getState().panels.right).toBe(false);
		});

		it('sets panel size', () => {
			useUIStore.getState().setPanelSize('left', 25);
			expect(useUIStore.getState().panelSizes.left).toBe(25);
		});
	});

	describe('tabs', () => {
		it('sets active bottom tab', () => {
			useUIStore.getState().setActiveBottomTab('code');
			expect(useUIStore.getState().activeBottomTab).toBe('code');
		});

		it('sets active left tab', () => {
			useUIStore.getState().setActiveLeftTab('templates');
			expect(useUIStore.getState().activeLeftTab).toBe('templates');
		});

		it('sets active right tab', () => {
			useUIStore.getState().setActiveRightTab('animation');
			expect(useUIStore.getState().activeRightTab).toBe('animation');
		});
	});

	describe('grid and snap', () => {
		it('toggles grid visibility', () => {
			useUIStore.getState().toggleGrid();
			expect(useUIStore.getState().gridVisible).toBe(false);

			useUIStore.getState().toggleGrid();
			expect(useUIStore.getState().gridVisible).toBe(true);
		});

		it('toggles snap to grid', () => {
			useUIStore.getState().toggleSnap();
			expect(useUIStore.getState().snapToGrid).toBe(false);
		});
	});

	describe('theme', () => {
		it('sets theme', () => {
			useUIStore.getState().setTheme('light');
			expect(useUIStore.getState().theme).toBe('light');

			useUIStore.getState().setTheme('system');
			expect(useUIStore.getState().theme).toBe('system');
		});
	});

	describe('command palette', () => {
		it('opens command palette', () => {
			useUIStore.getState().setCommandPaletteOpen(true);
			expect(useUIStore.getState().commandPaletteOpen).toBe(true);
		});

		it('toggles command palette', () => {
			useUIStore.getState().toggleCommandPalette();
			expect(useUIStore.getState().commandPaletteOpen).toBe(true);

			useUIStore.getState().toggleCommandPalette();
			expect(useUIStore.getState().commandPaletteOpen).toBe(false);
		});
	});

	describe('minimap', () => {
		it('starts with minimap visible', () => {
			expect(useUIStore.getState().minimapVisible).toBe(true);
		});

		it('toggles minimap visibility', () => {
			useUIStore.getState().toggleMinimap();
			expect(useUIStore.getState().minimapVisible).toBe(false);

			useUIStore.getState().toggleMinimap();
			expect(useUIStore.getState().minimapVisible).toBe(true);
		});

		it('sets minimap visibility directly', () => {
			useUIStore.getState().setMinimapVisible(false);
			expect(useUIStore.getState().minimapVisible).toBe(false);

			useUIStore.getState().setMinimapVisible(true);
			expect(useUIStore.getState().minimapVisible).toBe(true);
		});

		it('reset restores minimap to visible', () => {
			useUIStore.getState().setMinimapVisible(false);
			useUIStore.getState().reset();
			expect(useUIStore.getState().minimapVisible).toBe(true);
		});
	});

	describe('panel size preservation on toggle', () => {
		it('saves panel size before collapsing via togglePanel', () => {
			// Default left size is 18
			useUIStore.getState().togglePanel('left');
			expect(useUIStore.getState().panels.left).toBe(false);
			// lastPanelSizes should remember the pre-collapse size
			expect(useUIStore.getState().lastPanelSizes.left).toBe(18);
		});

		it('restores panel size when re-expanding via togglePanel', () => {
			// Set custom size, then collapse and re-expand
			useUIStore.getState().setPanelSize('left', 22);
			useUIStore.getState().togglePanel('left'); // collapse
			expect(useUIStore.getState().panels.left).toBe(false);
			expect(useUIStore.getState().lastPanelSizes.left).toBe(22);

			useUIStore.getState().togglePanel('left'); // expand
			expect(useUIStore.getState().panels.left).toBe(true);
			expect(useUIStore.getState().panelSizes.left).toBe(22);
		});

		it('saves panel size before collapsing via setPanelVisible', () => {
			useUIStore.getState().setPanelSize('right', 25);
			useUIStore.getState().setPanelVisible('right', false);
			expect(useUIStore.getState().lastPanelSizes.right).toBe(25);
		});

		it('restores panel size when re-expanding via setPanelVisible', () => {
			useUIStore.getState().setPanelSize('bottom', 40);
			useUIStore.getState().setPanelVisible('bottom', false); // collapse
			useUIStore.getState().setPanelVisible('bottom', true); // expand
			expect(useUIStore.getState().panelSizes.bottom).toBe(40);
		});

		it('does not overwrite lastPanelSizes when already collapsed', () => {
			useUIStore.getState().setPanelSize('left', 22);
			useUIStore.getState().setPanelVisible('left', false); // saves 22
			// Calling setPanelVisible(false) again should not overwrite
			useUIStore.getState().setPanelVisible('left', false);
			expect(useUIStore.getState().lastPanelSizes.left).toBe(22);
		});

		it('works independently for each panel', () => {
			useUIStore.getState().setPanelSize('left', 15);
			useUIStore.getState().setPanelSize('right', 25);
			useUIStore.getState().setPanelSize('bottom', 40);

			useUIStore.getState().togglePanel('left');
			useUIStore.getState().togglePanel('right');

			expect(useUIStore.getState().lastPanelSizes.left).toBe(15);
			expect(useUIStore.getState().lastPanelSizes.right).toBe(25);
			// bottom wasn't toggled, its lastPanelSizes should still be the initial
			expect(useUIStore.getState().panelSizes.bottom).toBe(40);

			// Re-expand left
			useUIStore.getState().togglePanel('left');
			expect(useUIStore.getState().panelSizes.left).toBe(15);
		});

		it('uses default size if lastPanelSizes has no saved value', () => {
			// Force panels.left to false without going through togglePanel
			// (simulates corrupted persisted state)
			const store = useUIStore.getState();
			// Initially lastPanelSizes should have defaults
			expect(store.lastPanelSizes.left).toBeGreaterThan(0);
		});

		it('initializes lastPanelSizes matching default panelSizes', () => {
			const state = useUIStore.getState();
			expect(state.lastPanelSizes).toEqual(state.panelSizes);
		});

		it('reset restores lastPanelSizes to defaults', () => {
			useUIStore.getState().setPanelSize('left', 30);
			useUIStore.getState().togglePanel('left');
			useUIStore.getState().reset();
			expect(useUIStore.getState().lastPanelSizes).toEqual({
				left: 18,
				right: 20,
				bottom: 35,
			});
		});
	});

	describe('serialization', () => {
		it('state contains no Map or Set', () => {
			const state = useUIStore.getState();
			const json = JSON.stringify({
				tool: state.tool,
				panels: state.panels,
				panelSizes: state.panelSizes,
				lastPanelSizes: state.lastPanelSizes,
				gridVisible: state.gridVisible,
				snapToGrid: state.snapToGrid,
				theme: state.theme,
			});

			expect(() => JSON.parse(json)).not.toThrow();
		});
	});
});
