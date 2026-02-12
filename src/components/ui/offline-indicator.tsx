/**
 * Offline status banner.
 *
 * Displays a small banner at the top of the editor when
 * the user is offline. Changes to sync store are queued
 * automatically — this is purely informational.
 *
 * Spec reference: Section 17 (Offline Support)
 */

'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineIndicator() {
	const isOnline = useOnlineStatus();

	if (isOnline) return null;

	return (
		<output className="flex items-center justify-center gap-2 bg-yellow-500/90 px-3 py-1.5 text-xs font-medium text-yellow-950">
			<span className="inline-block h-2 w-2 rounded-full bg-yellow-950/60" />
			You are offline. Changes are saved locally and will sync when reconnected.
		</output>
	);
}
