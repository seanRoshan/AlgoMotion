/**
 * Tests for performance budget constants.
 */

import { describe, expect, it } from 'vitest';
import {
	MAX_BUNDLE_KB,
	MAX_ELEMENTS_LIMIT,
	MAX_ELEMENTS_OPTIMAL,
	MAX_MEMORY_MB,
	MAX_SAVE_MS,
	MAX_STEP_MS,
	RENDER_DEBOUNCE_MS,
	TARGET_FRAME_MS,
	VIRTUAL_ITEM_HEIGHT,
	VIRTUAL_OVERSCAN,
} from './constants';

describe('performance constants', () => {
	it('TARGET_FRAME_MS is 16ms (60fps)', () => {
		expect(TARGET_FRAME_MS).toBe(16);
	});

	it('MAX_ELEMENTS_OPTIMAL is 500', () => {
		expect(MAX_ELEMENTS_OPTIMAL).toBe(500);
	});

	it('MAX_ELEMENTS_LIMIT is 1000', () => {
		expect(MAX_ELEMENTS_LIMIT).toBe(1000);
	});

	it('MAX_STEP_MS is 50ms', () => {
		expect(MAX_STEP_MS).toBe(50);
	});

	it('MAX_SAVE_MS is 100ms', () => {
		expect(MAX_SAVE_MS).toBe(100);
	});

	it('MAX_BUNDLE_KB is 300KB', () => {
		expect(MAX_BUNDLE_KB).toBe(300);
	});

	it('MAX_MEMORY_MB is 512MB', () => {
		expect(MAX_MEMORY_MB).toBe(512);
	});

	it('RENDER_DEBOUNCE_MS is 16ms', () => {
		expect(RENDER_DEBOUNCE_MS).toBe(16);
	});

	it('VIRTUAL_ITEM_HEIGHT is 32px', () => {
		expect(VIRTUAL_ITEM_HEIGHT).toBe(32);
	});

	it('VIRTUAL_OVERSCAN is 5', () => {
		expect(VIRTUAL_OVERSCAN).toBe(5);
	});
});
