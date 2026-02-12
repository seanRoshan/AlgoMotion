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
