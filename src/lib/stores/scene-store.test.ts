import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Connection, SceneElement } from '@/types';
import { useSceneStore } from './scene-store';

function makeElement(id: string, overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id,
		type: 'rect',
		position: { x: 0, y: 0 },
		size: { width: 100, height: 100 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: {
			fill: '#ffffff',
			stroke: '#000000',
			strokeWidth: 1,
			cornerRadius: 0,
			fontSize: 14,
			fontFamily: 'Inter',
			fontWeight: 400,
			textColor: '#000000',
		},
		metadata: {},
		...overrides,
	};
}

function makeConnection(id: string, from: string, to: string): Connection {
	return {
		id,
		fromElementId: from,
		toElementId: to,
		fromAnchor: 'right',
		toAnchor: 'left',
		type: 'straight',
		style: {
			stroke: '#000000',
			strokeWidth: 1,
			animated: false,
			arrowHead: 'triangle',
			arrowTail: 'none',
		},
	};
}

describe('sceneStore', () => {
	beforeEach(() => {
		useSceneStore.getState().reset();
	});

	afterEach(() => {
		useSceneStore.getState().reset();
	});

	describe('initial state', () => {
		it('starts with empty elements', () => {
			const state = useSceneStore.getState();
			expect(state.elements).toEqual({});
			expect(state.elementIds).toEqual([]);
		});

		it('starts with empty connections', () => {
			const state = useSceneStore.getState();
			expect(state.connections).toEqual({});
			expect(state.connectionIds).toEqual([]);
		});

		it('starts with no selection', () => {
			expect(useSceneStore.getState().selectedIds).toEqual([]);
		});

		it('starts with default camera', () => {
			expect(useSceneStore.getState().camera).toEqual({ x: 0, y: 0, zoom: 1 });
		});
	});

	describe('addElement / removeElement', () => {
		it('adds an element to the store', () => {
			const el = makeElement('el-1');
			useSceneStore.getState().addElement(el);

			const state = useSceneStore.getState();
			expect(state.elements['el-1']).toEqual(el);
			expect(state.elementIds).toContain('el-1');
		});

		it('removes an element from the store', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().removeElement('el-1');

			const state = useSceneStore.getState();
			expect(state.elements['el-1']).toBeUndefined();
			expect(state.elementIds).not.toContain('el-1');
		});

		it('removes element from selectedIds on delete', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().removeElement('el-1');

			expect(useSceneStore.getState().selectedIds).not.toContain('el-1');
		});

		it('removes associated connections when element is deleted', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().addElement(makeElement('el-2'));
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));

			useSceneStore.getState().removeElement('el-1');

			const state = useSceneStore.getState();
			expect(state.connections['conn-1']).toBeUndefined();
			expect(state.connectionIds).not.toContain('conn-1');
		});

		it('removes element with multiple connections', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().addElement(makeElement('el-2'));
			useSceneStore.getState().addElement(makeElement('el-3'));
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));
			useSceneStore.getState().addConnection(makeConnection('conn-2', 'el-1', 'el-3'));
			useSceneStore.getState().addConnection(makeConnection('conn-3', 'el-2', 'el-1'));

			useSceneStore.getState().removeElement('el-1');

			const state = useSceneStore.getState();
			expect(state.elements['el-1']).toBeUndefined();
			expect(state.connections['conn-1']).toBeUndefined();
			expect(state.connections['conn-2']).toBeUndefined();
			expect(state.connections['conn-3']).toBeUndefined();
			expect(state.connectionIds).toHaveLength(0);
		});
	});

	describe('updateElement / moveElement', () => {
		it('updates element properties', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().updateElement('el-1', { opacity: 0.5, locked: true });

			const el = useSceneStore.getState().elements['el-1'];
			expect(el?.opacity).toBe(0.5);
			expect(el?.locked).toBe(true);
		});

		it('moves element to new position', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().moveElement('el-1', 200, 300);

			expect(useSceneStore.getState().elements['el-1']?.position).toEqual({ x: 200, y: 300 });
		});

		it('does not throw when updating non-existent element', () => {
			expect(() => {
				useSceneStore.getState().updateElement('nonexistent', { opacity: 0 });
			}).not.toThrow();
		});
	});

	describe('connections', () => {
		it('adds a connection', () => {
			const conn = makeConnection('conn-1', 'el-1', 'el-2');
			useSceneStore.getState().addConnection(conn);

			expect(useSceneStore.getState().connections['conn-1']).toEqual(conn);
			expect(useSceneStore.getState().connectionIds).toContain('conn-1');
		});

		it('removes a connection', () => {
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));
			useSceneStore.getState().removeConnection('conn-1');

			expect(useSceneStore.getState().connections['conn-1']).toBeUndefined();
			expect(useSceneStore.getState().connectionIds).not.toContain('conn-1');
		});
	});

	describe('selection', () => {
		it('selects a single element', () => {
			useSceneStore.getState().selectElement('el-1');
			expect(useSceneStore.getState().selectedIds).toEqual(['el-1']);
		});

		it('selects multiple elements', () => {
			useSceneStore.getState().selectMultiple(['el-1', 'el-2', 'el-3']);
			expect(useSceneStore.getState().selectedIds).toEqual(['el-1', 'el-2', 'el-3']);
		});

		it('deselects all', () => {
			useSceneStore.getState().selectMultiple(['el-1', 'el-2']);
			useSceneStore.getState().deselectAll();
			expect(useSceneStore.getState().selectedIds).toEqual([]);
		});

		it('toggles selection on', () => {
			useSceneStore.getState().toggleSelection('el-1');
			expect(useSceneStore.getState().selectedIds).toContain('el-1');
		});

		it('toggles selection off', () => {
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().toggleSelection('el-1');
			expect(useSceneStore.getState().selectedIds).not.toContain('el-1');
		});
	});

	describe('copy / paste', () => {
		it('copies selected elements to clipboard', () => {
			const el = makeElement('el-1');
			useSceneStore.getState().addElement(el);
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().copySelected();

			expect(useSceneStore.getState().clipboard).toHaveLength(1);
			expect(useSceneStore.getState().clipboard[0]?.id).toBe('el-1');
		});

		it('pastes clipboard elements with offset', () => {
			const el = makeElement('el-1', { position: { x: 100, y: 100 } });
			useSceneStore.getState().addElement(el);
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().copySelected();

			const pasted = useSceneStore.getState().paste(20, 20);
			expect(pasted).toHaveLength(1);
			expect(pasted[0]?.position).toEqual({ x: 120, y: 120 });

			// Should be added to the store
			const state = useSceneStore.getState();
			expect(state.elementIds).toHaveLength(2);
		});

		it('pastes with default offset', () => {
			const el = makeElement('el-1', { position: { x: 0, y: 0 } });
			useSceneStore.getState().addElement(el);
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().copySelected();

			const pasted = useSceneStore.getState().paste();
			expect(pasted[0]?.position).toEqual({ x: 20, y: 20 });
		});

		it('pastes multiple elements without ID collision', () => {
			const el1 = makeElement('el-1', { position: { x: 0, y: 0 } });
			const el2 = makeElement('el-2', { position: { x: 50, y: 50 } });
			useSceneStore.getState().addElement(el1);
			useSceneStore.getState().addElement(el2);
			useSceneStore.getState().selectMultiple(['el-1', 'el-2']);
			useSceneStore.getState().copySelected();

			const pasted = useSceneStore.getState().paste(20, 20);
			expect(pasted).toHaveLength(2);

			const state = useSceneStore.getState();
			expect(state.elementIds).toHaveLength(4);
			expect(new Set(state.elementIds).size).toBe(4);
		});

		it('auto-selects pasted elements', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().copySelected();
			useSceneStore.getState().paste();

			const { selectedIds, elementIds } = useSceneStore.getState();
			// Only pasted elements should be selected, not the original
			expect(selectedIds).toHaveLength(1);
			expect(selectedIds[0]).not.toBe('el-1');
			expect(elementIds).toContain(selectedIds[0]);
		});

		it('copies connections between selected elements', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().addElement(makeElement('el-2'));
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));
			useSceneStore.getState().selectMultiple(['el-1', 'el-2']);
			useSceneStore.getState().copySelected();

			expect(useSceneStore.getState().clipboardConnections).toHaveLength(1);
			expect(useSceneStore.getState().clipboardConnections[0]?.id).toBe('conn-1');
		});

		it('does not copy connections when only one endpoint is selected', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().addElement(makeElement('el-2'));
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().copySelected();

			expect(useSceneStore.getState().clipboardConnections).toHaveLength(0);
		});

		it('pastes connections with remapped element IDs', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().addElement(makeElement('el-2'));
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));
			useSceneStore.getState().selectMultiple(['el-1', 'el-2']);
			useSceneStore.getState().copySelected();
			useSceneStore.getState().paste();

			const state = useSceneStore.getState();
			// Original + pasted
			expect(state.connectionIds).toHaveLength(2);

			// Pasted connection should reference the new element IDs, not the originals
			const pastedConnId = state.connectionIds.find((id) => id !== 'conn-1');
			expect(pastedConnId).toBeDefined();
			const pastedConn = pastedConnId ? state.connections[pastedConnId] : undefined;
			expect(pastedConn).toBeDefined();
			expect(pastedConn?.fromElementId).not.toBe('el-1');
			expect(pastedConn?.toElementId).not.toBe('el-2');
			// Pasted connection endpoints should exist in elements
			expect(state.elements[pastedConn?.fromElementId ?? '']).toBeDefined();
			expect(state.elements[pastedConn?.toElementId ?? '']).toBeDefined();
		});
	});

	describe('cut', () => {
		it('cutSelected copies then deletes elements', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().cutSelected();

			const state = useSceneStore.getState();
			expect(state.clipboard).toHaveLength(1);
			expect(state.clipboard[0]?.id).toBe('el-1');
			expect(state.elements['el-1']).toBeUndefined();
			expect(state.elementIds).toHaveLength(0);
		});

		it('cutSelected also copies connections between selected elements', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().addElement(makeElement('el-2'));
			useSceneStore.getState().addConnection(makeConnection('conn-1', 'el-1', 'el-2'));
			useSceneStore.getState().selectMultiple(['el-1', 'el-2']);
			useSceneStore.getState().cutSelected();

			const state = useSceneStore.getState();
			expect(state.clipboard).toHaveLength(2);
			expect(state.clipboardConnections).toHaveLength(1);
			expect(state.elements['el-1']).toBeUndefined();
			expect(state.elements['el-2']).toBeUndefined();
			expect(state.connectionIds).toHaveLength(0);
		});

		it('cut then paste restores elements at offset', () => {
			useSceneStore.getState().addElement(makeElement('el-1', { position: { x: 50, y: 50 } }));
			useSceneStore.getState().selectElement('el-1');
			useSceneStore.getState().cutSelected();

			const pasted = useSceneStore.getState().paste(10, 10);
			expect(pasted).toHaveLength(1);
			expect(pasted[0]?.position).toEqual({ x: 60, y: 60 });
			expect(useSceneStore.getState().elementIds).toHaveLength(1);
		});
	});

	describe('camera', () => {
		it('updates camera position', () => {
			useSceneStore.getState().setCamera({ x: 100, y: 200 });
			expect(useSceneStore.getState().camera).toEqual({ x: 100, y: 200, zoom: 1 });
		});

		it('updates camera zoom', () => {
			useSceneStore.getState().setCamera({ zoom: 2 });
			expect(useSceneStore.getState().camera.zoom).toBe(2);
		});
	});

	describe('serialization', () => {
		it('state contains no Map or Set', () => {
			useSceneStore.getState().addElement(makeElement('el-1'));
			useSceneStore.getState().selectElement('el-1');

			const state = useSceneStore.getState();
			const json = JSON.stringify({
				elements: state.elements,
				elementIds: state.elementIds,
				connections: state.connections,
				connectionIds: state.connectionIds,
				selectedIds: state.selectedIds,
				camera: state.camera,
			});

			expect(() => JSON.parse(json)).not.toThrow();
		});
	});
});
