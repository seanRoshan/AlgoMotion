/**
 * Semantic color definitions for the Pixi.js canvas.
 * These match the CSS custom properties in globals.css
 * but are defined as hex values for direct use in Pixi.js rendering.
 *
 * Spec reference: Section 6.2, globals.css animation semantic colors
 */
export const semanticColors = {
	active: '#3b82f6',
	comparing: '#f59e0b',
	swapping: '#8b5cf6',
	sorted: '#10b981',
	visited: '#6b7280',
	unvisited: '#e5e7eb',
	highlight: '#ffd700',
	path: '#06b6d4',
	pivot: '#ec4899',
	error: '#ef4444',
} as const;

/** Union of all semantic color keys */
export type SemanticColorKey = keyof typeof semanticColors;

/** All semantic color keys as an array */
export const SEMANTIC_COLOR_KEYS = Object.keys(semanticColors) as SemanticColorKey[];

/**
 * Convert a hex color string (#rrggbb or #rgb) to a numeric value
 * for use with Pixi.js tint/color APIs.
 */
export function hexToNumber(hex: string): number {
	const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
	const expanded =
		cleaned.length === 3
			? cleaned
					.split('')
					.map((c) => c + c)
					.join('')
			: cleaned;
	return Number.parseInt(expanded, 16);
}

/**
 * Convert a numeric color value to a hex string (#rrggbb).
 */
export function numberToHex(num: number): string {
	return `#${num.toString(16).padStart(6, '0')}`;
}

/**
 * Get a semantic color as a Pixi.js-compatible numeric value.
 */
export function getSemanticColorNumber(key: SemanticColorKey): number {
	return hexToNumber(semanticColors[key]);
}

// ── Theme-Aware Colors ──

/**
 * Light mode color adjustments.
 * Most semantic colors are designed for dark canvas backgrounds.
 * For light mode UI elements, some colors need adjustment for contrast.
 */
const lightThemeOverrides: Partial<Record<SemanticColorKey, string>> = {
	unvisited: '#9ca3af', // gray-400 — darker for light backgrounds
	visited: '#4b5563', // gray-600 — darker for light backgrounds
};

/**
 * Get the semantic color palette for a given theme.
 * Dark theme uses the default palette; light theme applies contrast adjustments.
 */
export function getThemeColors(theme: 'dark' | 'light'): Record<SemanticColorKey, string> {
	if (theme === 'light') {
		return { ...semanticColors, ...lightThemeOverrides };
	}
	return { ...semanticColors };
}

/**
 * Resolve semantic colors with optional user overrides.
 * Merges theme defaults with any user-provided color overrides.
 */
export function resolveSemanticColors(
	theme: 'dark' | 'light',
	overrides?: Partial<Record<SemanticColorKey, string>>,
): Record<SemanticColorKey, string> {
	const base = getThemeColors(theme);
	if (!overrides) return base;
	return { ...base, ...overrides };
}

// ── Multi-Signal State Indicators ──

/**
 * State indicator definition.
 * Per accessibility guidelines (Section 15.5), color must never be the
 * sole indicator of state — each state also has an icon and/or effect.
 */
export interface StateIndicator {
	colorKey: SemanticColorKey;
	icon?: 'check' | 'x' | 'arrows' | 'arrow-right' | 'eye' | 'star' | 'dot';
	effect?: 'pulse' | 'bounce' | 'shake';
}

/**
 * Multi-signal indicator mapping for key animation states.
 * Each state has a color AND at least one other visual cue (icon or effect).
 */
export const STATE_INDICATORS: Record<string, StateIndicator> = {
	sorted: { colorKey: 'sorted', icon: 'check' },
	error: { colorKey: 'error', icon: 'x', effect: 'shake' },
	active: { colorKey: 'active', effect: 'pulse' },
	comparing: { colorKey: 'comparing', icon: 'arrows' },
	swapping: { colorKey: 'swapping', effect: 'bounce' },
	visited: { colorKey: 'visited', icon: 'dot' },
	path: { colorKey: 'path', icon: 'arrow-right' },
	pivot: { colorKey: 'pivot', icon: 'star' },
	highlight: { colorKey: 'highlight', effect: 'pulse' },
};

/**
 * Blend two hex colors by a ratio (0 = first color, 1 = second color).
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
	const c1 = hexToNumber(color1);
	const c2 = hexToNumber(color2);
	const t = Math.max(0, Math.min(1, ratio));

	const r1 = (c1 >> 16) & 0xff;
	const g1 = (c1 >> 8) & 0xff;
	const b1 = c1 & 0xff;

	const r2 = (c2 >> 16) & 0xff;
	const g2 = (c2 >> 8) & 0xff;
	const b2 = c2 & 0xff;

	const r = Math.round(r1 + (r2 - r1) * t);
	const g = Math.round(g1 + (g2 - g1) * t);
	const b = Math.round(b1 + (b2 - b1) * t);

	return numberToHex((r << 16) | (g << 8) | b);
}
