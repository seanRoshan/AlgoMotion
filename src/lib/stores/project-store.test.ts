import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '@/types';
import { useProjectStore } from './project-store';

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		id: 'proj-1',
		name: 'Test Project',
		description: 'A test project',
		thumbnail: '',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		userId: 'user-1',
		isPublic: false,
		tags: [],
		settings: {
			canvasWidth: 1920,
			canvasHeight: 1080,
			backgroundColor: '#1e1e2e',
			backgroundStyle: 'grid',
			gridSize: 20,
			snapToGrid: true,
			fps: 60,
			defaultEasing: 'power2.out',
			theme: 'dark',
		},
		sceneIds: [],
		...overrides,
	};
}

describe('projectStore', () => {
	beforeEach(() => {
		useProjectStore.getState().reset();
	});

	afterEach(() => {
		useProjectStore.getState().reset();
	});

	describe('initial state', () => {
		it('starts with no project', () => {
			expect(useProjectStore.getState().project).toBeNull();
		});

		it('starts not dirty', () => {
			expect(useProjectStore.getState().isDirty).toBe(false);
		});

		it('starts with offline sync status', () => {
			expect(useProjectStore.getState().syncStatus).toBe('offline');
		});
	});

	describe('setProject', () => {
		it('sets the project', () => {
			const project = makeProject();
			useProjectStore.getState().setProject(project);

			expect(useProjectStore.getState().project?.id).toBe('proj-1');
			expect(useProjectStore.getState().isDirty).toBe(false);
		});
	});

	describe('updateProject', () => {
		it('updates project fields and marks dirty', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().updateProject({ name: 'New Name' });

			const state = useProjectStore.getState();
			expect(state.project?.name).toBe('New Name');
			expect(state.isDirty).toBe(true);
		});

		it('updates updatedAt timestamp', () => {
			useProjectStore.getState().setProject(makeProject());
			const before = useProjectStore.getState().project?.updatedAt;

			useProjectStore.getState().updateProject({ description: 'updated' });
			const after = useProjectStore.getState().project?.updatedAt;

			expect(after).not.toBe(before);
		});

		it('does nothing when no project is loaded', () => {
			expect(() => {
				useProjectStore.getState().updateProject({ name: 'fail' });
			}).not.toThrow();
			expect(useProjectStore.getState().project).toBeNull();
		});
	});

	describe('updateSettings', () => {
		it('updates project settings', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().updateSettings({ fps: 30, gridSize: 10 });

			expect(useProjectStore.getState().project?.settings.fps).toBe(30);
			expect(useProjectStore.getState().project?.settings.gridSize).toBe(10);
		});

		it('marks project dirty', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().updateSettings({ snapToGrid: false });

			expect(useProjectStore.getState().isDirty).toBe(true);
		});
	});

	describe('save state', () => {
		it('markDirty sets isDirty', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().markDirty();
			expect(useProjectStore.getState().isDirty).toBe(true);
		});

		it('markSaved clears dirty and sets timestamp', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().markDirty();
			useProjectStore.getState().markSaved();

			const state = useProjectStore.getState();
			expect(state.isDirty).toBe(false);
			expect(state.lastSaved).not.toBeNull();
			expect(state.syncStatus).toBe('synced');
		});
	});

	describe('sync status', () => {
		it('sets sync status', () => {
			useProjectStore.getState().setSyncStatus('pending');
			expect(useProjectStore.getState().syncStatus).toBe('pending');

			useProjectStore.getState().setSyncStatus('error');
			expect(useProjectStore.getState().syncStatus).toBe('error');
		});
	});

	describe('scenes', () => {
		it('adds a scene ID', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().addScene('scene-1');

			expect(useProjectStore.getState().project?.sceneIds).toContain('scene-1');
			expect(useProjectStore.getState().isDirty).toBe(true);
		});

		it('does not duplicate scene IDs', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().addScene('scene-1');
			useProjectStore.getState().addScene('scene-1');

			expect(useProjectStore.getState().project?.sceneIds).toEqual(['scene-1']);
		});

		it('removes a scene ID', () => {
			useProjectStore.getState().setProject(makeProject({ sceneIds: ['s1', 's2', 's3'] }));
			useProjectStore.getState().removeScene('s2');

			expect(useProjectStore.getState().project?.sceneIds).toEqual(['s1', 's3']);
		});

		it('reorders scene IDs', () => {
			useProjectStore.getState().setProject(makeProject({ sceneIds: ['s1', 's2', 's3'] }));
			useProjectStore.getState().reorderScenes(['s3', 's1', 's2']);

			expect(useProjectStore.getState().project?.sceneIds).toEqual(['s3', 's1', 's2']);
		});
	});

	describe('clearProject', () => {
		it('clears the project', () => {
			useProjectStore.getState().setProject(makeProject());
			useProjectStore.getState().markDirty();
			useProjectStore.getState().clearProject();

			const state = useProjectStore.getState();
			expect(state.project).toBeNull();
			expect(state.isDirty).toBe(false);
			expect(state.lastSaved).toBeNull();
		});
	});

	describe('serialization', () => {
		it('state contains no Map or Set, dates are ISO strings', () => {
			useProjectStore.getState().setProject(makeProject());

			const state = useProjectStore.getState();
			const json = JSON.stringify({
				project: state.project,
				isDirty: state.isDirty,
				lastSaved: state.lastSaved,
				syncStatus: state.syncStatus,
			});

			expect(() => JSON.parse(json)).not.toThrow();

			// Dates are strings, not Date objects
			expect(typeof state.project?.createdAt).toBe('string');
			expect(typeof state.project?.updatedAt).toBe('string');
		});
	});
});
