'use client';

import { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { useTimelineStore } from '@/lib/stores/timeline-store';

/**
 * Generate time ruler marks for the timeline.
 * Shows marks at 1s intervals for short timelines, 5s for longer ones.
 */
function generateTimeMarks(duration: number): { time: number; label: string }[] {
	if (duration <= 0) return [{ time: 0, label: '0s' }];

	const interval = duration <= 10 ? 1 : duration <= 60 ? 5 : 10;
	const marks: { time: number; label: string }[] = [];

	for (let t = 0; t <= duration; t += interval) {
		marks.push({ time: t, label: `${t}s` });
	}

	return marks;
}

/**
 * Timeline scrubber with draggable playhead and time ruler.
 * Connects to the timeline store for seek operations.
 */
export function TimelineScrubber() {
	const currentTime = useTimelineStore((s) => s.playback.currentTime);
	const duration = useTimelineStore((s) => s.duration);
	const seek = useTimelineStore((s) => s.seek);

	const timeMarks = useMemo(() => generateTimeMarks(duration), [duration]);

	function handleSeek(value: number[]) {
		seek(value[0]);
	}

	return (
		<div className="flex flex-1 flex-col gap-1">
			{/* Time ruler */}
			<div className="relative h-4 px-2">
				{timeMarks.map((mark) => (
					<span
						key={mark.time}
						className="absolute top-0 -translate-x-1/2 text-[9px] text-muted-foreground/60"
						style={{
							left: duration > 0 ? `${(mark.time / duration) * 100}%` : '0%',
						}}
					>
						{mark.label}
					</span>
				))}
			</div>

			{/* Scrubber slider */}
			<div className="px-2">
				<Slider
					value={[currentTime]}
					min={0}
					max={duration}
					step={0.01}
					onValueChange={handleSeek}
					aria-label="Timeline scrubber"
				/>
			</div>
		</div>
	);
}
