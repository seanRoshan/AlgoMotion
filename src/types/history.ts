import type { Patch } from 'immer';

export interface HistoryEntry {
	id: string;
	description: string;
	patches: Patch[];
	inversePatches: Patch[];
	timestamp: number;
	groupId?: string;
}

export interface ActiveGroup {
	groupId: string;
	description: string;
	patches: Patch[];
	inversePatches: Patch[];
	startTimestamp: number;
}
