import { describe, expect, it } from 'vitest';
import {
	ARROW_DEFAULTS,
	calculateArrowheadPoints,
	DEFAULT_ELEMENT_STYLE,
	EDGE_DEFAULTS,
	hexToPixiColor,
	NODE_DEFAULTS,
	RECT_DEFAULTS,
	TEXT_DEFAULTS,
} from './shared';

describe('shared renderer utilities', () => {
	describe('hexToPixiColor', () => {
		it('converts 6-digit hex to number', () => {
			expect(hexToPixiColor('#ff0000')).toBe(0xff0000);
		});

		it('converts lowercase hex', () => {
			expect(hexToPixiColor('#abcdef')).toBe(0xabcdef);
		});

		it('converts uppercase hex', () => {
			expect(hexToPixiColor('#ABCDEF')).toBe(0xabcdef);
		});

		it('handles black', () => {
			expect(hexToPixiColor('#000000')).toBe(0x000000);
		});

		it('handles white', () => {
			expect(hexToPixiColor('#ffffff')).toBe(0xffffff);
		});

		it('returns 0 for invalid hex', () => {
			expect(hexToPixiColor('not-a-color')).toBe(0x000000);
		});

		it('handles hex without hash', () => {
			expect(hexToPixiColor('ff0000')).toBe(0xff0000);
		});

		it('returns 0 for transparent', () => {
			expect(hexToPixiColor('transparent')).toBe(0x000000);
		});
	});

	describe('calculateArrowheadPoints', () => {
		it('returns 3 points for a triangle arrowhead', () => {
			const points = calculateArrowheadPoints(100, 0, 0, 'triangle', 2);
			expect(points).toHaveLength(6); // 3 points x 2 coordinates
		});

		it('returns 4 points for a diamond arrowhead', () => {
			const points = calculateArrowheadPoints(100, 0, 0, 'diamond', 2);
			expect(points).toHaveLength(8); // 4 points x 2 coordinates
		});

		it('returns empty for none', () => {
			const points = calculateArrowheadPoints(100, 0, 0, 'none', 2);
			expect(points).toHaveLength(0);
		});

		it('returns empty for circle (handled separately in renderers)', () => {
			const points = calculateArrowheadPoints(100, 0, 0, 'circle', 2);
			expect(points).toHaveLength(0);
		});

		it('triangle tip is at the endpoint', () => {
			const points = calculateArrowheadPoints(100, 0, 0, 'triangle', 2);
			// First point (tip) should be at the endpoint
			expect(points[0]).toBe(100);
			expect(points[1]).toBe(0);
		});

		it('arrowhead scales with stroke width', () => {
			const small = calculateArrowheadPoints(100, 0, 0, 'triangle', 1);
			const large = calculateArrowheadPoints(100, 0, 0, 'triangle', 4);
			// At angle 0, the y-coordinates (indices 3 and 5) show the spread
			const smallSpread = Math.abs((small[3] ?? 0) - (small[5] ?? 0));
			const largeSpread = Math.abs((large[3] ?? 0) - (large[5] ?? 0));
			expect(largeSpread).toBeGreaterThan(smallSpread);
		});

		it('rotates arrowhead based on angle', () => {
			// Pointing right (0 radians)
			const right = calculateArrowheadPoints(100, 0, 0, 'triangle', 2);
			// Pointing down (PI/2 radians)
			const down = calculateArrowheadPoints(0, 100, Math.PI / 2, 'triangle', 2);
			// Tip should be at different positions
			expect(right[0]).not.toBe(down[0]);
		});
	});

	describe('DEFAULT_ELEMENT_STYLE', () => {
		it('has all required fields', () => {
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('fill');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('stroke');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('strokeWidth');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('cornerRadius');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('fontSize');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('fontFamily');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('fontWeight');
			expect(DEFAULT_ELEMENT_STYLE).toHaveProperty('textColor');
		});

		it('uses hex color strings', () => {
			expect(DEFAULT_ELEMENT_STYLE.fill).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(DEFAULT_ELEMENT_STYLE.stroke).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(DEFAULT_ELEMENT_STYLE.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
		});
	});

	describe('primitive defaults', () => {
		it('NODE_DEFAULTS has size and style', () => {
			expect(NODE_DEFAULTS.size).toEqual({ width: 48, height: 48 });
			expect(NODE_DEFAULTS.style.fill).toBeDefined();
			expect(NODE_DEFAULTS.style.stroke).toBeDefined();
		});

		it('EDGE_DEFAULTS has style with stroke', () => {
			expect(EDGE_DEFAULTS.style.stroke).toBeDefined();
			expect(EDGE_DEFAULTS.style.strokeWidth).toBeGreaterThan(0);
		});

		it('RECT_DEFAULTS has size and style', () => {
			expect(RECT_DEFAULTS.size).toEqual({ width: 120, height: 80 });
			expect(RECT_DEFAULTS.style.cornerRadius).toBeGreaterThanOrEqual(0);
		});

		it('TEXT_DEFAULTS has size and font config', () => {
			expect(TEXT_DEFAULTS.size.width).toBeGreaterThan(0);
			expect(TEXT_DEFAULTS.style.fontSize).toBeGreaterThan(0);
			expect(TEXT_DEFAULTS.style.fontFamily).toBeDefined();
		});

		it('ARROW_DEFAULTS has style with stroke', () => {
			expect(ARROW_DEFAULTS.style.stroke).toBeDefined();
			expect(ARROW_DEFAULTS.style.strokeWidth).toBeGreaterThan(0);
		});
	});
});
