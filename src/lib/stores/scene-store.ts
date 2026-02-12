import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CameraState, Connection, SceneElement } from '@/types';
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
						for (const cid of state.connectionIds) {
							const conn = state.connections[cid];
							if (conn && (conn.fromElementId === id || conn.toElementId === id)) {
								delete state.connections[cid];
								state.connectionIds = state.connectionIds.filter((c) => c !== cid);
							}
						}
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
					set((state) => {
						for (const el of clipboard) {
							const newId = `${el.id}-copy-${Date.now()}`;
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
