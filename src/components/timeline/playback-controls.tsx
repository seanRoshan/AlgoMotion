'use client';

import { Pause, Play, Repeat, SkipBack, SkipForward, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import type { PlaybackSpeed } from '@/types';

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 1.5, 2, 4];
const STEP_SIZE = 0.1; // seconds per step

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const frames = Math.floor((seconds % 1) * 100);
	if (mins > 0) {
		return `${mins}:${String(secs).padStart(2, '0')}`;
	}
	return `${secs}:${String(frames).padStart(2, '0')}`;
}

export function PlaybackControls() {
	const status = useTimelineStore((s) => s.playback.status);
	const speed = useTimelineStore((s) => s.playback.speed);
	const currentTime = useTimelineStore((s) => s.playback.currentTime);
	const loop = useTimelineStore((s) => s.playback.loop);
	const duration = useTimelineStore((s) => s.duration);
	const play = useTimelineStore((s) => s.play);
	const pause = useTimelineStore((s) => s.pause);
	const stop = useTimelineStore((s) => s.stop);
	const seek = useTimelineStore((s) => s.seek);
	const setSpeed = useTimelineStore((s) => s.setSpeed);
	const toggleLoop = useTimelineStore((s) => s.toggleLoop);

	const isPlaying = status === 'playing';

	function handlePlayPause() {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}

	function handleStepBackward() {
		seek(Math.max(0, currentTime - STEP_SIZE));
	}

	function handleStepForward() {
		seek(Math.min(duration, currentTime + STEP_SIZE));
	}

	return (
		<TooltipProvider delayDuration={300}>
			<div className="flex items-center gap-1">
				{/* Time display */}
				<span className="min-w-[48px] text-right font-mono text-xs text-muted-foreground">
					{formatTime(currentTime)}
				</span>

				<div className="mx-1 h-4 w-px bg-border" />

				{/* Step backward */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={handleStepBackward}
							aria-label="Step backward"
						>
							<SkipBack className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Step backward</TooltipContent>
				</Tooltip>

				{/* Stop */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={stop}
							aria-label="Stop"
						>
							<Square className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Stop</TooltipContent>
				</Tooltip>

				{/* Play / Pause */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handlePlayPause}
							aria-label={isPlaying ? 'Pause' : 'Play'}
						>
							{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
						</Button>
					</TooltipTrigger>
					<TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
				</Tooltip>

				{/* Step forward */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={handleStepForward}
							aria-label="Step forward"
						>
							<SkipForward className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Step forward</TooltipContent>
				</Tooltip>

				<div className="mx-1 h-4 w-px bg-border" />

				{/* Loop toggle */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={loop ? 'secondary' : 'ghost'}
							size="icon"
							className="h-6 w-6"
							onClick={toggleLoop}
							aria-label="Toggle loop"
						>
							<Repeat className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Toggle loop</TooltipContent>
				</Tooltip>

				{/* Speed selector */}
				<Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v) as PlaybackSpeed)}>
					<SelectTrigger className="h-6 w-14 text-xs" aria-label="Playback speed">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SPEEDS.map((s) => (
							<SelectItem key={s} value={String(s)} className="text-xs">
								{s}x
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</TooltipProvider>
	);
}
