import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '@/types';
import {
	deleteProject,
	getProjectIndex,
	listProjects,
	saveProjectToIndex,
} from './project-persistence';

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		id: `proj-${Math.random().toString(36).slice(2, 8)}`,
		name: 'Test Project',
		description: 'A test project',
		thumbnail: '',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		userId: 'user-1',
		isPublic: false,
		tags: ['test'],
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

describe('project-persistence', () => {
	beforeEach(async () => {
		// Clear all projects before each test
		const projects = await listProjects();
		for (const p of projects) {
			await deleteProject(p.id);
		}
	});

	afterEach(async () => {
		const projects = await listProjects();
		for (const p of projects) {
			await deleteProject(p.id);
		}
	});

	describe('saveProjectToIndex', () => {
		it('saves project metadata to the index', async () => {
			const project = makeProject({ id: 'proj-save-1', name: 'Saved Project' });
			await saveProjectToIndex(project);

			const entry = await getProjectIndex('proj-save-1');
			expect(entry).toBeDefined();
			expect(entry?.name).toBe('Saved Project');
		});

		it('updates existing entry on re-save', async () => {
			const project = makeProject({ id: 'proj-update', name: 'Original' });
			await saveProjectToIndex(project);

			const updated = { ...project, name: 'Updated', updatedAt: '2026-02-01T00:00:00.000Z' };
			await saveProjectToIndex(updated);

			const entry = await getProjectIndex('proj-update');
			expect(entry?.name).toBe('Updated');
		});
	});

	describe('listProjects', () => {
		it('returns empty array when no projects saved', async () => {
			const projects = await listProjects();
			expect(projects).toEqual([]);
		});

		it('lists all saved projects', async () => {
			await saveProjectToIndex(makeProject({ id: 'proj-a', name: 'Project A' }));
			await saveProjectToIndex(makeProject({ id: 'proj-b', name: 'Project B' }));

			const projects = await listProjects();
			expect(projects).toHaveLength(2);
			const names = projects.map((p) => p.name);
			expect(names).toContain('Project A');
			expect(names).toContain('Project B');
		});
	});

	describe('getProjectIndex', () => {
		it('returns undefined for non-existent project', async () => {
			const entry = await getProjectIndex('nonexistent');
			expect(entry).toBeUndefined();
		});

		it('returns the project index entry', async () => {
			await saveProjectToIndex(makeProject({ id: 'proj-get', name: 'Get Me' }));
			const entry = await getProjectIndex('proj-get');
			expect(entry?.id).toBe('proj-get');
			expect(entry?.name).toBe('Get Me');
		});
	});

	describe('deleteProject', () => {
		it('removes a project from the index', async () => {
			await saveProjectToIndex(makeProject({ id: 'proj-del' }));
			await deleteProject('proj-del');

			const entry = await getProjectIndex('proj-del');
			expect(entry).toBeUndefined();
		});

		it('does not throw when deleting non-existent project', async () => {
			await expect(deleteProject('nonexistent')).resolves.not.toThrow();
		});
	});
});
