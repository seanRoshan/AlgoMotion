import { describe, expect, it } from 'vitest';
import {
	formatShortcut,
	getShortcutsByCategory,
	matchesKeyEvent,
	type ShortcutDefinition,
	shortcutRegistry,
} from './shortcut-registry';

describe('shortcutRegistry', () => {
	it('exports a non-empty array of shortcut definitions', () => {
		expect(shortcutRegistry.length).toBeGreaterThan(0);
	});

	it('every entry has required fields', () => {
		for (const entry of shortcutRegistry) {
			expect(entry.id).toBeTruthy();
			expect(entry.label).toBeTruthy();
			expect(entry.category).toBeTruthy();
			expect(entry.keys).toBeDefined();
			expect(entry.keys.key).toBeTruthy();
		}
	});

	it('has no duplicate IDs', () => {
		const ids = shortcutRegistry.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	describe('required shortcuts exist', () => {
		const requiredIds = [
			'play-pause',
			'undo',
			'redo',
			'zoom-in',
			'zoom-out',
			'fit-to-screen',
			'toggle-grid',
			'save',
			'toggle-bottom-panel',
			'toggle-left-panel',
			'toggle-right-panel',
		];

		for (const id of requiredIds) {
			it(`includes "${id}" shortcut`, () => {
				expect(shortcutRegistry.find((s) => s.id === id)).toBeDefined();
			});
		}
	});
});

describe('matchesKeyEvent', () => {
	function makeKeyEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
		return {
			key: '',
			ctrlKey: false,
			metaKey: false,
			shiftKey: false,
			altKey: false,
			...overrides,
		} as KeyboardEvent;
	}

	it('matches simple key without modifiers', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: ' ' },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: ' ' }))).toBe(true);
	});

	it('matches Ctrl+key (ctrlKey)', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: 'z', ctrlKey: true }))).toBe(true);
	});

	it('matches Cmd+key (metaKey) when mod is true', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: 'z', metaKey: true }))).toBe(true);
	});

	it('does not match when mod required but no modifier pressed', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: 'z' }))).toBe(false);
	});

	it('matches Ctrl+Shift+key', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true, shift: true },
		};
		expect(
			matchesKeyEvent(def.keys, makeKeyEvent({ key: 'z', ctrlKey: true, shiftKey: true })),
		).toBe(true);
	});

	it('does not match wrong key', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: 'a', ctrlKey: true }))).toBe(false);
	});

	it('does not match when shift required but not pressed', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true, shift: true },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: 'z', ctrlKey: true }))).toBe(false);
	});

	it('is case-insensitive for letter keys', () => {
		const def: ShortcutDefinition = {
			id: 'test',
			label: 'Test',
			category: 'test',
			keys: { key: 'z', mod: true },
		};
		expect(matchesKeyEvent(def.keys, makeKeyEvent({ key: 'Z', ctrlKey: true }))).toBe(true);
	});
});

describe('formatShortcut', () => {
	it('formats a mod+key shortcut', () => {
		const formatted = formatShortcut({ key: 'z', mod: true });
		// Should include either Ctrl or ⌘ depending on platform
		expect(formatted).toMatch(/[Ctrl⌘]/);
		expect(formatted.toLowerCase()).toContain('z');
	});

	it('formats mod+shift+key shortcut', () => {
		const formatted = formatShortcut({ key: 'z', mod: true, shift: true });
		expect(formatted).toMatch(/[Shift⇧]/i);
	});

	it('formats Space key', () => {
		const formatted = formatShortcut({ key: ' ' });
		expect(formatted).toBe('Space');
	});
});

describe('getShortcutsByCategory', () => {
	it('groups shortcuts by category', () => {
		const grouped = getShortcutsByCategory();
		expect(Object.keys(grouped).length).toBeGreaterThan(0);

		// Each group should be non-empty
		for (const [, shortcuts] of Object.entries(grouped)) {
			expect(shortcuts.length).toBeGreaterThan(0);
		}
	});

	it('every shortcut appears in exactly one category', () => {
		const grouped = getShortcutsByCategory();
		const allIds = Object.values(grouped)
			.flat()
			.map((s) => s.id);
		expect(allIds.length).toBe(shortcutRegistry.length);
	});
});
