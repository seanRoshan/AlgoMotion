import { afterEach, describe, expect, it } from 'vitest';
import type { SceneElement } from '@/types';
import { useSceneStore } from './scene-store';

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

function setupElements() {
	const store = useSceneStore.getState();
	const el1 = makeElement({ id: 'el-1', position: { x: 10, y: 20 } });
	const el2 = makeElement({ id: 'el-2', position: { x: 100, y: 200 } });
	const el3 = makeElement({ id: 'el-3', position: { x: 300, y: 400 }, locked: true });
	store.addElement(el1);
	store.addElement(el2);
	store.addElement(el3);
	return { el1, el2, el3 };
}

afterEach(() => {
	useSceneStore.getState().reset();
});

describe('scene store interaction actions', () => {
	describe('selectAll', () => {
		it('selects all non-locked elements', () => {
			setupElements();
			useSceneStore.getState().selectAll();
			const { selectedIds } = useSceneStore.getState();
			expect(selectedIds).toContain('el-1');
			expect(selectedIds).toContain('el-2');
			expect(selectedIds).not.toContain('el-3'); // locked
		});

		it('selects nothing when all elements are locked', () => {
			const store = useSceneStore.getState();
			store.addElement(makeElement({ id: 'locked-1', locked: true }));
			store.addElement(makeElement({ id: 'locked-2', locked: true }));
			store.selectAll();
			expect(useSceneStore.getState().selectedIds).toHaveLength(0);
		});
	});

	describe('deleteSelected', () => {
		it('removes selected elements', () => {
			setupElements();
			const store = useSceneStore.getState();
			store.selectMultiple(['el-1', 'el-2']);
			store.deleteSelected();

			const state = useSceneStore.getState();
			expect(state.elementIds).not.toContain('el-1');
			expect(state.elementIds).not.toContain('el-2');
			expect(state.elementIds).toContain('el-3');
			expect(state.selectedIds).toHaveLength(0);
		});

		it('removes connections attached to deleted elements', () => {
			setupElements();
			const store = useSceneStore.getState();
			store.addConnection({
				id: 'conn-1',
				fromElementId: 'el-1',
				toElementId: 'el-2',
				fromAnchor: 'right',
				toAnchor: 'left',
				type: 'straight',
				style: {
					stroke: '#fff',
					strokeWidth: 1,
					animated: false,
					arrowHead: 'none',
					arrowTail: 'none',
				},
			});
			store.selectElement('el-1');
			store.deleteSelected();

			const state = useSceneStore.getState();
			expect(state.connectionIds).not.toContain('conn-1');
		});

		it('does nothing when nothing is selected', () => {
			setupElements();
			useSceneStore.getState().deleteSelected();
			expect(useSceneStore.getState().elementIds).toHaveLength(3);
		});
	});

	describe('duplicateSelected', () => {
		it('creates copies with offset positions', () => {
			setupElements();
			const store = useSceneStore.getState();
			store.selectElement('el-1');
			store.duplicateSelected();

			const state = useSceneStore.getState();
			// Original + 2 others + 1 duplicate = 4
			expect(state.elementIds).toHaveLength(4);

			// Find the duplicate (not el-1, el-2, or el-3)
			const dupeId = state.elementIds.find((id) => id !== 'el-1' && id !== 'el-2' && id !== 'el-3');
			expect(dupeId).toBeDefined();
			const dupe = dupeId ? state.elements[dupeId] : undefined;
			expect(dupe?.position.x).toBe(30); // 10 + 20 offset
			expect(dupe?.position.y).toBe(40); // 20 + 20 offset
		});

		it('selects only the duplicated elements', () => {
			setupElements();
			const store = useSceneStore.getState();
			store.selectElement('el-1');
			store.duplicateSelected();

			const state = useSceneStore.getState();
			expect(state.selectedIds).not.toContain('el-1');
			expect(state.selectedIds).toHaveLength(1);
		});

		it('does nothing when nothing is selected', () => {
			setupElements();
			useSceneStore.getState().duplicateSelected();
			expect(useSceneStore.getState().elementIds).toHaveLength(3);
		});
	});

	describe('nudgeSelected', () => {
		it('moves selected elements by dx, dy', () => {
			setupElements();
			const store = useSceneStore.getState();
			store.selectMultiple(['el-1', 'el-2']);
			store.nudgeSelected(5, -3);

			const state = useSceneStore.getState();
			expect(state.elements['el-1']?.position).toEqual({ x: 15, y: 17 });
			expect(state.elements['el-2']?.position).toEqual({ x: 105, y: 197 });
		});

		it('does not move unselected elements', () => {
			setupElements();
			const store = useSceneStore.getState();
			store.selectElement('el-1');
			store.nudgeSelected(10, 10);

			expect(useSceneStore.getState().elements['el-2']?.position).toEqual({ x: 100, y: 200 });
		});
	});

	describe('moveElements', () => {
		it('batch-updates positions for multiple elements', () => {
			setupElements();
			useSceneStore.getState().moveElements({
				'el-1': { x: 50, y: 60 },
				'el-2': { x: 250, y: 350 },
			});

			const state = useSceneStore.getState();
			expect(state.elements['el-1']?.position).toEqual({ x: 50, y: 60 });
			expect(state.elements['el-2']?.position).toEqual({ x: 250, y: 350 });
		});

		it('ignores non-existent element IDs', () => {
			setupElements();
			expect(() => {
				useSceneStore.getState().moveElements({
					nonexistent: { x: 0, y: 0 },
				});
			}).not.toThrow();
		});
	});

	describe('resizeElement', () => {
		it('updates size and position', () => {
			setupElements();
			useSceneStore.getState().resizeElement('el-1', { width: 200, height: 150 }, { x: 5, y: 10 });

			const el = useSceneStore.getState().elements['el-1'];
			expect(el?.size).toEqual({ width: 200, height: 150 });
			expect(el?.position).toEqual({ x: 5, y: 10 });
		});
	});

	describe('rotateElement', () => {
		it('updates rotation', () => {
			setupElements();
			useSceneStore.getState().rotateElement('el-1', 45);

			expect(useSceneStore.getState().elements['el-1']?.rotation).toBe(45);
		});
	});
});
