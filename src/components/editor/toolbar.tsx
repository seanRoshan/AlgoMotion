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
import { toast } from 'sonner';
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
import { saveProject } from '@/hooks/use-auto-save';
import { useExportStore } from '@/lib/stores/export-store';
import { canRedo, canUndo, useHistoryStore } from '@/lib/stores/history-store';
import { useProjectStore } from '@/lib/stores/project-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { useUIStore } from '@/lib/stores/ui-store';
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

function handleNewProject() {
	const { isDirty } = useProjectStore.getState();
	if (isDirty) {
		const confirmed = window.confirm(
			'You have unsaved changes. Are you sure you want to create a new project?',
		);
		if (!confirmed) return;
	}
	useSceneStore.getState().reset();
	useHistoryStore.getState().clearHistory();
	useTimelineStore.getState().reset();
	useProjectStore.getState().clearProject();
	toast.success('New project created');
}

async function handleSave() {
	try {
		await saveProject();
		toast.success('Project saved');
	} catch {
		toast.error('Failed to save project');
	}
}

function handleExport() {
	useExportStore.getState().setDialogOpen(true);
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;
const STEP_INCREMENT = 0.1;

function handleZoomIn() {
	const { camera, setCamera } = useSceneStore.getState();
	setCamera({ zoom: Math.min(camera.zoom + ZOOM_STEP, ZOOM_MAX) });
}

function handleZoomOut() {
	const { camera, setCamera } = useSceneStore.getState();
	setCamera({ zoom: Math.max(camera.zoom - ZOOM_STEP, ZOOM_MIN) });
}

function handleFitToScreen() {
	useSceneStore.getState().setCamera({ zoom: 1, x: 0, y: 0 });
}

function handleStepBack() {
	const { playback, seek } = useTimelineStore.getState();
	seek(Math.max(playback.currentTime - STEP_INCREMENT, 0));
}

function handleStepForward() {
	const { playback, seek, duration } = useTimelineStore.getState();
	seek(Math.min(playback.currentTime + STEP_INCREMENT, duration));
}

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
							<MenubarItem onSelect={handleNewProject}>
								New Project <MenubarShortcut>Ctrl+N</MenubarShortcut>
							</MenubarItem>
							<MenubarItem onSelect={handleSave}>
								Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem onSelect={handleExport}>Export...</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger className="h-7 px-2 text-xs">Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem onSelect={() => useHistoryStore.getState().undo()}>
								Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
							</MenubarItem>
							<MenubarItem onSelect={() => useHistoryStore.getState().redo()}>
								Redo <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem onSelect={() => useSceneStore.getState().copySelected()}>
								Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
							</MenubarItem>
							<MenubarItem onSelect={() => useSceneStore.getState().paste()}>
								Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
							</MenubarItem>
							<MenubarItem onSelect={() => useSceneStore.getState().deleteSelected()}>
								Delete <MenubarShortcut>Del</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem onSelect={() => useSceneStore.getState().selectAll()}>
								Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
							</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger className="h-7 px-2 text-xs">View</MenubarTrigger>
						<MenubarContent>
							<MenubarItem onSelect={() => useUIStore.getState().togglePanel('left')}>
								Toggle Left Panel <MenubarShortcut>Ctrl+B</MenubarShortcut>
							</MenubarItem>
							<MenubarItem onSelect={() => useUIStore.getState().togglePanel('right')}>
								Toggle Right Panel <MenubarShortcut>Ctrl+I</MenubarShortcut>
							</MenubarItem>
							<MenubarItem onSelect={() => useUIStore.getState().togglePanel('bottom')}>
								Toggle Bottom Panel <MenubarShortcut>Ctrl+`</MenubarShortcut>
							</MenubarItem>
							<MenubarSeparator />
							<MenubarItem onSelect={() => useUIStore.getState().toggleCommandPalette()}>
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

				<ToolbarButton icon={Minus} label="Zoom out" shortcut="Ctrl+-" onClick={handleZoomOut} />
				<span className="min-w-[3rem] text-center text-xs text-muted-foreground">
					{zoomPercent}
				</span>
				<ToolbarButton icon={Plus} label="Zoom in" shortcut="Ctrl+=" onClick={handleZoomIn} />
				<ToolbarButton
					icon={Maximize}
					label="Fit to screen"
					shortcut="Ctrl+0"
					onClick={handleFitToScreen}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				<div className="flex items-center gap-0.5 rounded-md bg-secondary/50 px-1">
					<ToolbarButton icon={SkipBack} label="Step back" onClick={handleStepBack} />
					<ToolbarButton icon={Play} label="Play" shortcut="Space" onClick={play} />
					<ToolbarButton icon={Pause} label="Pause" onClick={pause} />
					<ToolbarButton icon={Square} label="Stop" onClick={stop} />
					<ToolbarButton icon={SkipForward} label="Step forward" onClick={handleStepForward} />
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
