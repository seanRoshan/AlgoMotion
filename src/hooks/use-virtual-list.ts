/**
 * Lightweight virtual list hook for performance.
 *
 * Renders only visible items + overscan buffer.
 * Used for timeline tracks and element library.
 *
 * Spec reference: Section 10 (Performance)
 */

'use client';

import { useMemo, useState } from 'react';

export interface UseVirtualListOptions<T> {
	items: T[];
	itemHeight: number;
	containerHeight: number;
	overscan?: number;
}

export interface UseVirtualListResult<T> {
	visibleItems: T[];
	totalHeight: number;
	offsetTop: number;
	setScrollTop: (scrollTop: number) => void;
}

export function useVirtualList<T>({
	items,
	itemHeight,
	containerHeight,
	overscan = 2,
}: UseVirtualListOptions<T>): UseVirtualListResult<T> {
	const [scrollTop, setScrollTop] = useState(0);

	const totalHeight = items.length * itemHeight;

	const { visibleItems, offsetTop } = useMemo(() => {
		if (items.length === 0) {
			return { visibleItems: [] as T[], offsetTop: 0 };
		}

		const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
		const endIdx = Math.min(items.length, startIdx + visibleCount);

		return {
			visibleItems: items.slice(startIdx, endIdx),
			offsetTop: startIdx * itemHeight,
		};
	}, [items, itemHeight, containerHeight, scrollTop, overscan]);

	return {
		visibleItems,
		totalHeight,
		offsetTop,
		setScrollTop,
	};
}
