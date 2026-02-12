import { enablePatches, type Patch, produceWithPatches } from 'immer';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CameraState, Connection, Position, SceneElement, Size } from '@/types';
import { dexieStorage } from './dexie-storage';

enablePatches();

// ── History callback (set by history-store to avoid circular dependency) ──

type HistoryPushFn = (description: string, patches: Patch[], inversePatches: Patch[]) => void;
let _onHistoryPush: HistoryPushFn | undefined;

export function registerHistoryPush(fn: HistoryPushFn): void {
	_onHistoryPush = fn;
}

// ── State & Actions ──

export interface SceneState {
	elements: Record<string, SceneElement>;
	elementIds: string[];
	connections: Record<string, Connection>;
	connectionIds: string[];
	selectedIds: string[];
	clipboard: SceneElement[];
	camera: CameraState;
}

export interface SceneActions {
	addElement: (element: SceneElement) => void;
	removeElement: (id: string) => void;
	updateElement: (id: string, updates: Partial<SceneElement>) => void;
	moveElement: (id: string, x: number, y: number) => void;
	addConnection: (connection: Connection) => void;
	removeConnection: (id: string) => void;
	selectElement: (id: string) => void;
	deselectAll: () => void;
	selectMultiple: (ids: string[]) => void;
	toggleSelection: (id: string) => void;
	copySelected: () => void;
	paste: (offsetX?: number, offsetY?: number) => SceneElement[];
	setCamera: (camera: Partial<CameraState>) => void;
	selectAll: () => void;
	deleteSelected: () => void;
	duplicateSelected: () => void;
	nudgeSelected: (dx: number, dy: number) => void;
	moveElements: (updates: Record<string, Position>) => void;
	resizeElement: (id: string, size: Size, position: Position) => void;
	rotateElement: (id: string, rotation: number) => void;
	reset: () => void;
}

export type SceneStore = SceneState & SceneActions;

const initialState: SceneState = {
	elements: {},
	elementIds: [],
	connections: {},
	connectionIds: [],
	selectedIds: [],
	clipboard: [],
	camera: { x: 0, y: 0, zoom: 1 },
};

function extractState(store: SceneState): SceneState {
	return {
		elements: store.elements,
		elementIds: store.elementIds,
		connections: store.connections,
		connectionIds: store.connectionIds,
		selectedIds: store.selectedIds,
		clipboard: store.clipboard,
		camera: store.camera,
	};
}

