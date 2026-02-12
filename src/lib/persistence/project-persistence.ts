import { getDB } from '@/lib/stores/dexie-storage';
import type { Project } from '@/types';

/**
 * Save project metadata to the IndexedDB project index.
 * Uses `put` so it upserts — inserts or updates if the ID already exists.
 */
export async function saveProjectToIndex(project: Project): Promise<void> {
	await getDB().projects.put(project);
}

/**
 * List all projects from the IndexedDB index.
 * Returns the full project metadata for dashboard display.
 */
export async function listProjects(): Promise<Project[]> {
	return getDB().projects.toArray();
}

/**
 * Get a single project index entry by ID.
 * Returns undefined if the project is not found.
 */
export async function getProjectIndex(id: string): Promise<Project | undefined> {
	return getDB().projects.get(id);
}

/**
 * Delete a project from the IndexedDB index.
 * No-op if the project doesn't exist.
 */
export async function deleteProject(id: string): Promise<void> {
	await getDB().projects.delete(id);
}
