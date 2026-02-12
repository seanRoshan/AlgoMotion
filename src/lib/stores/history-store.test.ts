import { enablePatches, produceWithPatches } from 'immer';
import { afterEach, describe, expect, it } from 'vitest';
import type { SceneElement } from '@/types';
import { canRedo, canUndo, HISTORY_BUFFER_SIZE, useHistoryStore } from './history-store';
import { useSceneStore } from './scene-store';

enablePatches();

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

describe('history store', () => {
	describe('initial state', () => {
		it('starts with empty entries, cursor 0, no active group', () => {
			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(0);
			expect(state.cursor).toBe(0);
			expect(state.activeGroup).toBeNull();
		});

		it('canUndo is false initially', () => {
			expect(canUndo(useHistoryStore.getState())).toBe(false);
		});

		it('canRedo is false initially', () => {
			expect(canRedo(useHistoryStore.getState())).toBe(false);
		});
	});

	describe('pushEntry', () => {
		it('adds entry and increments cursor', () => {
			const [, patches, inversePatches] = produceWithPatches({ x: 1 }, (draft) => {
				draft.x = 2;
			});

			useHistoryStore.getState().pushEntry('Change x', patches, inversePatches);

			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(1);
			expect(state.cursor).toBe(1);
			expect(state.entries[0]?.description).toBe('Change x');
			expect(state.entries[0]?.patches).toEqual(patches);
			expect(state.entries[0]?.inversePatches).toEqual(inversePatches);
		});

		it('skips empty patches', () => {
			useHistoryStore.getState().pushEntry('No-op', [], []);

			expect(useHistoryStore.getState().entries).toHaveLength(0);
			expect(useHistoryStore.getState().cursor).toBe(0);
		});

		it('assigns unique IDs and timestamps', () => {
			const [, p1, ip1] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			const [, p2, ip2] = produceWithPatches({ x: 2 }, (d) => {
				d.x = 3;
			});

			useHistoryStore.getState().pushEntry('First', p1, ip1);
			useHistoryStore.getState().pushEntry('Second', p2, ip2);

			const { entries } = useHistoryStore.getState();
			expect(entries[0]?.id).toBeDefined();
			expect(entries[1]?.id).toBeDefined();
			expect(entries[0]?.id).not.toBe(entries[1]?.id);
			expect(entries[0]?.timestamp).toBeGreaterThan(0);
		});
	});

	describe('circular buffer', () => {
		it('drops oldest entry when exceeding buffer size', () => {
			const store = useHistoryStore.getState();

			for (let i = 0; i < HISTORY_BUFFER_SIZE + 5; i++) {
				const [, patches, inversePatches] = produceWithPatches({ x: i }, (draft) => {
					draft.x = i + 1;
				});
				store.pushEntry(`Step ${i}`, patches, inversePatches);
			}

			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(HISTORY_BUFFER_SIZE);
			expect(state.cursor).toBe(HISTORY_BUFFER_SIZE);
			// First entry should be "Step 5" (steps 0-4 dropped)
			expect(state.entries[0]?.description).toBe('Step 5');
		});
	});

	describe('undo', () => {
		it('decrements cursor', () => {
			const [, patches, inversePatches] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			useHistoryStore.getState().pushEntry('Test', patches, inversePatches);

			useHistoryStore.getState().undo();

			expect(useHistoryStore.getState().cursor).toBe(0);
		});

		it('no-op when cursor is 0', () => {
			useHistoryStore.getState().undo();

			expect(useHistoryStore.getState().cursor).toBe(0);
		});

		it('canUndo is true after pushing, false after undoing', () => {
			const [, p, ip] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			useHistoryStore.getState().pushEntry('Test', p, ip);

			expect(canUndo(useHistoryStore.getState())).toBe(true);

			useHistoryStore.getState().undo();

			expect(canUndo(useHistoryStore.getState())).toBe(false);
		});
	});

	describe('redo', () => {
		it('increments cursor after undo', () => {
			const [, p, ip] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			useHistoryStore.getState().pushEntry('Test', p, ip);
			useHistoryStore.getState().undo();

			useHistoryStore.getState().redo();

			expect(useHistoryStore.getState().cursor).toBe(1);
		});

		it('no-op when at end', () => {
			const [, p, ip] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			useHistoryStore.getState().pushEntry('Test', p, ip);

			useHistoryStore.getState().redo();

			expect(useHistoryStore.getState().cursor).toBe(1); // unchanged
		});

		it('canRedo is true after undo, false after redo', () => {
			const [, p, ip] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			useHistoryStore.getState().pushEntry('Test', p, ip);
			useHistoryStore.getState().undo();

			expect(canRedo(useHistoryStore.getState())).toBe(true);

			useHistoryStore.getState().redo();

			expect(canRedo(useHistoryStore.getState())).toBe(false);
		});
	});

	describe('fork (truncate future)', () => {
		it('truncates future entries on new action after undo', () => {
			const store = useHistoryStore.getState();

			// Push 5 entries
			for (let i = 0; i < 5; i++) {
				const [, p, ip] = produceWithPatches({ x: i }, (d) => {
					d.x = i + 1;
				});
				store.pushEntry(`Step ${i}`, p, ip);
			}
			expect(useHistoryStore.getState().entries).toHaveLength(5);

			// Undo 2
			store.undo();
			store.undo();
			expect(useHistoryStore.getState().cursor).toBe(3);

			// Push 1 new entry (forks history)
			const [, p, ip] = produceWithPatches({ x: 99 }, (d) => {
				d.x = 100;
			});
			store.pushEntry('Fork', p, ip);

			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(4); // 3 kept + 1 new, 2 future truncated
			expect(state.cursor).toBe(4);
			expect(state.entries[3]?.description).toBe('Fork');
		});
	});

	describe('gesture grouping', () => {
		it('accumulates patches into single entry', () => {
			const store = useHistoryStore.getState();
			store.startGroup('Move element');

			// Three incremental changes
			const [, p1, ip1] = produceWithPatches({ x: 0 }, (d) => {
				d.x = 10;
			});
			const [, p2, ip2] = produceWithPatches({ x: 10 }, (d) => {
				d.x = 20;
			});
			const [, p3, ip3] = produceWithPatches({ x: 20 }, (d) => {
				d.x = 30;
			});

			store.pushEntry('move1', p1, ip1);
			store.pushEntry('move2', p2, ip2);
			store.pushEntry('move3', p3, ip3);

			// No entries yet (still in group)
			expect(useHistoryStore.getState().entries).toHaveLength(0);

			store.endGroup();

			// Single entry after endGroup
			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(1);
			expect(state.entries[0]?.description).toBe('Move element');
			expect(state.entries[0]?.groupId).toBeDefined();
			// Combined patches: forward order
			expect(state.entries[0]?.patches).toEqual([...p1, ...p2, ...p3]);
			// Combined inverse patches: reverse order
			expect(state.entries[0]?.inversePatches).toEqual([...ip3, ...ip2, ...ip1]);
		});

		it('produces no entry for empty group', () => {
			const store = useHistoryStore.getState();
			store.startGroup('Empty group');
			store.endGroup();

			expect(useHistoryStore.getState().entries).toHaveLength(0);
		});

		it('endGroup is no-op when no group is active', () => {
			const store = useHistoryStore.getState();
			expect(() => store.endGroup()).not.toThrow();
		});
	});

	describe('clearHistory', () => {
		it('resets to initial state', () => {
			const [, p, ip] = produceWithPatches({ x: 1 }, (d) => {
				d.x = 2;
			});
			useHistoryStore.getState().pushEntry('Test', p, ip);

			useHistoryStore.getState().clearHistory();

			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(0);
			expect(state.cursor).toBe(0);
			expect(state.activeGroup).toBeNull();
		});
	});

	describe('jumpToEntry', () => {
		it('jumps forward by applying patches', () => {
			// Add element, then undo, then jump forward
			const el = makeElement({ id: 'jump-el' });
			useSceneStore.getState().addElement(el);
			useHistoryStore.getState().undo();

			expect(useSceneStore.getState().elements['jump-el']).toBeUndefined();

			useHistoryStore.getState().jumpToEntry(1);

			expect(useSceneStore.getState().elements['jump-el']).toBeDefined();
			expect(useHistoryStore.getState().cursor).toBe(1);
		});

		it('jumps backward by applying inverse patches', () => {
			const el1 = makeElement({ id: 'el-j1' });
			const el2 = makeElement({ id: 'el-j2' });
			useSceneStore.getState().addElement(el1);
			useSceneStore.getState().addElement(el2);

			expect(useHistoryStore.getState().cursor).toBe(2);

			// Jump back to after first add
			useHistoryStore.getState().jumpToEntry(1);

			expect(useSceneStore.getState().elements['el-j1']).toBeDefined();
			expect(useSceneStore.getState().elements['el-j2']).toBeUndefined();
			expect(useHistoryStore.getState().cursor).toBe(1);
		});

		it('no-op when jumping to current position', () => {
			const el = makeElement({ id: 'el-noop' });
			useSceneStore.getState().addElement(el);

			useHistoryStore.getState().jumpToEntry(1);

			expect(useHistoryStore.getState().cursor).toBe(1);
		});

		it('ignores out-of-bounds target', () => {
			useHistoryStore.getState().jumpToEntry(-1);
			expect(useHistoryStore.getState().cursor).toBe(0);

			useHistoryStore.getState().jumpToEntry(100);
			expect(useHistoryStore.getState().cursor).toBe(0);
		});
	});
});

