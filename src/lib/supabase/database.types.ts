/**
 * Database types for Supabase PostgreSQL schema.
 *
 * These types mirror the database tables and are used
 * for type-safe queries with the Supabase client.
 *
 * Spec reference: Section 8.2 (Database Schema)
 */

import type { JsonValue } from '@/types/common';

// ─── Projects ──────────────────────────────────────────

export interface DbProject {
	id: string;
	user_id: string;
	name: string;
	description: string;
	thumbnail_url: string | null;
	is_public: boolean;
	tags: string[];
	settings: Record<string, JsonValue>;
	created_at: string;
	updated_at: string;
}

export type DbProjectInsert = Omit<DbProject, 'id' | 'created_at' | 'updated_at'>;
export type DbProjectUpdate = Partial<Omit<DbProject, 'id' | 'user_id' | 'created_at'>>;

// ─── Scenes ────────────────────────────────────────────

export interface DbScene {
	id: string;
	project_id: string;
	name: string;
	scene_order: number;
	data: Record<string, JsonValue>;
	code_source: Record<string, JsonValue> | null;
	duration: number;
	created_at: string;
	updated_at: string;
}

export type DbSceneInsert = Omit<DbScene, 'id' | 'created_at' | 'updated_at'>;
export type DbSceneUpdate = Partial<Omit<DbScene, 'id' | 'project_id' | 'created_at'>>;

// ─── Templates ─────────────────────────────────────────

export type TemplateCategory =
	| 'sorting'
	| 'searching'
	| 'graph'
	| 'tree'
	| 'dynamic-programming'
	| 'data-structure'
	| 'string'
	| 'math'
	| 'other';

export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface DbTemplate {
	id: string;
	name: string;
	description: string;
	category: TemplateCategory;
	difficulty: TemplateDifficulty;
	thumbnail_url: string | null;
	scene_data: Record<string, JsonValue>;
	tags: string[];
	usage_count: number;
	created_at: string;
	updated_at: string;
}

export type DbTemplateInsert = Omit<DbTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>;

// ─── Database Schema ───────────────────────────────────

export interface Database {
	public: {
		Tables: {
			projects: {
				Row: DbProject;
				Insert: DbProjectInsert;
				Update: DbProjectUpdate;
			};
			scenes: {
				Row: DbScene;
				Insert: DbSceneInsert;
				Update: DbSceneUpdate;
			};
			templates: {
				Row: DbTemplate;
				Insert: DbTemplateInsert;
				Update: Partial<DbTemplate>;
			};
		};
	};
}

// ─── Storage Buckets ───────────────────────────────────

export type StorageBucket = 'project-assets' | 'exported-media' | 'template-assets';
