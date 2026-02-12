/**
 * Maps between local app types and Supabase database types.
 *
 * Local types use camelCase (Project, Scene).
 * Database types use snake_case (DbProject, DbScene).
 *
 * Spec reference: Section 4 (Persistence)
 */

import type {
	DbProject,
	DbProjectInsert,
	DbProjectUpdate,
	DbScene,
	DbSceneInsert,
	DbSceneUpdate,
} from '@/lib/supabase/database.types';
import type { JsonValue } from '@/types/common';
import type { Project, ProjectSettings } from '@/types/project';
import type { Scene } from '@/types/scene';

/**
 * Convert a local Project to a DbProjectInsert for creating in Supabase.
 */
export function projectToDbInsert(project: Project): DbProjectInsert {
	return {
		user_id: project.userId,
		name: project.name,
		description: project.description,
		thumbnail_url: project.thumbnail || null,
		is_public: project.isPublic,
		tags: project.tags,
		settings: project.settings as unknown as Record<string, JsonValue>,
	};
}

/**
 * Convert a local Project's changed fields to a DbProjectUpdate.
 */
export function projectToDbUpdate(project: Project): DbProjectUpdate {
	return {
		name: project.name,
		description: project.description,
		thumbnail_url: project.thumbnail || null,
		is_public: project.isPublic,
		tags: project.tags,
		settings: project.settings as unknown as Record<string, JsonValue>,
		updated_at: project.updatedAt,
	};
}

/**
 * Convert a DbProject from Supabase to a local Project.
 */
export function dbToProject(db: DbProject, sceneIds: string[]): Project {
	return {
		id: db.id,
		name: db.name,
		description: db.description,
		thumbnail: db.thumbnail_url ?? '',
		createdAt: db.created_at,
		updatedAt: db.updated_at,
		userId: db.user_id,
		isPublic: db.is_public,
		tags: db.tags,
		settings: db.settings as unknown as ProjectSettings,
		sceneIds,
	};
}

/**
 * Convert a local Scene to a DbSceneInsert for creating in Supabase.
 */
export function sceneToDbInsert(scene: Scene, projectId: string): DbSceneInsert {
	return {
		project_id: projectId,
		name: scene.name,
		scene_order: scene.order,
		data: sceneToData(scene),
		code_source: scene.codeSource
			? (scene.codeSource as unknown as Record<string, JsonValue>)
			: null,
		duration: scene.duration,
	};
}

/**
 * Convert a local Scene's changed fields to a DbSceneUpdate.
 */
export function sceneToDbUpdate(scene: Scene): DbSceneUpdate {
	return {
		name: scene.name,
		scene_order: scene.order,
		data: sceneToData(scene),
		code_source: scene.codeSource
			? (scene.codeSource as unknown as Record<string, JsonValue>)
			: null,
		duration: scene.duration,
	};
}

/**
 * Convert a DbScene from Supabase to a local Scene.
 */
export function dbToScene(db: DbScene): Scene {
	const data = db.data as Record<string, JsonValue>;
	return {
		id: db.id,
		name: db.name,
		order: db.scene_order,
		elements: (data.elements ?? {}) as unknown as Scene['elements'],
		elementIds: (data.elementIds ?? []) as unknown as string[],
		connections: (data.connections ?? []) as unknown as Scene['connections'],
		annotations: (data.annotations ?? []) as unknown as Scene['annotations'],
		animationSequenceIds: (data.animationSequenceIds ?? []) as unknown as string[],
		codeSource: db.code_source ? (db.code_source as unknown as Scene['codeSource']) : undefined,
		duration: db.duration,
	};
}

/** Pack scene visual data into a single JSON column */
function sceneToData(scene: Scene): Record<string, JsonValue> {
	return {
		elements: scene.elements as unknown as JsonValue,
		elementIds: scene.elementIds as unknown as JsonValue,
		connections: scene.connections as unknown as JsonValue,
		annotations: scene.annotations as unknown as JsonValue,
		animationSequenceIds: scene.animationSequenceIds as unknown as JsonValue,
	};
}