describe('scene store + history integration', () => {
	describe('undoable actions create history entries', () => {
		it('addElement creates history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-1' }));

			const history = useHistoryStore.getState();
			expect(history.entries).toHaveLength(1);
			expect(history.entries[0]?.description).toContain('Add');
		});

		it('removeElement creates history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-rm' }));
			useSceneStore.getState().removeElement('el-rm');

			expect(useHistoryStore.getState().entries).toHaveLength(2);
		});

		it('moveElement creates history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-mv' }));
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().moveElement('el-mv', 50, 60);

			expect(useHistoryStore.getState().entries).toHaveLength(1);
		});

		it('resizeElement creates history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-rs' }));
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().resizeElement('el-rs', { width: 200, height: 150 }, { x: 5, y: 10 });

			expect(useHistoryStore.getState().entries).toHaveLength(1);
		});

		it('deleteSelected creates history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-ds' }));
			useSceneStore.getState().selectElement('el-ds');
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().deleteSelected();

			expect(useHistoryStore.getState().entries).toHaveLength(1);
		});
	});

	describe('non-undoable actions do NOT create history entries', () => {
		it('selectElement does not create history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-sel' }));
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().selectElement('el-sel');

			expect(useHistoryStore.getState().entries).toHaveLength(0);
		});

		it('deselectAll does not create history entry', () => {
			useSceneStore.getState().deselectAll();
			expect(useHistoryStore.getState().entries).toHaveLength(0);
		});

		it('setCamera does not create history entry', () => {
			useSceneStore.getState().setCamera({ x: 100, y: 200, zoom: 2 });
			expect(useHistoryStore.getState().entries).toHaveLength(0);
		});

		it('selectAll does not create history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-sa' }));
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().selectAll();

			expect(useHistoryStore.getState().entries).toHaveLength(0);
		});

		it('copySelected does not create history entry', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-cp' }));
			useSceneStore.getState().selectElement('el-cp');
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().copySelected();

			expect(useHistoryStore.getState().entries).toHaveLength(0);
		});
	});

	describe('undo/redo integration', () => {
		it('undo addElement removes element', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-undo' }));
			expect(useSceneStore.getState().elements['el-undo']).toBeDefined();

			useHistoryStore.getState().undo();

			expect(useSceneStore.getState().elements['el-undo']).toBeUndefined();
			expect(useSceneStore.getState().elementIds).not.toContain('el-undo');
		});

		it('redo restores element after undo', () => {
			const el = makeElement({ id: 'el-redo' });
			useSceneStore.getState().addElement(el);
			useHistoryStore.getState().undo();

			useHistoryStore.getState().redo();

			expect(useSceneStore.getState().elements['el-redo']).toBeDefined();
			expect(useSceneStore.getState().elementIds).toContain('el-redo');
		});

		it('undo moveElement restores original position', () => {
			useSceneStore
				.getState()
				.addElement(makeElement({ id: 'el-pos', position: { x: 10, y: 20 } }));
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().moveElement('el-pos', 50, 60);

			useHistoryStore.getState().undo();

			expect(useSceneStore.getState().elements['el-pos']?.position).toEqual({
				x: 10,
				y: 20,
			});
		});

		it('undo deleteSelected restores elements', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-del' }));
			useSceneStore.getState().selectElement('el-del');
			useHistoryStore.getState().clearHistory();
			useSceneStore.getState().deleteSelected();

			expect(useSceneStore.getState().elements['el-del']).toBeUndefined();

			useHistoryStore.getState().undo();

			expect(useSceneStore.getState().elements['el-del']).toBeDefined();
			expect(useSceneStore.getState().elementIds).toContain('el-del');
		});

		it('undo resizeElement restores original size', () => {
			useSceneStore.getState().addElement(
				makeElement({
					id: 'el-rsz',
					size: { width: 100, height: 50 },
					position: { x: 0, y: 0 },
				}),
			);
			useHistoryStore.getState().clearHistory();
			useSceneStore
				.getState()
				.resizeElement('el-rsz', { width: 200, height: 150 }, { x: 5, y: 10 });

			useHistoryStore.getState().undo();

			const el = useSceneStore.getState().elements['el-rsz'];
			expect(el?.size).toEqual({ width: 100, height: 50 });
			expect(el?.position).toEqual({ x: 0, y: 0 });
		});

		it('multiple undo/redo cycles work correctly', () => {
			useSceneStore
				.getState()
				.addElement(makeElement({ id: 'el-multi', position: { x: 0, y: 0 } }));
			useHistoryStore.getState().clearHistory();

			// Move three times
			useSceneStore.getState().moveElement('el-multi', 10, 10);
			useSceneStore.getState().moveElement('el-multi', 20, 20);
			useSceneStore.getState().moveElement('el-multi', 30, 30);

			// Undo all three
			useHistoryStore.getState().undo();
			expect(useSceneStore.getState().elements['el-multi']?.position).toEqual({
				x: 20,
				y: 20,
			});

			useHistoryStore.getState().undo();
			expect(useSceneStore.getState().elements['el-multi']?.position).toEqual({
				x: 10,
				y: 10,
			});

			useHistoryStore.getState().undo();
			expect(useSceneStore.getState().elements['el-multi']?.position).toEqual({
				x: 0,
				y: 0,
			});

			// Redo two
			useHistoryStore.getState().redo();
			expect(useSceneStore.getState().elements['el-multi']?.position).toEqual({
				x: 10,
				y: 10,
			});

			useHistoryStore.getState().redo();
			expect(useSceneStore.getState().elements['el-multi']?.position).toEqual({
				x: 20,
				y: 20,
			});
		});
	});

	describe('gesture grouping integration', () => {
		it('groups multiple moves into single undo step', () => {
			useSceneStore.getState().addElement(makeElement({ id: 'el-grp', position: { x: 0, y: 0 } }));
			useHistoryStore.getState().clearHistory();

			// Simulate drag: start group, multiple moves, end group
			useHistoryStore.getState().startGroup('Move elements');
			useSceneStore.getState().moveElement('el-grp', 10, 10);
			useSceneStore.getState().moveElement('el-grp', 20, 20);
			useSceneStore.getState().moveElement('el-grp', 30, 30);
			useHistoryStore.getState().endGroup();

			// Should be a single history entry
			expect(useHistoryStore.getState().entries).toHaveLength(1);

			// Single undo should restore to original position
			useHistoryStore.getState().undo();
			expect(useSceneStore.getState().elements['el-grp']?.position).toEqual({
				x: 0,
				y: 0,
			});

			// Single redo should restore to final position
			useHistoryStore.getState().redo();
			expect(useSceneStore.getState().elements['el-grp']?.position).toEqual({
				x: 30,
				y: 30,
			});
		});
	});

	describe('200-step limit with real operations', () => {
		it('enforces buffer limit with scene store operations', () => {
			for (let i = 0; i < HISTORY_BUFFER_SIZE + 10; i++) {
				useSceneStore.getState().addElement(makeElement({ id: `buf-el-${i}` }));
			}

			const state = useHistoryStore.getState();
			expect(state.entries).toHaveLength(HISTORY_BUFFER_SIZE);
			expect(state.cursor).toBe(HISTORY_BUFFER_SIZE);
		});
	});

	describe('fork with real operations', () => {
		it('new action after undo discards future', () => {
			// Add 3 elements
			useSceneStore.getState().addElement(makeElement({ id: 'fork-1' }));
			useSceneStore.getState().addElement(makeElement({ id: 'fork-2' }));
			useSceneStore.getState().addElement(makeElement({ id: 'fork-3' }));

			// Undo last add
			useHistoryStore.getState().undo();
			expect(useSceneStore.getState().elements['fork-3']).toBeUndefined();

			// Add a different element (forks history)
			useSceneStore.getState().addElement(makeElement({ id: 'fork-alt' }));

			// History should have 3 entries (2 original + 1 new, fork-3's entry discarded)
			expect(useHistoryStore.getState().entries).toHaveLength(3);

			// Can't redo the old fork-3 add
			expect(canRedo(useHistoryStore.getState())).toBe(false);

			// fork-alt should exist, fork-3 should not
			expect(useSceneStore.getState().elements['fork-alt']).toBeDefined();
			expect(useSceneStore.getState().elements['fork-3']).toBeUndefined();
		});
	});
});
