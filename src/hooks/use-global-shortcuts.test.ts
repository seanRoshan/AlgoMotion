import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHistoryStore } from '@/lib/stores/history-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useGlobalShortcuts } from './use-global-shortcuts';

// Mock pixi.js for SceneManager dependency chain
vi.mock('pixi.js', () => ({}));

function fireKey(key: string, mods: Partial<KeyboardEventInit> = {}) {
	act(() => {
		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key,
				bubbles: true,
				...mods,
			}),
		);
	});
}

describe('useGlobalShortcuts', () => {
	beforeEach(() => {
		useUIStore.getState().reset();
		useTimelineStore.getState().reset();
		useSceneStore.getState().reset();
		useHistoryStore.getState().clearHistory();
	});

	afterEach(() => {
		cleanup();
	});

	it('mounts and unmounts without errors', () => {
		const { unmount } = renderHook(() => useGlobalShortcuts());
		unmount();
	});

	describe('playback shortcuts', () => {
		it('Space toggles play/pause', () => {
			renderHook(() => useGlobalShortcuts());

			expect(useTimelineStore.getState().playback.status).toBe('idle');
			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe('playing');
			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe('paused');
		});
	});

	describe('undo/redo shortcuts', () => {
		it('Ctrl+Z calls undo', () => {
			const undoSpy = vi.spyOn(useHistoryStore.getState(), 'undo');
			renderHook(() => useGlobalShortcuts());

			fireKey('z', { ctrlKey: true });
			expect(undoSpy).toHaveBeenCalled();
			undoSpy.mockRestore();
		});

		it('Ctrl+Shift+Z calls redo', () => {
			const redoSpy = vi.spyOn(useHistoryStore.getState(), 'redo');
			renderHook(() => useGlobalShortcuts());

			fireKey('z', { ctrlKey: true, shiftKey: true });
			expect(redoSpy).toHaveBeenCalled();
			redoSpy.mockRestore();
		});
	});

	describe('zoom shortcuts', () => {
		it('Ctrl+= zooms in', () => {
			renderHook(() => useGlobalShortcuts());
			const initialZoom = useSceneStore.getState().camera.zoom;

			fireKey('=', { ctrlKey: true });
			expect(useSceneStore.getState().camera.zoom).toBeGreaterThan(initialZoom);
		});

		it('Ctrl+- zooms out', () => {
			renderHook(() => useGlobalShortcuts());
			const initialZoom = useSceneStore.getState().camera.zoom;

			fireKey('-', { ctrlKey: true });
			expect(useSceneStore.getState().camera.zoom).toBeLessThan(initialZoom);
		});

		it('Ctrl+0 resets zoom to 1', () => {
			renderHook(() => useGlobalShortcuts());
			useSceneStore.getState().setCamera({ zoom: 2.5 });

			fireKey('0', { ctrlKey: true });
			expect(useSceneStore.getState().camera.zoom).toBe(1);
		});
	});

	describe('view shortcuts', () => {
		it('Ctrl+; toggles grid visibility', () => {
			renderHook(() => useGlobalShortcuts());
			expect(useUIStore.getState().gridVisible).toBe(true);

			fireKey(';', { ctrlKey: true });
			expect(useUIStore.getState().gridVisible).toBe(false);

			fireKey(';', { ctrlKey: true });
			expect(useUIStore.getState().gridVisible).toBe(true);
		});
	});

	describe('save shortcut', () => {
		it('Ctrl+S prevents default browser save dialog', () => {
			renderHook(() => useGlobalShortcuts());

			const event = new KeyboardEvent('keydown', {
				key: 's',
				ctrlKey: true,
				bubbles: true,
				cancelable: true,
			});
			const preventSpy = vi.spyOn(event, 'preventDefault');

			act(() => {
				document.dispatchEvent(event);
			});

			expect(preventSpy).toHaveBeenCalled();
		});
	});

	describe('context awareness', () => {
		it('does NOT fire shortcuts when an input element is focused', () => {
			renderHook(() => useGlobalShortcuts());

			const input = document.createElement('input');
			document.body.appendChild(input);
			input.focus();

			const initialStatus = useTimelineStore.getState().playback.status;
			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe(initialStatus);

			document.body.removeChild(input);
		});

		it('does NOT fire shortcuts when a textarea is focused', () => {
			renderHook(() => useGlobalShortcuts());

			const textarea = document.createElement('textarea');
			document.body.appendChild(textarea);
			textarea.focus();

			const initialStatus = useTimelineStore.getState().playback.status;
			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe(initialStatus);

			document.body.removeChild(textarea);
		});

		it('does NOT fire shortcuts when contenteditable element is focused', () => {
			renderHook(() => useGlobalShortcuts());

			const div = document.createElement('div');
			div.setAttribute('contenteditable', 'true');
			document.body.appendChild(div);
			div.focus();

			const initialStatus = useTimelineStore.getState().playback.status;
			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe(initialStatus);

			document.body.removeChild(div);
		});

		it('DOES fire shortcuts when no text input is focused', () => {
			renderHook(() => useGlobalShortcuts());

			// Focus on body (no text input)
			document.body.focus();

			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe('playing');
		});
	});

	describe('cleanup', () => {
		it('removes listener on unmount', () => {
			const { unmount } = renderHook(() => useGlobalShortcuts());
			unmount();

			const initialStatus = useTimelineStore.getState().playback.status;
			fireKey(' ');
			expect(useTimelineStore.getState().playback.status).toBe(initialStatus);
		});
	});
});
