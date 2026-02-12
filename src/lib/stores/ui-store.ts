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
	activeBottomTab: BottomTab;
	activeLeftTab: LeftTab;
	activeRightTab: RightTab;
	gridVisible: boolean;
	snapToGrid: boolean;
	theme: ThemePreference;
	commandPaletteOpen: boolean;
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
	reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
	tool: 'select',
	panels: { left: true, right: true, bottom: true },
	panelSizes: { left: 18, right: 20, bottom: 35 },
	activeBottomTab: 'timeline',
	activeLeftTab: 'elements',
	activeRightTab: 'properties',
	gridVisible: true,
	snapToGrid: true,
	theme: 'dark',
	commandPaletteOpen: false,
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
						state.panels[panel] = !state.panels[panel];
					}),

				setPanelVisible: (panel, visible) =>
					set((state) => {
						state.panels[panel] = visible;
					}),

				setPanelSize: (panel, size) =>
					set((state) => {
						state.panelSizes[panel] = size;
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

				reset: () => set(initialState),
			})),
			{
				name: 'algomotion-ui',
				storage: createJSONStorage(() => dexieStorage),
				partialize: (state) => ({
					panels: state.panels,
					panelSizes: state.panelSizes,
					activeBottomTab: state.activeBottomTab,
					activeLeftTab: state.activeLeftTab,
					activeRightTab: state.activeRightTab,
					gridVisible: state.gridVisible,
					snapToGrid: state.snapToGrid,
					theme: state.theme,
				}),
			},
		),
		{ name: 'UIStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
