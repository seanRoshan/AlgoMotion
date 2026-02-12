import { describe, expect, it } from 'vitest';
import {
	blendColors,
	getSemanticColorNumber,
	hexToNumber,
	numberToHex,
	SEMANTIC_COLOR_KEYS,
	semanticColors,
} from './colors';

describe('semanticColors', () => {
	it('has 10 semantic color entries', () => {
		expect(Object.keys(semanticColors)).toHaveLength(10);
	});

	it('all values are hex strings starting with #', () => {
		for (const value of Object.values(semanticColors)) {
			expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});

	it('SEMANTIC_COLOR_KEYS matches object keys', () => {
		expect(SEMANTIC_COLOR_KEYS).toEqual(Object.keys(semanticColors));
	});

	it('has expected specific colors', () => {
		expect(semanticColors.active).toBe('#3b82f6');
		expect(semanticColors.sorted).toBe('#10b981');
		expect(semanticColors.error).toBe('#ef4444');
	});
});

describe('hexToNumber', () => {
	it('converts 6-digit hex to number', () => {
		expect(hexToNumber('#ff0000')).toBe(0xff0000);
		expect(hexToNumber('#00ff00')).toBe(0x00ff00);
		expect(hexToNumber('#0000ff')).toBe(0x0000ff);
		expect(hexToNumber('#ffffff')).toBe(0xffffff);
		expect(hexToNumber('#000000')).toBe(0x000000);
	});

	it('converts 3-digit shorthand hex', () => {
		expect(hexToNumber('#f00')).toBe(0xff0000);
		expect(hexToNumber('#0f0')).toBe(0x00ff00);
		expect(hexToNumber('#fff')).toBe(0xffffff);
	});

	it('works without # prefix', () => {
		expect(hexToNumber('ff0000')).toBe(0xff0000);
	});
});

describe('numberToHex', () => {
	it('converts number to 6-digit hex string', () => {
		expect(numberToHex(0xff0000)).toBe('#ff0000');
		expect(numberToHex(0x00ff00)).toBe('#00ff00');
		expect(numberToHex(0x0000ff)).toBe('#0000ff');
	});

	it('pads small numbers with leading zeros', () => {
		expect(numberToHex(0)).toBe('#000000');
		expect(numberToHex(0x0000ff)).toBe('#0000ff');
	});
});

describe('hexToNumber / numberToHex roundtrip', () => {
	it('roundtrips correctly', () => {
		const colors = ['#3b82f6', '#f59e0b', '#10b981', '#000000', '#ffffff'];
		for (const hex of colors) {
			expect(numberToHex(hexToNumber(hex))).toBe(hex);
		}
	});
});

describe('getSemanticColorNumber', () => {
	it('returns numeric value for semantic color keys', () => {
		expect(getSemanticColorNumber('active')).toBe(hexToNumber('#3b82f6'));
		expect(getSemanticColorNumber('error')).toBe(hexToNumber('#ef4444'));
	});
});

describe('blendColors', () => {
	it('returns first color at ratio 0', () => {
		expect(blendColors('#ff0000', '#0000ff', 0)).toBe('#ff0000');
	});

	it('returns second color at ratio 1', () => {
		expect(blendColors('#ff0000', '#0000ff', 1)).toBe('#0000ff');
	});

	it('blends to midpoint at ratio 0.5', () => {
		const mid = blendColors('#000000', '#ffffff', 0.5);
		// Each channel should be ~128 (0x80)
		const num = hexToNumber(mid);
		const r = (num >> 16) & 0xff;
		const g = (num >> 8) & 0xff;
		const b = num & 0xff;
		expect(r).toBeGreaterThanOrEqual(127);
		expect(r).toBeLessThanOrEqual(128);
		expect(g).toBeGreaterThanOrEqual(127);
		expect(g).toBeLessThanOrEqual(128);
		expect(b).toBeGreaterThanOrEqual(127);
		expect(b).toBeLessThanOrEqual(128);
	});

	it('clamps ratio below 0', () => {
		expect(blendColors('#ff0000', '#0000ff', -1)).toBe('#ff0000');
	});

	it('clamps ratio above 1', () => {
		expect(blendColors('#ff0000', '#0000ff', 2)).toBe('#0000ff');
	});
});
