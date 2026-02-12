/**
 * Tests for database types — validates type structure and exports.
 */

import { describe, expect, it } from 'vitest';
import type {
	Database,
	DbProject,
	DbProjectInsert,
	DbProjectUpdate,
	DbScene,
	DbSceneInsert,
	DbSceneUpdate,
	DbTemplate,
	DbTemplateInsert,
	StorageBucket,
	TemplateCategory,
	TemplateDifficulty,
} from './database.types';

describe('database.types', () => {
	it('exports DbProject type with required fields', () => {
		const project: DbProject = {
			id: 'uuid-1',
			user_id: 'user-1',
			name: 'Test Project',
			description: 'A test',
			thumbnail_url: null,
			is_public: false,
			tags: ['sorting'],
			settings: { canvasWidth: 1920 },
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z',
		};
		expect(project.id).toBe('uuid-1');
		expect(project.user_id).toBe('user-1');
	});

	it('exports DbProjectInsert without id and timestamps', () => {
		const insert: DbProjectInsert = {
			user_id: 'user-1',
			name: 'New Project',
			description: '',
			thumbnail_url: null,
			is_public: false,
			tags: [],
			settings: {},
		};
		expect(insert.name).toBe('New Project');
	});

	it('exports DbProjectUpdate as partial', () => {
		const update: DbProjectUpdate = {
			name: 'Updated Name',
		};
		expect(update.name).toBe('Updated Name');
	});

	it('exports DbScene type with required fields', () => {
		const scene: DbScene = {
			id: 'uuid-2',
			project_id: 'uuid-1',
			name: 'Scene 1',
			scene_order: 0,
			data: { elements: {} },
			code_source: null,
			duration: 5.0,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z',
		};
		expect(scene.project_id).toBe('uuid-1');
		expect(scene.duration).toBe(5.0);
	});

	it('exports DbSceneInsert and DbSceneUpdate', () => {
		const insert: DbSceneInsert = {
			project_id: 'uuid-1',
			name: 'Scene 2',
			scene_order: 1,
			data: {},
			code_source: null,
			duration: 0,
		};
		expect(insert.scene_order).toBe(1);

		const update: DbSceneUpdate = { name: 'Renamed Scene' };
		expect(update.name).toBe('Renamed Scene');
	});

	it('exports DbTemplate type with required fields', () => {
		const template: DbTemplate = {
			id: 'uuid-3',
			name: 'Bubble Sort',
			description: 'Classic sorting algorithm',
			category: 'sorting',
			difficulty: 'beginner',
			thumbnail_url: null,
			scene_data: {},
			tags: ['sorting', 'comparison'],
			usage_count: 42,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z',
		};
		expect(template.usage_count).toBe(42);
	});

	it('exports DbTemplateInsert without auto-generated fields', () => {
		const insert: DbTemplateInsert = {
			name: 'Quick Sort',
			description: 'Efficient divide-and-conquer',
			category: 'sorting',
			difficulty: 'intermediate',
			thumbnail_url: null,
			scene_data: {},
			tags: [],
		};
		expect(insert.category).toBe('sorting');
	});

	it('exports TemplateCategory union type', () => {
		const categories: TemplateCategory[] = [
			'sorting',
			'searching',
			'graph',
			'tree',
			'dynamic-programming',
			'data-structure',
			'string',
			'math',
			'other',
		];
		expect(categories).toHaveLength(9);
	});

	it('exports TemplateDifficulty union type', () => {
		const difficulties: TemplateDifficulty[] = ['beginner', 'intermediate', 'advanced'];
		expect(difficulties).toHaveLength(3);
	});

	it('exports StorageBucket union type', () => {
		const buckets: StorageBucket[] = ['project-assets', 'exported-media', 'template-assets'];
		expect(buckets).toHaveLength(3);
	});

	it('exports Database schema type', () => {
		const _db: Database = {
			public: {
				Tables: {
					projects: {
						Row: {} as DbProject,
						Insert: {} as DbProjectInsert,
						Update: {} as DbProjectUpdate,
					},
					scenes: {
						Row: {} as DbScene,
						Insert: {} as DbSceneInsert,
						Update: {} as DbSceneUpdate,
					},
					templates: {
						Row: {} as DbTemplate,
						Insert: {} as DbTemplateInsert,
						Update: {} as Partial<DbTemplate>,
					},
				},
			},
		};
		expect(_db.public.Tables.projects).toBeDefined();
		expect(_db.public.Tables.scenes).toBeDefined();
		expect(_db.public.Tables.templates).toBeDefined();
	});
});
