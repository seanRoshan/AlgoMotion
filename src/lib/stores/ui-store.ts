import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ThemePreference } from '@/types';
import { dexieStorage } from './dexie-storage';

export type ToolMode =
	| 'select'
	| 'pan'
	| 'draw-rect'
	| 'draw-ellipse'
	| 'draw-text'
	| 'draw-arrow'
	| 'draw-line';

export type BottomTab = 'timeline' | 'code' | 'console' | 'dsl';
export type LeftTab = 'elements' | 'templates' | 'layers';
export type RightTab = 'properties' | 'animation';

export interface PanelVisibility {
	left: boolean;
	right: boolean;
	bottom: boolean;
}

export interface PanelSizes {
	left: number;
	right: number;
	bottom: number;
}

export interface UIState {
	tool: ToolMode;
	panels: PanelVisibility;
	panelSizes: PanelSizes;
	lastPanelSizes: PanelSizes;
	activeBottomTab: BottomTab;
	activeLeftTab: LeftTab;
	activeRightTab: RightTab;
	gridVisible: boolean;
	snapToGrid: boolean;
	theme: ThemePreference;
	commandPaletteOpen: boolean;
	minimapVisible: boolean;
}

export interface UIActions {
	setTool: (tool: ToolMode) => void;
	togglePanel: (panel: keyof PanelVisibility) => void;
	setPanelVisible: (panel: keyof PanelVisibility, visible: boolean) => void;
	setPanelSize: (panel: keyof PanelSizes, size: number) => void;
	setActiveBottomTab: (tab: BottomTab) => void;
	setActiveLeftTab: (tab: LeftTab) => void;
	setActiveRightTab: (tab: RightTab) => void;
	toggleGrid: () => void;
	toggleSnap: () => void;
	setTheme: (theme: ThemePreference) => void;
	setCommandPaletteOpen: (open: boolean) => void;
	toggleCommandPalette: () => void;
	toggleMinimap: () => void;
	setMinimapVisible: (visible: boolean) => void;
	reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
	tool: 'select',
	panels: { left: true, right: true, bottom: true },
	panelSizes: { left: 18, right: 20, bottom: 35 },
	lastPanelSizes: { left: 18, right: 20, bottom: 35 },
	activeBottomTab: 'timeline',
	activeLeftTab: 'elements',
	activeRightTab: 'properties',
	gridVisible: true,
	snapToGrid: true,
	theme: 'dark',
	commandPaletteOpen: false,
	minimapVisible: true,
};

export const useUIStore = create<UIStore>()(
	devtools(
		persist(
			immer((set) => ({
				...initialState,

				setTool: (tool) =>
					set((state) => {
						state.tool = tool;
					}),

				togglePanel: (panel) =>
					set((state) => {
						if (state.panels[panel]) {
							// Collapsing: save current size before hiding
							state.lastPanelSizes[panel] = state.panelSizes[panel];
						} else {
							// Expanding: restore saved size
							state.panelSizes[panel] = state.lastPanelSizes[panel];
						}
						state.panels[panel] = !state.panels[panel];
					}),

				setPanelVisible: (panel, visible) =>
					set((state) => {
						if (!visible && state.panels[panel]) {
							// Collapsing: save current size
							state.lastPanelSizes[panel] = state.panelSizes[panel];
						} else if (visible && !state.panels[panel]) {
							// Expanding: restore saved size
							state.panelSizes[panel] = state.lastPanelSizes[panel];
						}
						state.panels[panel] = visible;
					}),

				setPanelSize: (panel, size) =>
					set((state) => {
						state.panelSizes[panel] = size;
						// Keep lastPanelSizes in sync with user-set sizes so
						// toggle always restores the most recent valid size
						if (size > 0) {
							state.lastPanelSizes[panel] = size;
						}
					}),

				setActiveBottomTab: (tab) =>
					set((state) => {
						state.activeBottomTab = tab;
					}),

				setActiveLeftTab: (tab) =>
					set((state) => {
						state.activeLeftTab = tab;
					}),

				setActiveRightTab: (tab) =>
					set((state) => {
						state.activeRightTab = tab;
					}),

				toggleGrid: () =>
					set((state) => {
						state.gridVisible = !state.gridVisible;
					}),

				toggleSnap: () =>
					set((state) => {
						state.snapToGrid = !state.snapToGrid;
					}),

				setTheme: (theme) =>
					set((state) => {
						state.theme = theme;
					}),

				setCommandPaletteOpen: (open) =>
					set((state) => {
						state.commandPaletteOpen = open;
					}),

				toggleCommandPalette: () =>
					set((state) => {
						state.commandPaletteOpen = !state.commandPaletteOpen;
					}),

				toggleMinimap: () =>
					set((state) => {
						state.minimapVisible = !state.minimapVisible;
					}),

				setMinimapVisible: (visible) =>
					set((state) => {
						state.minimapVisible = visible;
					}),

				reset: () => set(initialState),
			})),
			{
				name: 'algomotion-ui',
				storage: createJSONStorage(() => dexieStorage),
				partialize: (state) => ({
					panels: state.panels,
					panelSizes: state.panelSizes,
					lastPanelSizes: state.lastPanelSizes,
					activeBottomTab: state.activeBottomTab,
					activeLeftTab: state.activeLeftTab,
					activeRightTab: state.activeRightTab,
					gridVisible: state.gridVisible,
					snapToGrid: state.snapToGrid,
					theme: state.theme,
					minimapVisible: state.minimapVisible,
				}),
				merge: (persisted, current) => {
					const merged = { ...current, ...(persisted as Partial<UIState>) };
					// Reject corrupted panel sizes (must be reasonable percentages)
					const sizes = merged.panelSizes;
					if (sizes.left < 5 || sizes.right < 5 || sizes.bottom < 5) {
						merged.panelSizes = { ...initialState.panelSizes };
					}
					// Ensure lastPanelSizes exists and has valid values
					if (
						!merged.lastPanelSizes ||
						merged.lastPanelSizes.left < 5 ||
						merged.lastPanelSizes.right < 5 ||
						merged.lastPanelSizes.bottom < 5
					) {
						merged.lastPanelSizes = { ...initialState.panelSizes };
					}
					return merged;
				},
			},
		),
		{ name: 'UIStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
