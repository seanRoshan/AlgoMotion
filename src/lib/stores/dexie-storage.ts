import Dexie from 'dexie';
import type { StateStorage } from 'zustand/middleware';
import type { Project } from '@/types';

/**
 * IndexedDB database for Zustand store persistence and project index.
 * Uses Dexie.js 4.3+ for the underlying IndexedDB access.
 *
 * Version history:
 *   v1 — `stores` table (Zustand persist middleware key-value storage)
 *   v2 — `projects` table (project index for dashboard listing)
 */
class AlgoMotionDB extends Dexie {
	stores!: Dexie.Table<{ key: string; value: string }, string>;
	projects!: Dexie.Table<Project, string>;

	constructor() {
		super('AlgoMotionDB');
		this.version(1).stores({ stores: 'key' });
		this.version(2).stores({ projects: 'id, name, updatedAt, userId' });
	}
}

let db: AlgoMotionDB | null = null;

export function getDB(): AlgoMotionDB {
	if (!db) {
		db = new AlgoMotionDB();
	}
	return db;
}

/**
 * Custom Zustand StateStorage adapter backed by IndexedDB via Dexie.js.
 * Used with `createJSONStorage(() => dexieStorage)` in persist middleware.
 */
export const dexieStorage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		const result = await getDB().stores.get(name);
		return result?.value ?? null;
	},
	setItem: async (name: string, value: string): Promise<void> => {
		await getDB().stores.put({ key: name, value });
	},
	removeItem: async (name: string): Promise<void> => {
		await getDB().stores.delete(name);
	},
};
