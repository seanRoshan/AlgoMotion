/**
 * Hook that announces playback state changes to screen readers.
 *
 * Subscribes to timeline store changes and announces
 * play/pause/stop transitions via the announcer store.
 *
 * Spec reference: Section 11 (Screen reader announcements)
 */

'use client';

import { useEffect, useRef } from 'react';
import { announce } from '@/lib/stores/announcer-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import type { PlaybackStatus } from '@/types';

const STATUS_MESSAGES: Record<PlaybackStatus, string> = {
	idle: '',
	playing: 'Animation playing',
	paused: 'Animation paused',
	stopped: 'Animation stopped',
};

export function usePlaybackAnnouncer(): void {
	const status = useTimelineStore((s) => s.playback.status);
	const prevStatusRef = useRef<PlaybackStatus>(status);

	useEffect(() => {
		if (status !== prevStatusRef.current) {
			prevStatusRef.current = status;
			const message = STATUS_MESSAGES[status];
			if (message) {
				announce(message);
			}
		}
	}, [status]);
}