export const useSceneStore = create<SceneStore>()(
	devtools(
		persist(
			immer((set, get) => {
				const undoableSet = (recipe: (draft: SceneState) => void, description: string) => {
					const snapshot = extractState(get());
					const [nextState, patches, inversePatches] = produceWithPatches(snapshot, recipe);
					set(nextState as SceneState);
					if (patches.length > 0 && _onHistoryPush) {
						_onHistoryPush(description, patches, inversePatches);
					}
				};

				return {
					...initialState,

					// ── Undoable actions ──

					addElement: (element) =>
						undoableSet((draft) => {
							draft.elements[element.id] = element;
							draft.elementIds.push(element.id);
						}, `Add ${element.type}`),

					removeElement: (id) =>
						undoableSet((draft) => {
							delete draft.elements[id];
							draft.elementIds = draft.elementIds.filter((eid) => eid !== id);
							draft.selectedIds = draft.selectedIds.filter((sid) => sid !== id);
							draft.connectionIds = draft.connectionIds.filter((cid) => {
								const conn = draft.connections[cid];
								if (conn && (conn.fromElementId === id || conn.toElementId === id)) {
									delete draft.connections[cid];
									return false;
								}
								return true;
							});
						}, 'Remove element'),

					updateElement: (id, updates) =>
						undoableSet((draft) => {
							const el = draft.elements[id];
							if (el) {
								Object.assign(el, updates);
							}
						}, 'Update element'),

					moveElement: (id, x, y) =>
						undoableSet((draft) => {
							const el = draft.elements[id];
							if (el) {
								el.position = { x, y };
							}
						}, 'Move element'),

					addConnection: (connection) =>
						undoableSet((draft) => {
							draft.connections[connection.id] = connection;
							draft.connectionIds.push(connection.id);
						}, 'Add connection'),

					removeConnection: (id) =>
						undoableSet((draft) => {
							delete draft.connections[id];
							draft.connectionIds = draft.connectionIds.filter((cid) => cid !== id);
						}, 'Remove connection'),

					paste: (offsetX = 20, offsetY = 20) => {
						const { clipboard } = get();
						const pasted: SceneElement[] = [];
						const baseTimestamp = Date.now();
						undoableSet((draft) => {
							for (let i = 0; i < clipboard.length; i++) {
								const el = clipboard[i];
								if (!el) continue;
								const newId = `${el.id}-copy-${baseTimestamp}-${i}`;
								const newEl: SceneElement = {
									...el,
									id: newId,
									position: {
										x: el.position.x + offsetX,
										y: el.position.y + offsetY,
									},
								};
								draft.elements[newId] = newEl;
								draft.elementIds.push(newId);
								pasted.push(newEl);
							}
						}, 'Paste elements');
						return pasted;
					},

					deleteSelected: () =>
						undoableSet((draft) => {
							const idsToDelete = [...draft.selectedIds];
							for (const id of idsToDelete) {
								delete draft.elements[id];
								draft.elementIds = draft.elementIds.filter((eid) => eid !== id);
								draft.connectionIds = draft.connectionIds.filter((cid) => {
									const conn = draft.connections[cid];
									if (conn && (conn.fromElementId === id || conn.toElementId === id)) {
										delete draft.connections[cid];
										return false;
									}
									return true;
								});
							}
							draft.selectedIds = [];
						}, 'Delete elements'),

					duplicateSelected: () => {
						const { selectedIds, elements } = get();
						if (selectedIds.length === 0) return;
						const timestamp = Date.now();
						undoableSet((draft) => {
							const newIds: string[] = [];
							for (let i = 0; i < selectedIds.length; i++) {
								const origId = selectedIds[i];
								if (!origId) continue;
								const orig = elements[origId];
								if (!orig) continue;
								const newId = `${origId}-dup-${timestamp}-${i}`;
								const newEl: SceneElement = {
									...orig,
									id: newId,
									position: {
										x: orig.position.x + 20,
										y: orig.position.y + 20,
									},
								};
								draft.elements[newId] = newEl;
								draft.elementIds.push(newId);
								newIds.push(newId);
							}
							draft.selectedIds = newIds;
						}, 'Duplicate elements');
					},

					nudgeSelected: (dx, dy) =>
						undoableSet((draft) => {
							for (const id of draft.selectedIds) {
								const el = draft.elements[id];
								if (el) {
									el.position.x += dx;
									el.position.y += dy;
								}
							}
						}, 'Nudge elements'),

					moveElements: (updates) =>
						undoableSet((draft) => {
							for (const [id, pos] of Object.entries(updates)) {
								const el = draft.elements[id];
								if (el) {
									el.position = { ...pos };
								}
							}
						}, 'Move elements'),

					resizeElement: (id, size, position) =>
						undoableSet((draft) => {
							const el = draft.elements[id];
							if (el) {
								el.size = { ...size };
								el.position = { ...position };
							}
						}, 'Resize element'),

					rotateElement: (id, rotation) =>
						undoableSet((draft) => {
							const el = draft.elements[id];
							if (el) {
								el.rotation = rotation;
							}
						}, 'Rotate element'),

					// ── Non-undoable actions ──

					selectElement: (id) =>
						set((state) => {
							state.selectedIds = [id];
						}),

					deselectAll: () =>
						set((state) => {
							state.selectedIds = [];
						}),

					selectMultiple: (ids) =>
						set((state) => {
							state.selectedIds = ids;
						}),

					toggleSelection: (id) =>
						set((state) => {
							const idx = state.selectedIds.indexOf(id);
							if (idx >= 0) {
								state.selectedIds.splice(idx, 1);
							} else {
								state.selectedIds.push(id);
							}
						}),

					copySelected: () =>
						set((state) => {
							const { elements, selectedIds } = state;
							state.clipboard = selectedIds
								.map((id) => elements[id])
								.filter((el): el is SceneElement => el !== undefined);
						}),

					setCamera: (camera) =>
						set((state) => {
							Object.assign(state.camera, camera);
						}),

					selectAll: () =>
						set((state) => {
							state.selectedIds = state.elementIds.filter((id) => !state.elements[id]?.locked);
						}),

					reset: () => set(initialState),
				};
			}),
			{
				name: 'algomotion-scene',
				storage: createJSONStorage(() => dexieStorage),
				partialize: (state) => ({
					elements: state.elements,
					elementIds: state.elementIds,
					connections: state.connections,
					connectionIds: state.connectionIds,
					camera: state.camera,
				}),
			},
		),
		{ name: 'SceneStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
