import Dexie from 'dexie';
import type { StateStorage } from 'zustand/middleware';

/**
 * IndexedDB database for Zustand store persistence.
 * Uses Dexie.js 4.3+ for the underlying IndexedDB access.
 */
class AlgoMotionDB extends Dexie {
	stores!: Dexie.Table<{ key: string; value: string }, string>;

	constructor() {
		super('AlgoMotionDB');
		this.version(1).stores({ stores: 'key' });
	}
}

let db: AlgoMotionDB | null = null;

function getDB(): AlgoMotionDB {
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
