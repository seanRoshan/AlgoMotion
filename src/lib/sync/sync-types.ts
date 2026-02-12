/**
 * Types for the cloud sync engine (IndexedDB ↔ Supabase).
 *
 * Spec reference: Section 4 (Persistence)
 */

/** Overall connectivity status */
export type ConnectivityStatus = 'online' | 'offline';

/** Sync operation status */
export type SyncOperationStatus = 'idle' | 'syncing' | 'error';

/** Combined sync status for UI display */
export type SyncStatus = 'idle' | 'synced' | 'syncing' | 'offline' | 'error' | 'pending';

/** Direction of a sync operation */
export type SyncDirection = 'push' | 'pull';

/** Type of entity being synced */
export type SyncEntityType = 'project' | 'scene';

/** A queued sync operation for retry */
export interface SyncQueueItem {
	id: string;
	entityType: SyncEntityType;
	entityId: string;
	direction: SyncDirection;
	timestamp: string;
	retryCount: number;
}

/** Conflict resolution result */
export interface ConflictResult {
	winner: 'local' | 'remote';
	localTimestamp: string;
	remoteTimestamp: string;
}

/** Sync engine configuration */
export interface SyncConfig {
	/** Debounce delay in milliseconds (default: 2000) */
	debounceMs: number;
	/** Maximum retry count for failed syncs (default: 3) */
	maxRetries: number;
	/** IndexedDB usage warning threshold (0-1, default: 0.8) */
	quotaWarningThreshold: number;
	/** Days after which undo history is auto-cleaned (default: 7) */
	historyRetentionDays: number;
}

/** Default sync configuration */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
	debounceMs: 2000,
	maxRetries: 3,
	quotaWarningThreshold: 0.8,
	historyRetentionDays: 7,
};
