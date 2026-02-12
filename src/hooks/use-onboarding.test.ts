/**
 * Tests for useOnboarding hook.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOnboarding } from './use-onboarding';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useOnboarding', () => {
	afterEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('starts active when not completed', () => {
		const { result } = renderHook(() => useOnboarding());
		expect(result.current.isActive).toBe(true);
		expect(result.current.currentStep).toBe(0);
	});

	it('starts inactive when already completed', () => {
		localStorageMock.setItem('algomotion-onboarding-completed', 'true');
		const { result } = renderHook(() => useOnboarding());
		expect(result.current.isActive).toBe(false);
	});

	it('advances to next step', () => {
		const { result } = renderHook(() => useOnboarding());
		act(() => result.current.nextStep());
		expect(result.current.currentStep).toBe(1);
	});

	it('goes to previous step', () => {
		const { result } = renderHook(() => useOnboarding());
		act(() => result.current.nextStep());
		act(() => result.current.prevStep());
		expect(result.current.currentStep).toBe(0);
	});

	it('does not go below step 0', () => {
		const { result } = renderHook(() => useOnboarding());
		act(() => result.current.prevStep());
		expect(result.current.currentStep).toBe(0);
	});

	it('completes on last step advance', () => {
		const { result } = renderHook(() => useOnboarding());
		for (let i = 0; i < 5; i++) {
			act(() => result.current.nextStep());
		}
		expect(result.current.isActive).toBe(false);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			'algomotion-onboarding-completed',
			'true',
		);
	});

	it('skip completes immediately', () => {
		const { result } = renderHook(() => useOnboarding());
		act(() => result.current.skip());
		expect(result.current.isActive).toBe(false);
	});

	it('returns current tutorial step data', () => {
		const { result } = renderHook(() => useOnboarding());
		expect(result.current.step?.id).toBe('add-element');
		expect(result.current.step?.title).toBeTruthy();
	});

	it('returns totalSteps', () => {
		const { result } = renderHook(() => useOnboarding());
		expect(result.current.totalSteps).toBe(5);
	});

	it('reset clears localStorage and restarts', () => {
		const { result } = renderHook(() => useOnboarding());
		act(() => result.current.skip());
		act(() => result.current.reset());
		expect(result.current.isActive).toBe(true);
		expect(result.current.currentStep).toBe(0);
	});
});
