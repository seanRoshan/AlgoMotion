import { afterEach, describe, expect, it } from 'vitest';
import { useHistoryStore } from '@/lib/stores/history-store';
import { useSceneStore } from '@/lib/stores/scene-store';
import type { SceneElement } from '@/types';

// Direct unit test of the keyboard handler logic without React rendering.
// We simulate what useCanvasKeyboard does by calling store methods directly.

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: `el-${Math.random().toString(36).slice(2, 8)}`,
		type: 'rect',
		position: { x: 100, y: 200 },
		size: { width: 120, height: 80 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: {
			fill: '#2a2a4a',
			stroke: '#4a4a6a',
			strokeWidth: 2,
			cornerRadius: 0,
			fontSize: 14,
			fontFamily: 'sans-serif',
			fontWeight: 500,
			textColor: '#ffffff',
		},
		metadata: {},
		...overrides,
	};
}

afterEach(() => {
	useHistoryStore.getState().clearHistory();
	useSceneStore.getState().reset();
});

describe('canvas keyboard shortcuts (store-level)', () => {
	it('Delete removes selected elements', () => {
		const store = useSceneStore.getState();
		const el = makeElement({ id: 'el-1' });
		store.addElement(el);
		store.selectElement('el-1');
		store.deleteSelected();

		expect(useSceneStore.getState().elementIds).not.toContain('el-1');
	});

	it('Ctrl+A selects all non-locked elements', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-1' }));
		store.addElement(makeElement({ id: 'el-2', locked: true }));
		store.selectAll();

		const { selectedIds } = useSceneStore.getState();
		expect(selectedIds).toContain('el-1');
		expect(selectedIds).not.toContain('el-2');
	});

	it('Ctrl+D duplicates selected elements', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-1', position: { x: 10, y: 20 } }));
		store.selectElement('el-1');
		store.duplicateSelected();

		const state = useSceneStore.getState();
		expect(state.elementIds).toHaveLength(2);
		// Duplicate should be offset
		const dupeId = state.elementIds.find((id) => id !== 'el-1');
		expect(dupeId).toBeDefined();
		const dupe = dupeId ? state.elements[dupeId] : undefined;
		expect(dupe?.position.x).toBe(30);
		expect(dupe?.position.y).toBe(40);
	});

	it('Escape deselects all', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-1' }));
		store.selectElement('el-1');
		store.deselectAll();

		expect(useSceneStore.getState().selectedIds).toHaveLength(0);
	});

	it('Arrow keys nudge by 1px', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-1', position: { x: 100, y: 200 } }));
		store.selectElement('el-1');
		store.nudgeSelected(0, -1); // ArrowUp

		expect(useSceneStore.getState().elements['el-1']?.position).toEqual({
			x: 100,
			y: 199,
		});
	});

	it('Shift+Arrow nudges by 10px', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-1', position: { x: 100, y: 200 } }));
		store.selectElement('el-1');
		store.nudgeSelected(10, 0); // Shift+ArrowRight

		expect(useSceneStore.getState().elements['el-1']?.position).toEqual({
			x: 110,
			y: 200,
		});
	});

	it('Ctrl+Z undoes the last action', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-undo', position: { x: 10, y: 20 } }));
		expect(useSceneStore.getState().elements['el-undo']).toBeDefined();

		// Simulate Ctrl+Z by calling undo directly
		useHistoryStore.getState().undo();

		expect(useSceneStore.getState().elements['el-undo']).toBeUndefined();
	});

	it('Ctrl+Shift+Z redoes the last undone action', () => {
		const store = useSceneStore.getState();
		store.addElement(makeElement({ id: 'el-redo', position: { x: 10, y: 20 } }));
		useHistoryStore.getState().undo();
		expect(useSceneStore.getState().elements['el-redo']).toBeUndefined();

		// Simulate Ctrl+Shift+Z by calling redo directly
		useHistoryStore.getState().redo();

		expect(useSceneStore.getState().elements['el-redo']).toBeDefined();
	});
});
