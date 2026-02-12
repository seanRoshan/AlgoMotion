/**
 * Cloud sync engine: IndexedDB ↔ Supabase.
 *
 * Handles two-way sync with last-write-wins conflict resolution,
 * debounced pushes, and offline queue management.
 *
 * Spec reference: Section 4 (Persistence)
 */

import { useSyncStore } from '@/lib/stores/sync-store';
import type {
	DbProject,
	DbProjectInsert,
	DbProjectUpdate,
	DbScene,
	DbSceneInsert,
	DbSceneUpdate,
} from '@/lib/supabase/database.types';
import type { Project } from '@/types/project';
import { dbToProject, projectToDbInsert, projectToDbUpdate } from './entity-mapper';
import type { ConflictResult, SyncConfig } from './sync-types';
import { DEFAULT_SYNC_CONFIG } from './sync-types';

/**
 * Dependency injection interface for testability.
 * Wraps Supabase client + local storage operations.
 */
export interface SyncDeps {
	getProjects: (userId: string) => Promise<{ data: DbProject[] | null; error: unknown }>;
	createProject: (project: DbProjectInsert) => Promise<{ data: DbProject | null; error: unknown }>;
	updateProject: (
		projectId: string,
		updates: DbProjectUpdate,
	) => Promise<{ data: DbProject | null; error: unknown }>;
	deleteProject: (projectId: string) => Promise<{ data: unknown; error: unknown }>;
	getScenes: (projectId: string) => Promise<{ data: DbScene[] | null; error: unknown }>;
	createScene: (scene: DbSceneInsert) => Promise<{ data: DbScene | null; error: unknown }>;
	updateScene: (
		sceneId: string,
		updates: DbSceneUpdate,
	) => Promise<{ data: DbScene | null; error: unknown }>;
	deleteScene: (sceneId: string) => Promise<{ data: unknown; error: unknown }>;
	getLocalProjects: () => Promise<Project[]>;
	saveLocalProject: (project: Project) => Promise<void>;
	deleteLocalProject: (projectId: string) => Promise<void>;
	getUserId: () => string | null;
}

export class SyncEngine {
	private deps: SyncDeps;
	private config: SyncConfig;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private destroyed = false;

	constructor(deps: SyncDeps, config?: SyncConfig) {
		this.deps = deps;
		this.config = config ?? DEFAULT_SYNC_CONFIG;
	}

	/**
	 * Last-write-wins conflict resolution.
	 * Compares ISO timestamps; remote wins on tie.
	 */
	resolveConflict(localTimestamp: string, remoteTimestamp: string): ConflictResult {
		const localDate = new Date(localTimestamp).getTime();
		const remoteDate = new Date(remoteTimestamp).getTime();
		const winner = localDate > remoteDate ? 'local' : 'remote';

		return {
			winner,
			localTimestamp,
			remoteTimestamp,
		};
	}

	/**
	 * Push a local project to Supabase.
	 * Creates if not found remotely; updates if local is newer.
	 */
	async pushProject(project: Project): Promise<void> {
		const userId = this.deps.getUserId();
		if (!userId) return;

		const { data: remoteProjects } = await this.deps.getProjects(userId);
		const remote = remoteProjects?.find((p) => p.id === project.id);

		if (!remote) {
			await this.deps.createProject(projectToDbInsert(project));
			return;
		}

		const { winner } = this.resolveConflict(project.updatedAt, remote.updated_at);
		if (winner === 'local') {
			await this.deps.updateProject(project.id, projectToDbUpdate(project));
		}
	}

	/**
	 * Pull remote projects to local storage.
	 * Only overwrites when remote is newer.
	 */
	async pullProjects(): Promise<void> {
		const userId = this.deps.getUserId();
		if (!userId) return;

		const { data: remoteProjects } = await this.deps.getProjects(userId);
		if (!remoteProjects) return;

		const localProjects = await this.deps.getLocalProjects();
		const localMap = new Map(localProjects.map((p) => [p.id, p]));

		for (const remote of remoteProjects) {
			const local = localMap.get(remote.id);

			if (!local) {
				const { data: remoteScenes } = await this.deps.getScenes(remote.id);
				const sceneIds = remoteScenes?.map((s) => s.id) ?? [];
				await this.deps.saveLocalProject(dbToProject(remote, sceneIds));
				continue;
			}

			const { winner } = this.resolveConflict(local.updatedAt, remote.updated_at);
			if (winner === 'remote') {
				const { data: remoteScenes } = await this.deps.getScenes(remote.id);
				const sceneIds = remoteScenes?.map((s) => s.id) ?? [];
				await this.deps.saveLocalProject(dbToProject(remote, sceneIds));
			}
		}
	}

	/**
	 * Full bidirectional sync: push local → pull remote.
	 */
	async sync(): Promise<void> {
		if (this.destroyed) return;

		const store = useSyncStore.getState();
		store.setStatus('syncing');

		try {
			// Push all local projects
			const localProjects = await this.deps.getLocalProjects();
			for (const project of localProjects) {
				await this.pushProject(project);
			}

			// Pull remote changes
			await this.pullProjects();

			useSyncStore.getState().setStatus('synced');
			useSyncStore.getState().setLastSyncedAt(new Date().toISOString());
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown sync error';
			useSyncStore.getState().setError(message);
		}
	}

	/**
	 * Schedule a debounced sync (2s default after last call).
	 */
	scheduleDebouncedSync(): void {
		if (this.destroyed) return;

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.sync();
		}, this.config.debounceMs);
	}

	/**
	 * Clean up timers and mark engine as destroyed.
	 */
	destroy(): void {
		this.destroyed = true;
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}
}
