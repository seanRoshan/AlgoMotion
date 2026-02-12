/**
 * React hook for cloud sync functionality.
 *
 * Manages the SyncEngine lifecycle, listens for online/offline events,
 * and exposes sync state to components.
 *
 * Spec reference: Section 4 (Persistence)
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getDB } from '@/lib/stores/dexie-storage';
import { useSyncStore } from '@/lib/stores/sync-store';
import { createClient } from '@/lib/supabase/client';
import type {
	DbProjectInsert,
	DbProjectUpdate,
	DbSceneInsert,
	DbSceneUpdate,
} from '@/lib/supabase/database.types';
import type { SyncDeps } from '@/lib/sync/sync-engine';
import { SyncEngine } from '@/lib/sync/sync-engine';
import type { Project } from '@/types/project';

function createSyncDeps(): SyncDeps {
	const supabase = createClient();
	const cachedUserId: string | null = null;

	return {
		getProjects: async (userId: string) =>
			supabase
				.from('projects')
				.select('*')
				.eq('user_id', userId)
				.order('updated_at', { ascending: false }),

		createProject: async (project: DbProjectInsert) =>
			supabase.from('projects').insert(project).select().single(),

		updateProject: async (projectId: string, updates: DbProjectUpdate) =>
			supabase.from('projects').update(updates).eq('id', projectId).select().single(),

		deleteProject: async (projectId: string) =>
			supabase.from('projects').delete().eq('id', projectId),

		getScenes: async (projectId: string) =>
			supabase
				.from('scenes')
				.select('*')
				.eq('project_id', projectId)
				.order('scene_order', { ascending: true }),

		createScene: async (scene: DbSceneInsert) =>
			supabase.from('scenes').insert(scene).select().single(),

		updateScene: async (sceneId: string, updates: DbSceneUpdate) =>
			supabase.from('scenes').update(updates).eq('id', sceneId).select().single(),

		deleteScene: async (sceneId: string) => supabase.from('scenes').delete().eq('id', sceneId),

		getLocalProjects: async () => {
			const db = getDB();
			return db.projects.toArray();
		},

		saveLocalProject: async (project: Project) => {
			const db = getDB();
			await db.projects.put(project);
		},

		deleteLocalProject: async (projectId: string) => {
			const db = getDB();
			await db.projects.delete(projectId);
		},

		getUserId: () => cachedUserId,
	};
}

export interface UseSyncResult {
	status: string;
	connectivity: string;
	lastSyncedAt: string | null;
	error: string | null;
	quotaWarning: boolean;
	triggerSync: () => void;
}

export function useSync(): UseSyncResult {
	const engineRef = useRef<SyncEngine | null>(null);
	const status = useSyncStore((s) => s.status);
	const connectivity = useSyncStore((s) => s.connectivity);
	const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
	const error = useSyncStore((s) => s.error);
	const quotaWarning = useSyncStore((s) => s.quotaWarning);

	useEffect(() => {
		const deps = createSyncDeps();
		const engine = new SyncEngine(deps);
		engineRef.current = engine;

		// Set initial connectivity
		const online = typeof navigator !== 'undefined' && navigator.onLine;
		useSyncStore.getState().setConnectivity(online ? 'online' : 'offline');
		if (!online) {
			useSyncStore.getState().setStatus('offline');
		}

		const handleOnline = () => {
			useSyncStore.getState().setConnectivity('online');
			engine.sync();
		};
		const handleOffline = () => {
			useSyncStore.getState().setConnectivity('offline');
			useSyncStore.getState().setStatus('offline');
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Initial sync if online
		if (online) {
			engine.sync();
		}

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			engine.destroy();
			engineRef.current = null;
		};
	}, []);

	const triggerSync = useCallback(() => {
		engineRef.current?.sync();
	}, []);

	return {
		status,
		connectivity,
		lastSyncedAt,
		error,
		quotaWarning,
		triggerSync,
	};
}
