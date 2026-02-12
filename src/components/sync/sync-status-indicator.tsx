/**
 * Sync status indicator with manual sync button.
 *
 * Displays current sync state (synced, syncing, offline, error)
 * and a button to trigger manual sync.
 *
 * Spec reference: Section 4 (Persistence)
 */

'use client';

import { useSync } from '@/hooks/use-sync';
import { useSyncStore } from '@/lib/stores/sync-store';

const STATUS_CONFIG = {
	synced: { label: 'Synced', dotClass: 'bg-green-500' },
	syncing: { label: 'Syncing...', dotClass: 'bg-blue-500 animate-pulse' },
	offline: { label: 'Offline', dotClass: 'bg-gray-500' },
	error: { label: 'Sync error', dotClass: 'bg-red-500' },
	pending: { label: 'Pending', dotClass: 'bg-yellow-500' },
	idle: { label: 'Ready', dotClass: 'bg-gray-400' },
} as const;

export function SyncStatusIndicator() {
	const { status, connectivity, quotaWarning, triggerSync } = useSync();
	const quotaUsage = useSyncStore((s) => s.quotaUsage);

	const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.idle;
	const isDisabled = connectivity === 'offline' || status === 'syncing';

	return (
		<div className="flex items-center gap-2 text-sm">
			<span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
			<span className="text-muted-foreground">{config.label}</span>

			<button
				type="button"
				onClick={triggerSync}
				disabled={isDisabled}
				aria-label="Sync now"
				className="rounded px-2 py-0.5 text-xs border border-border text-muted-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Sync now
			</button>

			{quotaWarning && (
				<span className="text-xs text-yellow-500">
					Storage usage at {Math.round(quotaUsage * 100)}%
				</span>
			)}
		</div>
	);
}
