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
import { ToolSelector } from './tool-selector';

function ToolbarButton({
	icon: Icon,
	label,
	shortcut,
	disabled,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	shortcut?: string;
	disabled?: boolean;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
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

export function Toolbar() {
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
				<ToolbarButton icon={Undo2} label="Undo" shortcut="Ctrl+Z" disabled />
				<ToolbarButton icon={Redo2} label="Redo" shortcut="Ctrl+Shift+Z" disabled />

				<Separator orientation="vertical" className="mx-1 h-5" />

				<ToolbarButton icon={Minus} label="Zoom out" shortcut="Ctrl+-" />
				<span className="min-w-[3rem] text-center text-xs text-muted-foreground">100%</span>
				<ToolbarButton icon={Plus} label="Zoom in" shortcut="Ctrl+=" />
				<ToolbarButton icon={Maximize} label="Fit to screen" shortcut="Ctrl+0" />

				<Separator orientation="vertical" className="mx-1 h-5" />

				<div className="flex items-center gap-0.5 rounded-md bg-secondary/50 px-1">
					<ToolbarButton icon={SkipBack} label="Step back" />
					<ToolbarButton icon={Play} label="Play" shortcut="Space" />
					<ToolbarButton icon={Pause} label="Pause" />
					<ToolbarButton icon={Square} label="Stop" />
					<ToolbarButton icon={SkipForward} label="Step forward" />
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
							1x
							<ChevronDown className="h-3 w-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>0.25x</DropdownMenuItem>
						<DropdownMenuItem>0.5x</DropdownMenuItem>
						<DropdownMenuItem>1x</DropdownMenuItem>
						<DropdownMenuItem>2x</DropdownMenuItem>
						<DropdownMenuItem>4x</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
