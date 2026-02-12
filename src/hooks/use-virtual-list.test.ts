/**
 * Tests for useVirtualList hook.
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useVirtualList } from './use-virtual-list';

describe('useVirtualList', () => {
	it('returns visible items for viewport', () => {
		const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const { result } = renderHook(() =>
			useVirtualList({
				items,
				itemHeight: 32,
				containerHeight: 320,
				overscan: 2,
			}),
		);
		// 320 / 32 = 10 visible + 2 overscan each side = 14
		expect(result.current.visibleItems.length).toBeLessThanOrEqual(14);
		expect(result.current.visibleItems.length).toBeGreaterThanOrEqual(10);
	});

	it('returns totalHeight', () => {
		const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
		const { result } = renderHook(() =>
			useVirtualList({
				items,
				itemHeight: 32,
				containerHeight: 320,
				overscan: 2,
			}),
		);
		expect(result.current.totalHeight).toBe(50 * 32);
	});

	it('returns offsetTop', () => {
		const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const { result } = renderHook(() =>
			useVirtualList({
				items,
				itemHeight: 32,
				containerHeight: 320,
				overscan: 0,
			}),
		);
		// Starting at scrollTop 0, offsetTop should be 0
		expect(result.current.offsetTop).toBe(0);
	});

	it('handles empty items', () => {
		const { result } = renderHook(() =>
			useVirtualList({
				items: [],
				itemHeight: 32,
				containerHeight: 320,
				overscan: 2,
			}),
		);
		expect(result.current.visibleItems).toEqual([]);
		expect(result.current.totalHeight).toBe(0);
	});

	it('returns setScrollTop function', () => {
		const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const { result } = renderHook(() =>
			useVirtualList({
				items,
				itemHeight: 32,
				containerHeight: 320,
				overscan: 2,
			}),
		);
		expect(typeof result.current.setScrollTop).toBe('function');
	});
});
