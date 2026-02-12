/**
 * Zustand store for cloud sync state.
 *
 * Tracks connectivity, sync status, pending queue, and quota usage.
 * Used by the SyncEngine and UI components.
 *
 * Spec reference: Section 4 (Persistence)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ConnectivityStatus, SyncQueueItem, SyncStatus } from '@/lib/sync/sync-types';
import { DEFAULT_SYNC_CONFIG } from '@/lib/sync/sync-types';

export interface SyncState {
	status: SyncStatus;
	connectivity: ConnectivityStatus;
	lastSyncedAt: string | null;
	error: string | null;
	queue: SyncQueueItem[];
	quotaUsage: number;
	quotaWarning: boolean;
}

export interface SyncActions {
	setStatus: (status: SyncStatus) => void;
	setConnectivity: (connectivity: ConnectivityStatus) => void;
	setLastSyncedAt: (timestamp: string) => void;
	setError: (error: string) => void;
	clearError: () => void;
	addToQueue: (item: SyncQueueItem) => void;
	removeFromQueue: (id: string) => void;
	incrementRetry: (id: string) => void;
	setQuotaUsage: (usage: number) => void;
	reset: () => void;
}

export type SyncStore = SyncState & SyncActions;

const initialState: SyncState = {
	status: 'offline',
	connectivity: 'offline',
	lastSyncedAt: null,
	error: null,
	queue: [],
	quotaUsage: 0,
	quotaWarning: false,
};

export const useSyncStore = create<SyncStore>()(
	devtools(
		immer((set) => ({
			...initialState,

			setStatus: (status) =>
				set((state) => {
					state.status = status;
				}),

			setConnectivity: (connectivity) =>
				set((state) => {
					state.connectivity = connectivity;
				}),

			setLastSyncedAt: (timestamp) =>
				set((state) => {
					state.lastSyncedAt = timestamp;
				}),

			setError: (error) =>
				set((state) => {
					state.error = error;
					state.status = 'error';
				}),

			clearError: () =>
				set((state) => {
					state.error = null;
					state.status = 'idle';
				}),

			addToQueue: (item) =>
				set((state) => {
					state.queue.push(item);
				}),

			removeFromQueue: (id) =>
				set((state) => {
					state.queue = state.queue.filter((item) => item.id !== id);
				}),

			incrementRetry: (id) =>
				set((state) => {
					const item = state.queue.find((q) => q.id === id);
					if (item) {
						item.retryCount += 1;
					}
				}),

			setQuotaUsage: (usage) =>
				set((state) => {
					state.quotaUsage = usage;
					state.quotaWarning = usage >= DEFAULT_SYNC_CONFIG.quotaWarningThreshold;
				}),

			reset: () => set(initialState),
		})),
		{ name: 'SyncStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
