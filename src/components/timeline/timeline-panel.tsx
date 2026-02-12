'use client';

import { PlaybackControls } from './playback-controls';
import { TimelineScrubber } from './timeline-scrubber';

/**
 * Main timeline panel combining playback controls and scrubber.
 * Displayed in the bottom panel's Timeline tab.
 */
export function TimelinePanel() {
	return (
		<div className="flex h-full flex-col">
			{/* Controls bar */}
			<div className="flex items-center gap-2 border-b px-2 py-1">
				<PlaybackControls />
				<TimelineScrubber />
			</div>

			{/* Track area (placeholder for keyframe tracks) */}
			<div className="flex flex-1 items-center justify-center">
				<p className="text-xs text-muted-foreground/60">Select elements to view animation tracks</p>
			</div>
		</div>
	);
}
