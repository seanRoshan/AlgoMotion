import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '@/lib/stores/ui-store';
import { useThemeSync } from './use-theme-sync';

// Mock next-themes
const mockSetTheme = vi.fn();
let mockTheme = 'dark';

vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: mockTheme,
		setTheme: (t: string) => {
			mockTheme = t;
			mockSetTheme(t);
		},
		resolvedTheme: mockTheme === 'system' ? 'dark' : mockTheme,
		systemTheme: 'dark',
	}),
}));

describe('useThemeSync', () => {
	beforeEach(() => {
		mockTheme = 'dark';
		mockSetTheme.mockClear();
		useUIStore.getState().reset();
	});

	it('syncs UI store theme to next-themes on mount', () => {
		act(() => {
			useUIStore.getState().setTheme('light');
		});

		renderHook(() => useThemeSync());

		expect(mockSetTheme).toHaveBeenCalledWith('light');
	});

	it('syncs default dark theme on mount', () => {
		// UI store defaults to 'dark', mockTheme is 'dark'
		renderHook(() => useThemeSync());

		expect(mockSetTheme).toHaveBeenCalledWith('dark');
	});

	it('syncs system theme from store', () => {
		act(() => {
			useUIStore.getState().setTheme('system');
		});

		renderHook(() => useThemeSync());

		expect(mockSetTheme).toHaveBeenCalledWith('system');
	});

	it('updates next-themes when UI store theme changes', () => {
		renderHook(() => useThemeSync());
		mockSetTheme.mockClear();

		act(() => {
			useUIStore.getState().setTheme('light');
		});

		expect(mockSetTheme).toHaveBeenCalledWith('light');
	});
});
