/**
 * Tests for useServiceWorker hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useServiceWorker } from './use-service-worker';

describe('useServiceWorker', () => {
	const originalServiceWorker = navigator.serviceWorker;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'serviceWorker', {
			writable: true,
			configurable: true,
			value: originalServiceWorker,
		});
	});

	it('returns unsupported when serviceWorker not available', () => {
		Object.defineProperty(navigator, 'serviceWorker', {
			writable: true,
			configurable: true,
			value: undefined,
		});

		const { result } = renderHook(() => useServiceWorker());
		expect(result.current).toBe('unsupported');
	});

	it('returns registered after successful registration', async () => {
		Object.defineProperty(navigator, 'serviceWorker', {
			writable: true,
			configurable: true,
			value: {
				register: vi.fn().mockResolvedValue({ scope: '/' }),
			},
		});

		const { result } = renderHook(() => useServiceWorker());

		await waitFor(() => {
			expect(result.current).toBe('registered');
		});
	});

	it('returns error on registration failure', async () => {
		Object.defineProperty(navigator, 'serviceWorker', {
			writable: true,
			configurable: true,
			value: {
				register: vi.fn().mockRejectedValue(new Error('Failed')),
			},
		});

		const { result } = renderHook(() => useServiceWorker());

		await waitFor(() => {
			expect(result.current).toBe('error');
		});
	});

	it('registers /sw.js', () => {
		const registerMock = vi.fn().mockResolvedValue({ scope: '/' });
		Object.defineProperty(navigator, 'serviceWorker', {
			writable: true,
			configurable: true,
			value: { register: registerMock },
		});

		renderHook(() => useServiceWorker());
		expect(registerMock).toHaveBeenCalledWith('/sw.js');
	});
});
