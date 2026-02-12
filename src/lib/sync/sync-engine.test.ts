/**
 * Tests for the cloud sync engine.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/lib/stores/sync-store';
import type { DbProject, DbScene } from '@/lib/supabase/database.types';
import type { Project } from '@/types/project';
import type { SyncDeps } from './sync-engine';
import { SyncEngine } from './sync-engine';

function createMockProject(overrides: Partial<Project> = {}): Project {
	return {
		id: 'proj-1',
		name: 'Test',
		description: '',
		thumbnail: '',
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-02T00:00:00Z',
		userId: 'user-1',
		isPublic: false,
		tags: [],
		settings: {
			canvasWidth: 1920,
			canvasHeight: 1080,
			backgroundColor: '#1a1a2e',
			backgroundStyle: 'grid',
			gridSize: 20,
			snapToGrid: true,
			fps: 30,
			defaultEasing: 'power2.inOut',
			theme: 'dark',
		},
		sceneIds: [],
		...overrides,
	};
}

function createMockDbProject(overrides: Partial<DbProject> = {}): DbProject {
	return {
		id: 'proj-1',
		user_id: 'user-1',
		name: 'Test',
		description: '',
		thumbnail_url: null,
		is_public: false,
		tags: [],
		settings: {},
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T12:00:00Z',
		...overrides,
	};
}

function createMockDeps(overrides: Partial<SyncDeps> = {}): SyncDeps {
	return {
		getProjects: vi.fn(async () => ({ data: [], error: null })),
		createProject: vi.fn(async () => ({ data: createMockDbProject(), error: null })),
		updateProject: vi.fn(async () => ({ data: createMockDbProject(), error: null })),
		deleteProject: vi.fn(async () => ({ data: null, error: null })),
		getScenes: vi.fn(async () => ({ data: [], error: null })),
		createScene: vi.fn(async () => ({
			data: {
				id: 'scene-1',
				project_id: 'proj-1',
				name: 'Scene',
				scene_order: 0,
				data: {},
				code_source: null,
				duration: 5,
				created_at: '2026-01-01T00:00:00Z',
				updated_at: '2026-01-01T00:00:00Z',
			} satisfies DbScene,
			error: null,
		})),
		updateScene: vi.fn(async () => ({
			data: {
				id: 'scene-1',
				project_id: 'proj-1',
				name: 'Scene',
				scene_order: 0,
				data: {},
				code_source: null,
				duration: 5,
				created_at: '2026-01-01T00:00:00Z',
				updated_at: '2026-01-01T00:00:00Z',
			} satisfies DbScene,
			error: null,
		})),
		deleteScene: vi.fn(async () => ({ data: null, error: null })),
		getLocalProjects: vi.fn(async () => []),
		saveLocalProject: vi.fn(async () => {}),
		deleteLocalProject: vi.fn(async () => {}),
		getUserId: vi.fn(() => 'user-1'),
		...overrides,
	};
}

describe('SyncEngine', () => {
	let engine: SyncEngine;

	beforeEach(() => {
		useSyncStore.getState().reset();
	});

	afterEach(() => {
		engine?.destroy();
	});

	it('initializes with offline status', () => {
		engine = new SyncEngine(createMockDeps());
		expect(useSyncStore.getState().status).toBe('offline');
	});

	it('resolveConflict returns local when local is newer', () => {
		engine = new SyncEngine(createMockDeps());
		const result = engine.resolveConflict('2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z');
		expect(result.winner).toBe('local');
	});

	it('resolveConflict returns remote when remote is newer', () => {
		engine = new SyncEngine(createMockDeps());
		const result = engine.resolveConflict('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z');
		expect(result.winner).toBe('remote');
	});

	it('resolveConflict returns remote on equal timestamps', () => {
		engine = new SyncEngine(createMockDeps());
		const result = engine.resolveConflict('2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
		expect(result.winner).toBe('remote');
	});

	it('pushProject creates project in remote when not found', async () => {
		const deps = createMockDeps({
			getProjects: vi.fn(async () => ({ data: [], error: null })),
		});
		engine = new SyncEngine(deps);

		await engine.pushProject(createMockProject());

		expect(deps.createProject).toHaveBeenCalled();
	});

	it('pushProject updates project in remote when found and local is newer', async () => {
		const deps = createMockDeps({
			getProjects: vi.fn(async () => ({
				data: [createMockDbProject({ updated_at: '2026-01-01T00:00:00Z' })],
				error: null,
			})),
		});
		engine = new SyncEngine(deps);

		await engine.pushProject(createMockProject({ updatedAt: '2026-01-02T00:00:00Z' }));

		expect(deps.updateProject).toHaveBeenCalled();
	});

	it('pushProject skips update when remote is newer', async () => {
		const deps = createMockDeps({
			getProjects: vi.fn(async () => ({
				data: [createMockDbProject({ updated_at: '2026-01-03T00:00:00Z' })],
				error: null,
			})),
		});
		engine = new SyncEngine(deps);

		await engine.pushProject(createMockProject({ updatedAt: '2026-01-01T00:00:00Z' }));

		expect(deps.updateProject).not.toHaveBeenCalled();
		expect(deps.createProject).not.toHaveBeenCalled();
	});

	it('pullProjects saves remote projects locally', async () => {
		const remoteProject = createMockDbProject({
			id: 'remote-1',
			updated_at: '2026-01-05T00:00:00Z',
		});
		const deps = createMockDeps({
			getProjects: vi.fn(async () => ({ data: [remoteProject], error: null })),
			getScenes: vi.fn(async () => ({ data: [], error: null })),
			getLocalProjects: vi.fn(async () => []),
		});
		engine = new SyncEngine(deps);

		await engine.pullProjects();

		expect(deps.saveLocalProject).toHaveBeenCalled();
	});

	it('pullProjects skips when local is newer', async () => {
		const remoteProject = createMockDbProject({
			id: 'proj-1',
			updated_at: '2026-01-01T00:00:00Z',
		});
		const localProject = createMockProject({
			id: 'proj-1',
			updatedAt: '2026-01-05T00:00:00Z',
		});
		const deps = createMockDeps({
			getProjects: vi.fn(async () => ({ data: [remoteProject], error: null })),
			getScenes: vi.fn(async () => ({ data: [], error: null })),
			getLocalProjects: vi.fn(async () => [localProject]),
		});
		engine = new SyncEngine(deps);

		await engine.pullProjects();

		expect(deps.saveLocalProject).not.toHaveBeenCalled();
	});

	it('sync sets status to syncing then synced', async () => {
		const statuses: string[] = [];
		const unsub = useSyncStore.subscribe((s) => {
			if (!statuses.includes(s.status)) statuses.push(s.status);
		});

		const deps = createMockDeps({
			getLocalProjects: vi.fn(async () => []),
			getProjects: vi.fn(async () => ({ data: [], error: null })),
		});
		engine = new SyncEngine(deps);

		await engine.sync();
		unsub();

		expect(statuses).toContain('syncing');
		expect(useSyncStore.getState().status).toBe('synced');
	});

	it('sync sets error status on failure', async () => {
		const deps = createMockDeps({
			getLocalProjects: vi.fn(async () => {
				throw new Error('DB failure');
			}),
		});
		engine = new SyncEngine(deps);

		await engine.sync();

		expect(useSyncStore.getState().status).toBe('error');
		expect(useSyncStore.getState().error).toContain('DB failure');
	});

	it('scheduleDebouncedSync debounces repeated calls', async () => {
		vi.useFakeTimers();
		const syncSpy = vi.fn();
		const deps = createMockDeps({
			getLocalProjects: vi.fn(async () => {
				syncSpy();
				return [];
			}),
			getProjects: vi.fn(async () => ({ data: [], error: null })),
		});
		engine = new SyncEngine(deps, {
			debounceMs: 500,
			maxRetries: 3,
			quotaWarningThreshold: 0.8,
			historyRetentionDays: 7,
		});

		engine.scheduleDebouncedSync();
		engine.scheduleDebouncedSync();
		engine.scheduleDebouncedSync();

		// Not called yet
		expect(syncSpy).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(600);

		// sync() was called once (debounced), which calls getLocalProjects
		// twice internally (push + pull), so we verify the spy was called
		expect(syncSpy).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
	});

	it('destroy cleans up timers', () => {
		vi.useFakeTimers();
		engine = new SyncEngine(createMockDeps(), {
			debounceMs: 500,
			maxRetries: 3,
			quotaWarningThreshold: 0.8,
			historyRetentionDays: 7,
		});
		engine.scheduleDebouncedSync();
		engine.destroy();

		// Should not throw or have pending timers
		vi.advanceTimersByTime(1000);
		vi.useRealTimers();
	});
});
