import { describe, expect, it } from 'vitest';
import { APP_NAME, MIN_DESKTOP_WIDTH, PANEL_DEFAULTS, TOOLBAR_HEIGHT } from './constants';

describe('constants', () => {
	it('has correct app name', () => {
		expect(APP_NAME).toBe('AlgoMotion');
	});

	it('has desktop width minimum', () => {
		expect(MIN_DESKTOP_WIDTH).toBe(1024);
	});

	it('has panel defaults with min/max constraints', () => {
		expect(PANEL_DEFAULTS.left.min).toBeLessThan(PANEL_DEFAULTS.left.max);
		expect(PANEL_DEFAULTS.right.min).toBeLessThan(PANEL_DEFAULTS.right.max);
		expect(PANEL_DEFAULTS.bottom.min).toBeGreaterThan(0);
		expect(PANEL_DEFAULTS.bottom.height).toBeGreaterThan(PANEL_DEFAULTS.bottom.min);
	});

	it('has toolbar height', () => {
		expect(TOOLBAR_HEIGHT).toBeGreaterThan(0);
	});
});
