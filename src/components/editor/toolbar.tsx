'use client';

import {
	ChevronDown,
	Maximize,
	Minus,
	Pause,
	Play,
	Plus,
	Redo2,
	SkipBack,
	SkipForward,
	Square,
	Undo2,
} from 'lucide-react';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarTrigger,
} from '@/components/ui/menubar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { canRedo, canUndo, useHistoryStore } from '@/lib/stores/history-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import type { PlaybackSpeed } from '@/types';
import { ThemeToggle } from './theme-toggle';
import { ToolSelector } from './tool-selector';

function ToolbarButton({
	icon: Icon,
	label,
	shortcut,
	disabled,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	shortcut?: string;
	disabled?: boolean;
	onClick?: () => void;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					disabled={disabled}
					aria-label={label}
					onClick={onClick}
				>
					<Icon className="h-4 w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>
					{label}
					{shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}
				</p>
			</TooltipContent>
		</Tooltip>
	);
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.25, 0.5, 1, 1.5, 2, 4];

export function Toolbar() {
	const undoDisabled = useHistoryStore((s) => !canUndo(s));
	const redoDisabled = useHistoryStore((s) => !canRedo(s));
	const undo = useHistoryStore((s) => s.undo);
	const redo = useHistoryStore((s) => s.redo);

	const zoom = useSceneStore((s) => s.camera.zoom);

	const speed = useTimelineStore((s) => s.playback.speed);
	const play = useTimelineStore((s) => s.play);
	const pause = useTimelineStore((s) => s.pause);
	const stop = useTimelineStore((s) => s.stop);
	const setSpeed = useTimelineStore((s) => s.setSpeed);

	const zoomPercent = `${Math.round(zoom * 100)}%`;

	return (
		<div className="flex h-11 items-center border-b px-2" role="toolbar" aria-label="Main toolbar">
			<div className="flex items-center gap-1">
				<AppLogo linkTo="/" />
				<Separator orientation="vertical" className="mx-2 h-5" />
				<Menubar className="border-none bg-transparent p-0 shadow-none">
					<MenubarMenu>
						<MenubarTrigger className="h-7 px-2 text-xs">File</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								New Project <MenubarShortcut>Ctrl+N</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>Export...</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger className="h-7 px-2 text-xs">Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Redo <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>
								Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Delete <MenubarShortcut>Del</MenubarShortcut>
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger className="h-7 px-2 text-xs">View</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>
								Toggle Left Panel <MenubarShortcut>Ctrl+B</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Toggle Right Panel <MenubarShortcut>Ctrl+I</MenubarShortcut>
							</MenubarItem>
							<MenubarItem>
								Toggle Bottom Panel <MenubarShortcut>Ctrl+`</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>
								Command Palette <MenubarShortcut>Ctrl+K</MenubarShortcut>
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger className="h-7 px-2 text-xs">Insert</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Rectangle</MenubarItem>
							<MenubarItem>Ellipse</MenubarItem>
							<MenubarItem>Text</MenubarItem>
							<MenubarItem>Arrow</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>Data Structure...</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</div>

			<div className="flex flex-1 items-center justify-center">
				<ToolSelector />
			</div>

			<div className="flex items-center gap-1">
				<ToolbarButton
					icon={Undo2}
					label="Undo"
					shortcut="Ctrl+Z"
					disabled={undoDisabled}
					onClick={undo}
				/>
				<ToolbarButton
					icon={Redo2}
					label="Redo"
					shortcut="Ctrl+Shift+Z"
					disabled={redoDisabled}
					onClick={redo}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				<ToolbarButton icon={Minus} label="Zoom out" shortcut="Ctrl+-" />
				<span className="min-w-[3rem] text-center text-xs text-muted-foreground">
					{zoomPercent}
				</span>
				<ToolbarButton icon={Plus} label="Zoom in" shortcut="Ctrl+=" />
				<ToolbarButton icon={Maximize} label="Fit to screen" shortcut="Ctrl+0" />

				<Separator orientation="vertical" className="mx-1 h-5" />

				<div className="flex items-center gap-0.5 rounded-md bg-secondary/50 px-1">
					<ToolbarButton icon={SkipBack} label="Step back" />
					<ToolbarButton icon={Play} label="Play" shortcut="Space" onClick={play} />
					<ToolbarButton icon={Pause} label="Pause" onClick={pause} />
					<ToolbarButton icon={Square} label="Stop" onClick={stop} />
					<ToolbarButton icon={SkipForward} label="Step forward" />
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
							{speed}x
							<ChevronDown className="h-3 w-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{SPEED_OPTIONS.map((s) => (
							<DropdownMenuItem key={s} onSelect={() => setSpeed(s)}>
								{s}x
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				<Separator orientation="vertical" className="mx-1 h-5" />

				<ThemeToggle />
			</div>
		</div>
	);
}
