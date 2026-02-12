'use client';

import { useCallback } from 'react';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from '@/components/ui/command';
import {
	formatShortcut,
	getShortcutsByCategory,
	type ShortcutDefinition,
} from '@/lib/shortcuts/shortcut-registry';
import { useHistoryStore } from '@/lib/stores/history-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { useUIStore } from '@/lib/stores/ui-store';

/**
 * Returns action callbacks keyed by shortcut ID.
 * Mirrors the actions in useGlobalShortcuts for consistency.
 */
function getActions(): Record<string, () => void> {
	return {
		'play-pause': () => {
			const { playback, play, pause } = useTimelineStore.getState();
			if (playback.status === 'playing') {
				pause();
			} else {
				play();
			}
		},
		undo: () => useHistoryStore.getState().undo(),
		redo: () => useHistoryStore.getState().redo(),
		save: () => {
			// Triggers auto-save via store
		},
		'zoom-in': () => {
			const { camera, setCamera } = useSceneStore.getState();
			setCamera({ zoom: Math.min(camera.zoom + 0.25, 5) });
		},
		'zoom-out': () => {
			const { camera, setCamera } = useSceneStore.getState();
			setCamera({ zoom: Math.max(camera.zoom - 0.25, 0.1) });
		},
		'fit-to-screen': () => {
			useSceneStore.getState().setCamera({ zoom: 1, x: 0, y: 0 });
		},
		'toggle-grid': () => useUIStore.getState().toggleGrid(),
		'toggle-left-panel': () => useUIStore.getState().togglePanel('left'),
		'toggle-right-panel': () => useUIStore.getState().togglePanel('right'),
		'toggle-bottom-panel': () => useUIStore.getState().togglePanel('bottom'),
	};
}

export function CommandPalette() {
	const open = useUIStore((s) => s.commandPaletteOpen);
	const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
	const grouped = getShortcutsByCategory();
	const actions = getActions();

	const handleSelect = useCallback(
		(shortcut: ShortcutDefinition) => {
			const action = actions[shortcut.id];
			if (action) {
				action();
			}
			setOpen(false);
		},
		[actions, setOpen],
	);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Search commands..." />
			<CommandList>
				<CommandEmpty>No commands found.</CommandEmpty>
				{Object.entries(grouped).map(([category, shortcuts]) => (
					<CommandGroup key={category} heading={category}>
						{shortcuts.map((shortcut) => (
							<CommandItem
								key={shortcut.id}
								value={shortcut.label}
								onSelect={() => handleSelect(shortcut)}
							>
								{shortcut.label}
								<CommandShortcut>
									{shortcut.displayShortcut ?? formatShortcut(shortcut.keys)}
								</CommandShortcut>
							</CommandItem>
						))}
					</CommandGroup>
				))}
			</CommandList>
		</CommandDialog>
	);
}
