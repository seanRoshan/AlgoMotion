import type { ArrowShape, ElementStyle, Size } from '@/types';

/**
 * Default element style used when creating new elements.
 * Dark theme colors that work on the 0x1a1a2e canvas background.
 */
export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
	fill: '#2a2a4a',
	stroke: '#4a4a6a',
	strokeWidth: 2,
	cornerRadius: 8,
	fontSize: 14,
	fontFamily: 'Inter, system-ui, sans-serif',
	fontWeight: 500,
	textColor: '#e0e0f0',
};

export const NODE_DEFAULTS = {
	size: { width: 48, height: 48 } satisfies Size,
	style: {
		...DEFAULT_ELEMENT_STYLE,
		stroke: '#6366f1',
		cornerRadius: 24,
		fontSize: 16,
		fontFamily: 'JetBrains Mono, monospace',
		fontWeight: 600,
	} satisfies ElementStyle,
};

export const EDGE_DEFAULTS = {
	style: {
		...DEFAULT_ELEMENT_STYLE,
		fill: '#000000',
		stroke: '#6b7280',
		cornerRadius: 0,
		fontSize: 12,
		fontWeight: 400,
		textColor: '#a0a0c0',
	} satisfies ElementStyle,
};

export const RECT_DEFAULTS = {
	size: { width: 120, height: 80 } satisfies Size,
	style: {
		...DEFAULT_ELEMENT_STYLE,
	} satisfies ElementStyle,
};

export const TEXT_DEFAULTS = {
	size: { width: 200, height: 100 } satisfies Size,
	style: {
		...DEFAULT_ELEMENT_STYLE,
		fill: '#000000',
		stroke: '#000000',
		strokeWidth: 0,
		cornerRadius: 0,
		fontSize: 16,
		fontWeight: 400,
	} satisfies ElementStyle,
};

export const ARROW_DEFAULTS = {
	style: {
		...DEFAULT_ELEMENT_STYLE,
		fill: '#000000',
		stroke: '#9ca3af',
		cornerRadius: 0,
		fontSize: 12,
		fontWeight: 400,
		textColor: '#a0a0c0',
	} satisfies ElementStyle,
};

/**
 * Convert a CSS hex color string to a Pixi.js numeric color.
 */
export function hexToPixiColor(hex: string): number {
	if (hex === 'transparent') return 0x000000;
	const cleaned = hex.replace('#', '');
	const parsed = Number.parseInt(cleaned, 16);
	return Number.isNaN(parsed) ? 0x000000 : parsed;
}

/**
 * Calculate arrowhead polygon points for a given shape.
 * Returns a flat array of [x, y, x, y, ...] coordinates.
 *
 * @param tipX - X position of the arrowhead tip (endpoint)
 * @param tipY - Y position of the arrowhead tip (endpoint)
 * @param angle - Direction angle in radians (0 = pointing right)
 * @param shape - Arrow shape type
 * @param strokeWidth - Line stroke width (arrowhead scales with it)
 */
export function calculateArrowheadPoints(
	tipX: number,
	tipY: number,
	angle: number,
	shape: ArrowShape,
	strokeWidth: number,
): number[] {
	if (shape === 'none') return [];

	const baseWidth = strokeWidth * 5;
	const height = strokeWidth * 4;

	if (shape === 'triangle') {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		// Tip point
		const tx = tipX;
		const ty = tipY;

		// Left base point (perpendicular offset)
		const lx = tipX - height * cos + (baseWidth / 2) * sin;
		const ly = tipY - height * sin - (baseWidth / 2) * cos;

		// Right base point
		const rx = tipX - height * cos - (baseWidth / 2) * sin;
		const ry = tipY - height * sin + (baseWidth / 2) * cos;

		return [tx, ty, lx, ly, rx, ry];
	}

	if (shape === 'diamond') {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const halfLen = height;
		const halfWidth = baseWidth / 2;

		// Front tip
		const fx = tipX;
		const fy = tipY;

		// Left point
		const lx = tipX - halfLen * cos + halfWidth * sin;
		const ly = tipY - halfLen * sin - halfWidth * cos;

		// Back point
		const bx = tipX - 2 * halfLen * cos;
		const by = tipY - 2 * halfLen * sin;

		// Right point
		const rx = tipX - halfLen * cos - halfWidth * sin;
		const ry = tipY - halfLen * sin + halfWidth * cos;

		return [fx, fy, lx, ly, bx, by, rx, ry];
	}

	// 'circle' shape — not polygon-based, handled separately in renderers
	return [];
}
