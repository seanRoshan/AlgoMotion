/**
 * Typed Supabase query helpers for projects, scenes, and templates.
 *
 * Wraps common database operations with proper TypeScript types.
 * All functions take a Supabase client instance for flexibility
 * across server/client contexts.
 *
 * Spec reference: Section 8.2 (Database Schema)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	DbProject,
	DbProjectInsert,
	DbProjectUpdate,
	DbScene,
	DbSceneInsert,
	DbSceneUpdate,
	DbTemplate,
} from './database.types';

// ─── Projects ──────────────────────────────────────────

export async function getProjects(supabase: SupabaseClient, userId: string) {
	return supabase
		.from('projects')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false })
		.returns<DbProject[]>();
}

export async function getProject(supabase: SupabaseClient, projectId: string) {
	return supabase.from('projects').select('*').eq('id', projectId).single<DbProject>();
}

export async function getPublicProjects(supabase: SupabaseClient) {
	return supabase
		.from('projects')
		.select('*')
		.eq('is_public', true)
		.order('updated_at', { ascending: false })
		.returns<DbProject[]>();
}

export async function createProject(supabase: SupabaseClient, project: DbProjectInsert) {
	return supabase.from('projects').insert(project).select().single<DbProject>();
}

export async function updateProject(
	supabase: SupabaseClient,
	projectId: string,
	updates: DbProjectUpdate,
) {
	return supabase.from('projects').update(updates).eq('id', projectId).select().single<DbProject>();
}

export async function deleteProject(supabase: SupabaseClient, projectId: string) {
	return supabase.from('projects').delete().eq('id', projectId);
}

// ─── Scenes ────────────────────────────────────────────

export async function getScenes(supabase: SupabaseClient, projectId: string) {
	return supabase
		.from('scenes')
		.select('*')
		.eq('project_id', projectId)
		.order('scene_order', { ascending: true })
		.returns<DbScene[]>();
}

export async function getScene(supabase: SupabaseClient, sceneId: string) {
	return supabase.from('scenes').select('*').eq('id', sceneId).single<DbScene>();
}

export async function createScene(supabase: SupabaseClient, scene: DbSceneInsert) {
	return supabase.from('scenes').insert(scene).select().single<DbScene>();
}

export async function updateScene(
	supabase: SupabaseClient,
	sceneId: string,
	updates: DbSceneUpdate,
) {
	return supabase.from('scenes').update(updates).eq('id', sceneId).select().single<DbScene>();
}

export async function deleteScene(supabase: SupabaseClient, sceneId: string) {
	return supabase.from('scenes').delete().eq('id', sceneId);
}

// ─── Templates ─────────────────────────────────────────

export async function getTemplates(supabase: SupabaseClient, category?: string) {
	let query = supabase.from('templates').select('*');

	if (category) {
		query = query.eq('category', category);
	}

	return query.order('usage_count', { ascending: false }).returns<DbTemplate[]>();
}

export async function getTemplate(supabase: SupabaseClient, templateId: string) {
	return supabase.from('templates').select('*').eq('id', templateId).single<DbTemplate>();
}

export async function incrementTemplateUsage(supabase: SupabaseClient, templateId: string) {
	return supabase.rpc('increment_template_usage', { template_id: templateId });
}
