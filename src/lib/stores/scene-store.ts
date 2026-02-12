import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CameraState, Connection, Position, SceneElement, Size } from '@/types';
import { dexieStorage } from './dexie-storage';

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

export const useSceneStore = create<SceneStore>()(
	devtools(
		persist(
			immer((set, get) => ({
				...initialState,

				addElement: (element) =>
					set((state) => {
						state.elements[element.id] = element;
						state.elementIds.push(element.id);
					}),

				removeElement: (id) =>
					set((state) => {
						delete state.elements[id];
						state.elementIds = state.elementIds.filter((eid) => eid !== id);
						state.selectedIds = state.selectedIds.filter((sid) => sid !== id);
						// Remove connections referencing this element
						state.connectionIds = state.connectionIds.filter((cid) => {
							const conn = state.connections[cid];
							if (conn && (conn.fromElementId === id || conn.toElementId === id)) {
								delete state.connections[cid];
								return false;
							}
							return true;
						});
					}),

				updateElement: (id, updates) =>
					set((state) => {
						const el = state.elements[id];
						if (el) {
							Object.assign(el, updates);
						}
					}),

				moveElement: (id, x, y) =>
					set((state) => {
						const el = state.elements[id];
						if (el) {
							el.position = { x, y };
						}
					}),

				addConnection: (connection) =>
					set((state) => {
						state.connections[connection.id] = connection;
						state.connectionIds.push(connection.id);
					}),

				removeConnection: (id) =>
					set((state) => {
						delete state.connections[id];
						state.connectionIds = state.connectionIds.filter((cid) => cid !== id);
					}),

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

				paste: (offsetX = 20, offsetY = 20) => {
					const { clipboard } = get();
					const pasted: SceneElement[] = [];
					const baseTimestamp = Date.now();
					set((state) => {
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
							state.elements[newId] = newEl;
							state.elementIds.push(newId);
							pasted.push(newEl);
						}
					});
					return pasted;
				},

				setCamera: (camera) =>
					set((state) => {
						Object.assign(state.camera, camera);
					}),

				selectAll: () =>
					set((state) => {
						state.selectedIds = state.elementIds.filter((id) => !state.elements[id]?.locked);
					}),

				deleteSelected: () =>
					set((state) => {
						const idsToDelete = [...state.selectedIds];
						for (const id of idsToDelete) {
							delete state.elements[id];
							state.elementIds = state.elementIds.filter((eid) => eid !== id);
							// Remove connections attached to this element
							state.connectionIds = state.connectionIds.filter((cid) => {
								const conn = state.connections[cid];
								if (conn && (conn.fromElementId === id || conn.toElementId === id)) {
									delete state.connections[cid];
									return false;
								}
								return true;
							});
						}
						state.selectedIds = [];
					}),

				duplicateSelected: () => {
					const { selectedIds, elements } = get();
					if (selectedIds.length === 0) return;
					const newIds: string[] = [];
					const timestamp = Date.now();
					set((state) => {
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
							state.elements[newId] = newEl;
							state.elementIds.push(newId);
							newIds.push(newId);
						}
						state.selectedIds = newIds;
					});
				},

				nudgeSelected: (dx, dy) =>
					set((state) => {
						for (const id of state.selectedIds) {
							const el = state.elements[id];
							if (el) {
								el.position.x += dx;
								el.position.y += dy;
							}
						}
					}),

				moveElements: (updates) =>
					set((state) => {
						for (const [id, pos] of Object.entries(updates)) {
							const el = state.elements[id];
							if (el) {
								el.position = { ...pos };
							}
						}
					}),

				resizeElement: (id, size, position) =>
					set((state) => {
						const el = state.elements[id];
						if (el) {
							el.size = { ...size };
							el.position = { ...position };
						}
					}),

				rotateElement: (id, rotation) =>
					set((state) => {
						const el = state.elements[id];
						if (el) {
							el.rotation = rotation;
						}
					}),

				reset: () => set(initialState),
			})),
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
