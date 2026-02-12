import { describe, expect, it } from 'vitest';
import {
	blendColors,
	getSemanticColorNumber,
	getThemeColors,
	hexToNumber,
	numberToHex,
	resolveSemanticColors,
	SEMANTIC_COLOR_KEYS,
	STATE_INDICATORS,
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

describe('getThemeColors', () => {
	it('returns dark theme colors by default', () => {
		const colors = getThemeColors('dark');
		expect(colors.active).toBe(semanticColors.active);
		expect(colors.sorted).toBe(semanticColors.sorted);
	});

	it('returns light theme colors with adjusted values', () => {
		const colors = getThemeColors('light');
		// Light theme should have all 10 keys
		expect(Object.keys(colors)).toHaveLength(10);
		// Light theme adjusts unvisited for darker background contrast
		expect(colors.unvisited).not.toBe(semanticColors.unvisited);
	});

	it('returns all 10 semantic color keys for both themes', () => {
		const dark = getThemeColors('dark');
		const light = getThemeColors('light');
		for (const key of SEMANTIC_COLOR_KEYS) {
			expect(dark[key]).toBeDefined();
			expect(light[key]).toBeDefined();
		}
	});
});

describe('resolveSemanticColors', () => {
	it('returns default colors when no overrides provided', () => {
		const resolved = resolveSemanticColors('dark');
		expect(resolved.active).toBe(semanticColors.active);
	});

	it('merges user overrides with defaults', () => {
		const resolved = resolveSemanticColors('dark', { active: '#ff0000' });
		expect(resolved.active).toBe('#ff0000');
		expect(resolved.sorted).toBe(semanticColors.sorted);
	});

	it('preserves all keys even when overriding some', () => {
		const resolved = resolveSemanticColors('dark', { error: '#cc0000' });
		expect(Object.keys(resolved)).toHaveLength(10);
		expect(resolved.error).toBe('#cc0000');
	});
});

describe('STATE_INDICATORS', () => {
	it('defines multi-signal indicators for key states', () => {
		expect(STATE_INDICATORS.sorted).toBeDefined();
		expect(STATE_INDICATORS.sorted.colorKey).toBe('sorted');
		expect(STATE_INDICATORS.sorted.icon).toBe('check');

		expect(STATE_INDICATORS.error).toBeDefined();
		expect(STATE_INDICATORS.error.colorKey).toBe('error');
		expect(STATE_INDICATORS.error.icon).toBe('x');
	});

	it('includes indicator for active state with pulse effect', () => {
		expect(STATE_INDICATORS.active.colorKey).toBe('active');
		expect(STATE_INDICATORS.active.effect).toBe('pulse');
	});

	it('includes indicator for comparing state', () => {
		expect(STATE_INDICATORS.comparing.colorKey).toBe('comparing');
		expect(STATE_INDICATORS.comparing.icon).toBe('arrows');
	});

	it('all indicators have a colorKey', () => {
		for (const indicator of Object.values(STATE_INDICATORS)) {
			expect(indicator.colorKey).toBeDefined();
		}
	});
});
