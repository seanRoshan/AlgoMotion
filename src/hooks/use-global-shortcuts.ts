import { useEffect } from 'react';
import { matchesKeyEvent, shortcutRegistry } from '@/lib/shortcuts/shortcut-registry';
import { useHistoryStore } from '@/lib/stores/history-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { useUIStore } from '@/lib/stores/ui-store';

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;

/**
 * Returns true if the active element is a text input where
 * keyboard shortcuts should be suppressed.
 */
function isTextInputFocused(): boolean {
	const el = document.activeElement;
	if (!el) return false;

	const tag = el.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
	if ((el as HTMLElement).isContentEditable || el.getAttribute('contenteditable') === 'true')
		return true;

	return false;
}

/**
 * Shortcut action handlers keyed by shortcut ID.
 * Returns a record mapping shortcut IDs to their action callbacks.
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
			// Save is handled elsewhere — this just prevents browser save dialog
		},
		'zoom-in': () => {
			const { camera, setCamera } = useSceneStore.getState();
			setCamera({ zoom: Math.min(camera.zoom + ZOOM_STEP, ZOOM_MAX) });
		},
		'zoom-out': () => {
			const { camera, setCamera } = useSceneStore.getState();
			setCamera({ zoom: Math.max(camera.zoom - ZOOM_STEP, ZOOM_MIN) });
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

/**
 * Binds global keyboard shortcuts to the document.
 *
 * Context-aware: shortcuts are suppressed when a text input,
 * textarea, or contenteditable element is focused.
 *
 * This replaces the inline keyboard handlers in EditorLayout
 * with a centralized system backed by the shortcut registry.
 */
export function useGlobalShortcuts(): void {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (isTextInputFocused()) return;

			const actions = getActions();

			for (const shortcut of shortcutRegistry) {
				if (matchesKeyEvent(shortcut.keys, e)) {
					const action = actions[shortcut.id];
					if (action) {
						e.preventDefault();
						action();
					}
					return;
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);
}
