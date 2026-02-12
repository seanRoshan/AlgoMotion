import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '@/lib/stores/ui-store';
import { ThemeToggle } from './theme-toggle';

// Mock next-themes
const mockSetTheme = vi.fn();
let mockTheme = 'dark';

vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: mockTheme,
		setTheme: mockSetTheme,
		resolvedTheme: mockTheme === 'system' ? 'dark' : mockTheme,
		systemTheme: 'dark',
	}),
}));

describe('ThemeToggle', () => {
	beforeEach(() => {
		mockTheme = 'dark';
		mockSetTheme.mockClear();
		useUIStore.getState().reset();
	});

	it('renders a theme toggle button', () => {
		render(<ThemeToggle />);
		expect(screen.getByRole('button', { name: /theme/i })).toBeDefined();
	});

	it('opens a dropdown with dark, light, and system options', async () => {
		const user = userEvent.setup();
		render(<ThemeToggle />);

		await user.click(screen.getByRole('button', { name: /theme/i }));

		expect(screen.getByRole('menuitem', { name: /dark/i })).toBeDefined();
		expect(screen.getByRole('menuitem', { name: /light/i })).toBeDefined();
		expect(screen.getByRole('menuitem', { name: /system/i })).toBeDefined();
	});

	it('calls setTheme on next-themes when selecting light', async () => {
		const user = userEvent.setup();
		render(<ThemeToggle />);

		await user.click(screen.getByRole('button', { name: /theme/i }));
		await user.click(screen.getByRole('menuitem', { name: /light/i }));

		expect(mockSetTheme).toHaveBeenCalledWith('light');
	});

	it('updates UI store when selecting a theme', async () => {
		const user = userEvent.setup();
		render(<ThemeToggle />);

		await user.click(screen.getByRole('button', { name: /theme/i }));
		await user.click(screen.getByRole('menuitem', { name: /light/i }));

		expect(useUIStore.getState().theme).toBe('light');
	});

	it('calls setTheme on next-themes when selecting system', async () => {
		const user = userEvent.setup();
		render(<ThemeToggle />);

		await user.click(screen.getByRole('button', { name: /theme/i }));
		await user.click(screen.getByRole('menuitem', { name: /system/i }));

		expect(mockSetTheme).toHaveBeenCalledWith('system');
		expect(useUIStore.getState().theme).toBe('system');
	});
});
