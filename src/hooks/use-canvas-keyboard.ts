import { useEffect } from 'react';
import { NUDGE_LARGE, NUDGE_SMALL } from '@/lib/pixi/interactions/interaction-constants';
import { useSceneStore } from '@/lib/stores/scene-store';

/**
 * Callback invoked after keyboard-driven selection changes
 * so the InteractionManager can re-render the selection overlay.
 */
export type OnSelectionChange = () => void;

/**
 * Binds keyboard shortcuts for canvas interactions.
 * Only active when the canvas container has focus.
 *
 * Shortcuts:
 *   Delete/Backspace  — delete selected elements
 *   Ctrl/Cmd+A        — select all
 *   Ctrl/Cmd+D        — duplicate selected
 *   Arrow keys         — nudge selected (1px, or 10px with Shift)
 *   Escape             — deselect all
 */
export function useCanvasKeyboard(
	containerRef: React.RefObject<HTMLElement | null>,
	onSelectionChange?: OnSelectionChange,
): void {
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Make the container focusable (if not already)
		if (!container.getAttribute('tabindex')) {
			container.setAttribute('tabindex', '0');
		}

		function handleKeyDown(e: KeyboardEvent) {
			const store = useSceneStore.getState();
			const isMod = e.metaKey || e.ctrlKey;

			switch (e.key) {
				case 'Delete':
				case 'Backspace': {
					e.preventDefault();
					store.deleteSelected();
					onSelectionChange?.();
					break;
				}

				case 'a':
				case 'A': {
					if (isMod) {
						e.preventDefault();
						store.selectAll();
						onSelectionChange?.();
					}
					break;
				}

				case 'd':
				case 'D': {
					if (isMod) {
						e.preventDefault();
						store.duplicateSelected();
						onSelectionChange?.();
					}
					break;
				}

				case 'Escape': {
					e.preventDefault();
					store.deselectAll();
					onSelectionChange?.();
					break;
				}

				case 'ArrowUp': {
					e.preventDefault();
					const dy = e.shiftKey ? -NUDGE_LARGE : -NUDGE_SMALL;
					store.nudgeSelected(0, dy);
					onSelectionChange?.();
					break;
				}
				case 'ArrowDown': {
					e.preventDefault();
					const dy = e.shiftKey ? NUDGE_LARGE : NUDGE_SMALL;
					store.nudgeSelected(0, dy);
					onSelectionChange?.();
					break;
				}
				case 'ArrowLeft': {
					e.preventDefault();
					const dx = e.shiftKey ? -NUDGE_LARGE : -NUDGE_SMALL;
					store.nudgeSelected(dx, 0);
					onSelectionChange?.();
					break;
				}
				case 'ArrowRight': {
					e.preventDefault();
					const dx = e.shiftKey ? NUDGE_LARGE : NUDGE_SMALL;
					store.nudgeSelected(dx, 0);
					onSelectionChange?.();
					break;
				}
			}
		}

		container.addEventListener('keydown', handleKeyDown);
		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [containerRef, onSelectionChange]);
}
