/**
 * Tests for useOnlineStatus hook.
 */

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnlineStatus } from './use-online-status';

describe('useOnlineStatus', () => {
	const originalOnLine = navigator.onLine;

	beforeEach(() => {
		Object.defineProperty(navigator, 'onLine', {
			writable: true,
			value: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'onLine', {
			writable: true,
			value: originalOnLine,
		});
		vi.restoreAllMocks();
	});

	it('returns true when online', () => {
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current).toBe(true);
	});

	it('returns false when offline', () => {
		Object.defineProperty(navigator, 'onLine', { value: false });
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current).toBe(false);
	});

	it('registers online and offline event listeners', () => {
		const addSpy = vi.spyOn(window, 'addEventListener');
		renderHook(() => useOnlineStatus());
		expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));
	});

	it('cleans up event listeners on unmount', () => {
		const removeSpy = vi.spyOn(window, 'removeEventListener');
		const { unmount } = renderHook(() => useOnlineStatus());
		unmount();
		expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
	});
});
