/**
 * Central keyboard shortcut registry.
 *
 * All shortcuts are defined here with their key combos, labels, and categories.
 * The registry is consumed by:
 *   - useGlobalShortcuts hook (binds to document keydown)
 *   - Command palette (lists all shortcuts with search)
 *   - Toolbar/menu shortcut labels
 *
 * `mod` means Ctrl on Windows/Linux, Cmd on Mac.
 */

export interface ShortcutKeys {
	key: string;
	mod?: boolean;
	shift?: boolean;
	alt?: boolean;
}

export interface ShortcutDefinition {
	id: string;
	label: string;
	category: string;
	keys: ShortcutKeys;
	/** Override for display — auto-formatted from keys if not provided */
	displayShortcut?: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

/**
 * Check whether a KeyboardEvent matches a ShortcutKeys definition.
 * `mod` matches either Ctrl or Meta (Cmd on Mac).
 */
export function matchesKeyEvent(keys: ShortcutKeys, e: KeyboardEvent): boolean {
	const eventKey = e.key.toLowerCase();
	const defKey = keys.key.toLowerCase();

	if (eventKey !== defKey) return false;

	const wantsMod = keys.mod ?? false;
	const hasMod = e.ctrlKey || e.metaKey;
	if (wantsMod !== hasMod) return false;

	const wantsShift = keys.shift ?? false;
	if (wantsShift !== e.shiftKey) return false;

	const wantsAlt = keys.alt ?? false;
	if (wantsAlt !== e.altKey) return false;

	return true;
}

/**
 * Format a ShortcutKeys definition into a human-readable string.
 */
export function formatShortcut(keys: ShortcutKeys): string {
	const parts: string[] = [];

	if (keys.mod) parts.push(isMac ? '⌘' : 'Ctrl');
	if (keys.shift) parts.push(isMac ? '⇧' : 'Shift');
	if (keys.alt) parts.push(isMac ? '⌥' : 'Alt');

	// Friendly names for special keys
	const keyMap: Record<string, string> = {
		' ': 'Space',
		ArrowUp: '↑',
		ArrowDown: '↓',
		ArrowLeft: '←',
		ArrowRight: '→',
		Delete: 'Del',
		Backspace: '⌫',
		Escape: 'Esc',
		'`': '`',
		';': ';',
		'=': '=',
		'-': '-',
		'0': '0',
	};

	const displayKey = keyMap[keys.key] ?? keys.key.toUpperCase();
	parts.push(displayKey);

	return parts.join(isMac ? '' : '+');
}

/**
 * Group shortcuts by category for command palette display.
 */
export function getShortcutsByCategory(): Record<string, ShortcutDefinition[]> {
	const result: Record<string, ShortcutDefinition[]> = {};
	for (const shortcut of shortcutRegistry) {
		const list = result[shortcut.category] ?? [];
		list.push(shortcut);
		result[shortcut.category] = list;
	}
	return result;
}

/**
 * The central shortcut registry.
 *
 * Actions are NOT defined here — they're wired up in `useGlobalShortcuts`
 * which maps shortcut IDs to store actions. This keeps the registry
 * as pure data that can be imported without pulling in store dependencies.
 */
export const shortcutRegistry: ShortcutDefinition[] = [
	// Playback
	{ id: 'play-pause', label: 'Play / Pause', category: 'Playback', keys: { key: ' ' } },

	// Edit
	{ id: 'undo', label: 'Undo', category: 'Edit', keys: { key: 'z', mod: true } },
	{ id: 'redo', label: 'Redo', category: 'Edit', keys: { key: 'z', mod: true, shift: true } },
	{ id: 'save', label: 'Save', category: 'Edit', keys: { key: 's', mod: true } },

	// Zoom
	{ id: 'zoom-in', label: 'Zoom In', category: 'View', keys: { key: '=', mod: true } },
	{ id: 'zoom-out', label: 'Zoom Out', category: 'View', keys: { key: '-', mod: true } },
	{ id: 'fit-to-screen', label: 'Fit to Screen', category: 'View', keys: { key: '0', mod: true } },

	// View
	{ id: 'toggle-grid', label: 'Toggle Grid', category: 'View', keys: { key: ';', mod: true } },
	{
		id: 'toggle-left-panel',
		label: 'Toggle Left Panel',
		category: 'View',
		keys: { key: 'b', mod: true },
	},
	{
		id: 'toggle-right-panel',
		label: 'Toggle Right Panel',
		category: 'View',
		keys: { key: 'i', mod: true },
	},
	{
		id: 'toggle-bottom-panel',
		label: 'Toggle Bottom Panel',
		category: 'View',
		keys: { key: '`', mod: true },
	},

	// General
	{
		id: 'command-palette',
		label: 'Command Palette',
		category: 'General',
		keys: { key: 'k', mod: true },
	},
];
