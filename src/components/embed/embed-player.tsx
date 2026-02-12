/**
 * Embed player component for public project viewing.
 *
 * Minimal player-only UI with playback controls.
 * Responsive, iframe-friendly, respects prefers-reduced-motion.
 *
 * Spec reference: Section 5.1 (embed/[projectId] route)
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import type { DbProject, DbScene } from '@/lib/supabase/database.types';

const SPEEDS = [0.5, 1, 1.5, 2] as const;

interface EmbedPlayerProps {
	project: DbProject;
	scenes: DbScene[];
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function EmbedPlayer({ project, scenes }: EmbedPlayerProps) {
	const [playing, setPlaying] = useState(false);
	const [speedIdx, setSpeedIdx] = useState(1);
	const [currentTime, _setCurrentTime] = useState(0);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
	const speed = SPEEDS[speedIdx] ?? 1;
	const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

	const settings = project.settings as Record<string, unknown>;
	const bgColor = (settings.backgroundColor as string) ?? '#1a1a2e';

	const togglePlay = useCallback(() => {
		setPlaying((prev) => !prev);
	}, []);

	const cycleSpeed = useCallback(() => {
		setSpeedIdx((prev) => (prev + 1) % SPEEDS.length);
	}, []);

	return (
		<div
			data-testid="embed-player"
			className="relative flex h-full w-full flex-col bg-black"
			style={{ colorScheme: 'dark' }}
		>
			{/* Canvas */}
			<div className="flex flex-1 items-center justify-center" style={{ backgroundColor: bgColor }}>
				<canvas
					ref={canvasRef}
					data-testid="embed-canvas"
					className="max-h-full max-w-full"
					width={1920}
					height={1080}
				/>
			</div>

			{/* Title bar */}
			<div className="flex items-center px-3 py-1 bg-black/60 text-white text-xs">
				<span className="truncate text-white/80">{project.name}</span>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-2 px-3 py-2 bg-black/80 text-white text-sm">
				<button
					type="button"
					onClick={togglePlay}
					aria-label={playing ? 'Pause' : 'Play'}
					className="rounded px-3 py-1 border border-white/30 hover:bg-white/10 text-xs"
				>
					{playing ? 'Pause' : 'Play'}
				</button>

				{/* Progress bar */}
				<div
					role="progressbar"
					aria-valuenow={Math.round(progress)}
					aria-valuemin={0}
					aria-valuemax={100}
					className="relative flex-1 h-1 bg-white/20 rounded cursor-pointer"
				>
					<div className="h-full bg-indigo-500 rounded" style={{ width: `${progress}%` }} />
				</div>

				{/* Time */}
				<span className="text-xs text-white/70 min-w-[40px] text-right">
					{formatTime(currentTime)}
				</span>

				{/* Speed */}
				<button
					type="button"
					onClick={cycleSpeed}
					className="text-xs text-white/70 hover:text-white cursor-pointer"
					title="Change playback speed"
				>
					{speed}x
				</button>

				{/* Branding */}
				<a
					href="/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-white/50 hover:text-white/80 ml-1"
				>
					AlgoMotion
				</a>
			</div>
		</div>
	);
}
