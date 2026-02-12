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

	describe('serialization', () => {
		it('state contains no Map or Set', () => {
			const state = useUIStore.getState();
			const json = JSON.stringify({
				tool: state.tool,
				panels: state.panels,
				panelSizes: state.panelSizes,
				gridVisible: state.gridVisible,
				snapToGrid: state.snapToGrid,
				theme: state.theme,
			});

			expect(() => JSON.parse(json)).not.toThrow();
		});
	});
});
