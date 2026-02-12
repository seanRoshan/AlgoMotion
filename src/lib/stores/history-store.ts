import { applyPatches, type Patch } from 'immer';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ActiveGroup, HistoryEntry } from '@/types/history';
import { registerHistoryPush, type SceneState, useSceneStore } from './scene-store';

export const HISTORY_BUFFER_SIZE = 200;

export interface HistoryState {
	entries: HistoryEntry[];
	cursor: number;
	activeGroup: ActiveGroup | null;
}

export interface HistoryActions {
	pushEntry: (description: string, patches: Patch[], inversePatches: Patch[]) => void;
	undo: () => void;
	redo: () => void;
	startGroup: (description: string) => void;
	endGroup: () => void;
	jumpToEntry: (targetIndex: number) => void;
	clearHistory: () => void;
}

export type HistoryStore = HistoryState & HistoryActions;

export const canUndo = (state: HistoryState): boolean => state.cursor > 0;
export const canRedo = (state: HistoryState): boolean => state.cursor < state.entries.length;

const initialState: HistoryState = {
	entries: [],
	cursor: 0,
	activeGroup: null,
};

function extractSceneState(): SceneState {
	const s = useSceneStore.getState();
	return {
		elements: s.elements,
		elementIds: s.elementIds,
		connections: s.connections,
		connectionIds: s.connectionIds,
		selectedIds: s.selectedIds,
		clipboard: s.clipboard,
		camera: s.camera,
	};
}

export const useHistoryStore = create<HistoryStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			pushEntry: (description, patches, inversePatches) => {
				if (patches.length === 0) return;

				const { activeGroup } = get();

				if (activeGroup) {
					set({
						activeGroup: {
							...activeGroup,
							patches: [...activeGroup.patches, ...patches],
							inversePatches: [...inversePatches, ...activeGroup.inversePatches],
						},
					});
					return;
				}

				const entry: HistoryEntry = {
					id: nanoid(),
					description,
					patches,
					inversePatches,
					timestamp: Date.now(),
				};

				set((state) => {
					const truncated = state.entries.slice(0, state.cursor);
					truncated.push(entry);

					if (truncated.length > HISTORY_BUFFER_SIZE) {
						truncated.shift();
					}

					return { entries: truncated, cursor: truncated.length };
				});
			},

			startGroup: (description) => {
				set({
					activeGroup: {
						groupId: nanoid(),
						description,
						patches: [],
						inversePatches: [],
						startTimestamp: Date.now(),
					},
				});
			},

			endGroup: () => {
				const { activeGroup } = get();
				if (!activeGroup) return;

				set({ activeGroup: null });

				if (activeGroup.patches.length === 0) return;

				const entry: HistoryEntry = {
					id: nanoid(),
					description: activeGroup.description,
					patches: activeGroup.patches,
					inversePatches: activeGroup.inversePatches,
					timestamp: Date.now(),
					groupId: activeGroup.groupId,
				};

				set((state) => {
					const truncated = state.entries.slice(0, state.cursor);
					truncated.push(entry);

					if (truncated.length > HISTORY_BUFFER_SIZE) {
						truncated.shift();
					}

					return { entries: truncated, cursor: truncated.length };
				});
			},

			undo: () => {
				// Auto-commit any active group before undoing
				const { activeGroup } = get();
				if (activeGroup) get().endGroup();

				const { cursor, entries } = get();
				if (cursor <= 0) return;

				const entry = entries[cursor - 1];
				if (!entry) return;

				const stateSnapshot = extractSceneState();
				const newState = applyPatches(stateSnapshot, entry.inversePatches);
				useSceneStore.setState(newState);

				set({ cursor: cursor - 1 });
			},

			redo: () => {
				// Auto-commit any active group before redoing
				const { activeGroup } = get();
				if (activeGroup) get().endGroup();

				const { cursor, entries } = get();
				if (cursor >= entries.length) return;

				const entry = entries[cursor];
				if (!entry) return;

				const stateSnapshot = extractSceneState();
				const newState = applyPatches(stateSnapshot, entry.patches);
				useSceneStore.setState(newState);

				set({ cursor: cursor + 1 });
			},

			jumpToEntry: (targetIndex) => {
				const { cursor, entries } = get();
				if (targetIndex === cursor) return;
				if (targetIndex < 0 || targetIndex > entries.length) return;

				// Accumulate all patches and apply in a single batch
				const allPatches: Patch[] = [];

				if (targetIndex < cursor) {
					for (let i = cursor - 1; i >= targetIndex; i--) {
						const entry = entries[i];
						if (entry) allPatches.push(...entry.inversePatches);
					}
				} else {
					for (let i = cursor; i < targetIndex; i++) {
						const entry = entries[i];
						if (entry) allPatches.push(...entry.patches);
					}
				}

				if (allPatches.length > 0) {
					const snapshot = extractSceneState();
					const newState = applyPatches(snapshot, allPatches);
					useSceneStore.setState(newState);
				}

				set({ cursor: targetIndex });
			},

			clearHistory: () => set(initialState),
		}),
		{ name: 'HistoryStore', enabled: process.env.NODE_ENV === 'development' },
	),
);

// Wire up the callback so scene store pushes history entries
registerHistoryPush((description, patches, inversePatches) => {
	useHistoryStore.getState().pushEntry(description, patches, inversePatches);
});
