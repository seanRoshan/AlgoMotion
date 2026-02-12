/**
 * Tests for entity mapper (local ↔ Supabase types).
 */

import { describe, expect, it } from 'vitest';
import type { DbProject, DbScene } from '@/lib/supabase/database.types';
import type { Project } from '@/types/project';
import type { Scene } from '@/types/scene';
import {
	dbToProject,
	dbToScene,
	projectToDbInsert,
	projectToDbUpdate,
	sceneToDbInsert,
	sceneToDbUpdate,
} from './entity-mapper';

function createProject(overrides: Partial<Project> = {}): Project {
	return {
		id: 'proj-1',
		name: 'Test Project',
		description: 'A test project',
		thumbnail: 'data:image/png;base64,abc',
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-02T00:00:00Z',
		userId: 'user-1',
		isPublic: false,
		tags: ['sorting'],
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
		sceneIds: ['scene-1', 'scene-2'],
		...overrides,
	};
}

function createDbProject(overrides: Partial<DbProject> = {}): DbProject {
	return {
		id: 'proj-1',
		user_id: 'user-1',
		name: 'Test Project',
		description: 'A test project',
		thumbnail_url: 'https://example.com/thumb.png',
		is_public: true,
		tags: ['graph'],
		settings: { canvasWidth: 1280 },
		created_at: '2026-02-01T00:00:00Z',
		updated_at: '2026-02-02T00:00:00Z',
		...overrides,
	};
}

function createScene(overrides: Partial<Scene> = {}): Scene {
	return {
		id: 'scene-1',
		name: 'Scene One',
		order: 0,
		elements: { el1: { id: 'el1', type: 'rect' } } as unknown as Scene['elements'],
		elementIds: ['el1'],
		connections: [],
		annotations: [],
		animationSequenceIds: ['seq-1'],
		duration: 5,
		...overrides,
	};
}

function createDbScene(overrides: Partial<DbScene> = {}): DbScene {
	return {
		id: 'scene-1',
		project_id: 'proj-1',
		name: 'Scene One',
		scene_order: 0,
		data: {
			elements: { el1: { id: 'el1', type: 'rect' } },
			elementIds: ['el1'],
			connections: [],
			annotations: [],
			animationSequenceIds: ['seq-1'],
		},
		code_source: null,
		duration: 5,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-02T00:00:00Z',
		...overrides,
	};
}

describe('projectToDbInsert', () => {
	it('maps all project fields to snake_case', () => {
		const result = projectToDbInsert(createProject());

		expect(result.user_id).toBe('user-1');
		expect(result.name).toBe('Test Project');
		expect(result.description).toBe('A test project');
		expect(result.is_public).toBe(false);
		expect(result.tags).toEqual(['sorting']);
	});

	it('maps thumbnail to thumbnail_url', () => {
		const result = projectToDbInsert(createProject({ thumbnail: 'data:image/png;base64,x' }));
		expect(result.thumbnail_url).toBe('data:image/png;base64,x');
	});

	it('sets thumbnail_url to null when empty', () => {
		const result = projectToDbInsert(createProject({ thumbnail: '' }));
		expect(result.thumbnail_url).toBeNull();
	});

	it('includes settings as JSON', () => {
		const result = projectToDbInsert(createProject());
		expect(result.settings).toHaveProperty('canvasWidth', 1920);
	});
});

describe('projectToDbUpdate', () => {
	it('maps updatable fields', () => {
		const result = projectToDbUpdate(createProject({ name: 'Updated' }));
		expect(result.name).toBe('Updated');
		expect(result.updated_at).toBe('2026-01-02T00:00:00Z');
	});
});

describe('dbToProject', () => {
	it('maps DbProject to local Project', () => {
		const result = dbToProject(createDbProject(), ['s1', 's2']);

		expect(result.id).toBe('proj-1');
		expect(result.userId).toBe('user-1');
		expect(result.isPublic).toBe(true);
		expect(result.createdAt).toBe('2026-02-01T00:00:00Z');
		expect(result.sceneIds).toEqual(['s1', 's2']);
	});

	it('maps null thumbnail_url to empty string', () => {
		const result = dbToProject(createDbProject({ thumbnail_url: null }), []);
		expect(result.thumbnail).toBe('');
	});
});

describe('sceneToDbInsert', () => {
	it('maps scene fields to snake_case', () => {
		const result = sceneToDbInsert(createScene(), 'proj-1');

		expect(result.project_id).toBe('proj-1');
		expect(result.name).toBe('Scene One');
		expect(result.scene_order).toBe(0);
		expect(result.duration).toBe(5);
	});

	it('packs elements into data JSON', () => {
		const result = sceneToDbInsert(createScene(), 'proj-1');
		expect(result.data).toHaveProperty('elements');
		expect(result.data).toHaveProperty('elementIds');
		expect(result.data).toHaveProperty('connections');
	});

	it('maps codeSource to code_source', () => {
		const scene = createScene({
			codeSource: { language: 'javascript', code: 'x = 1', lineMapping: {} },
		});
		const result = sceneToDbInsert(scene, 'proj-1');
		expect(result.code_source).toHaveProperty('language', 'javascript');
	});

	it('sets code_source to null when absent', () => {
		const result = sceneToDbInsert(createScene(), 'proj-1');
		expect(result.code_source).toBeNull();
	});
});

describe('sceneToDbUpdate', () => {
	it('maps updatable scene fields', () => {
		const result = sceneToDbUpdate(createScene({ name: 'Updated Scene' }));
		expect(result.name).toBe('Updated Scene');
	});
});

describe('dbToScene', () => {
	it('maps DbScene to local Scene', () => {
		const result = dbToScene(createDbScene());

		expect(result.id).toBe('scene-1');
		expect(result.name).toBe('Scene One');
		expect(result.order).toBe(0);
		expect(result.elementIds).toEqual(['el1']);
		expect(result.duration).toBe(5);
	});

	it('handles missing data fields with defaults', () => {
		const result = dbToScene(createDbScene({ data: {} }));
		expect(result.elements).toEqual({});
		expect(result.elementIds).toEqual([]);
		expect(result.connections).toEqual([]);
	});

	it('maps code_source to codeSource', () => {
		const result = dbToScene(
			createDbScene({ code_source: { language: 'python', code: 'x = 1', lineMapping: {} } }),
		);
		expect(result.codeSource).toHaveProperty('language', 'python');
	});

	it('sets codeSource to undefined when code_source is null', () => {
		const result = dbToScene(createDbScene({ code_source: null }));
		expect(result.codeSource).toBeUndefined();
	});
});
