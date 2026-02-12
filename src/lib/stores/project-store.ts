import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Project, ProjectSettings } from '@/types';
import { dexieStorage } from './dexie-storage';

export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

export interface ProjectState {
	project: Project | null;
	isDirty: boolean;
	lastSaved: string | null;
	syncStatus: SyncStatus;
}

export interface ProjectActions {
	setProject: (project: Project) => void;
	updateProject: (updates: Partial<Project>) => void;
	updateSettings: (settings: Partial<ProjectSettings>) => void;
	markDirty: () => void;
	markSaved: () => void;
	setSyncStatus: (status: SyncStatus) => void;
	addScene: (sceneId: string) => void;
	removeScene: (sceneId: string) => void;
	reorderScenes: (sceneIds: string[]) => void;
	clearProject: () => void;
	reset: () => void;
}

export type ProjectStore = ProjectState & ProjectActions;

const initialState: ProjectState = {
	project: null,
	isDirty: false,
	lastSaved: null,
	syncStatus: 'offline',
};

export const useProjectStore = create<ProjectStore>()(
	devtools(
		persist(
			immer((set) => ({
				...initialState,

				setProject: (project) =>
					set((state) => {
						state.project = project;
						state.isDirty = false;
					}),

				updateProject: (updates) =>
					set((state) => {
						if (state.project) {
							Object.assign(state.project, updates);
							state.project.updatedAt = new Date().toISOString();
							state.isDirty = true;
						}
					}),

				updateSettings: (settings) =>
					set((state) => {
						if (state.project) {
							Object.assign(state.project.settings, settings);
							state.project.updatedAt = new Date().toISOString();
							state.isDirty = true;
						}
					}),

				markDirty: () =>
					set((state) => {
						state.isDirty = true;
					}),

				markSaved: () =>
					set((state) => {
						state.isDirty = false;
						state.lastSaved = new Date().toISOString();
						state.syncStatus = 'synced';
					}),

				setSyncStatus: (status) =>
					set((state) => {
						state.syncStatus = status;
					}),

				addScene: (sceneId) =>
					set((state) => {
						if (state.project && !state.project.sceneIds.includes(sceneId)) {
							state.project.sceneIds.push(sceneId);
							state.isDirty = true;
						}
					}),

				removeScene: (sceneId) =>
					set((state) => {
						if (state.project) {
							state.project.sceneIds = state.project.sceneIds.filter((id) => id !== sceneId);
							state.isDirty = true;
						}
					}),

				reorderScenes: (sceneIds) =>
					set((state) => {
						if (state.project) {
							state.project.sceneIds = sceneIds;
							state.isDirty = true;
						}
					}),

				clearProject: () =>
					set((state) => {
						state.project = null;
						state.isDirty = false;
						state.lastSaved = null;
					}),

				reset: () => set(initialState),
			})),
			{
				name: 'algomotion-project',
				storage: createJSONStorage(() => dexieStorage),
			},
		),
		{ name: 'ProjectStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
