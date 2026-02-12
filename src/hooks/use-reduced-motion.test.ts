/**
 * Tests for useReducedMotion hook.
 */

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './use-reduced-motion';

describe('useReducedMotion', () => {
	let matchMediaMock: ReturnType<typeof vi.fn>;
	let listeners: Map<string, (e: MediaQueryListEvent) => void>;

	beforeEach(() => {
		listeners = new Map();
		matchMediaMock = vi.fn((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
				listeners.set(_event, handler);
			}),
			removeEventListener: vi.fn(),
			onchange: null,
		}));
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: matchMediaMock,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns false when no preference is set', () => {
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);
	});

	it('returns true when reduced motion is preferred', () => {
		matchMediaMock.mockReturnValue({
			matches: true,
			media: '(prefers-reduced-motion: reduce)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(true);
	});

	it('registers a change listener on matchMedia', () => {
		const addEventListener = vi.fn();
		matchMediaMock.mockReturnValue({
			matches: false,
			media: '(prefers-reduced-motion: reduce)',
			addEventListener,
			removeEventListener: vi.fn(),
		});

		renderHook(() => useReducedMotion());
		expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
	});

	it('cleans up listener on unmount', () => {
		const removeEventListener = vi.fn();
		matchMediaMock.mockReturnValue({
			matches: false,
			media: '(prefers-reduced-motion: reduce)',
			addEventListener: vi.fn(),
			removeEventListener,
		});

		const { unmount } = renderHook(() => useReducedMotion());
		unmount();
		expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
	});
});
