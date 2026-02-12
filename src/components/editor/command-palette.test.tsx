import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '@/lib/stores/ui-store';
import { CommandPalette } from './command-palette';

// Mock next-themes (used by components in the tree)
vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

describe('CommandPalette', () => {
	beforeEach(() => {
		useUIStore.getState().reset();
	});

	it('does not render dialog content when closed', () => {
		render(<CommandPalette />);
		expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
	});

	it('renders dialog content when open', () => {
		act(() => {
			useUIStore.getState().setCommandPaletteOpen(true);
		});
		render(<CommandPalette />);
		expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
	});

	it('shows command groups when open', () => {
		act(() => {
			useUIStore.getState().setCommandPaletteOpen(true);
		});
		render(<CommandPalette />);

		// Should show at least the shortcut-based commands
		expect(screen.getByText('Play / Pause')).toBeDefined();
		expect(screen.getByText('Undo')).toBeDefined();
	});

	it('shows keyboard shortcuts inline', () => {
		act(() => {
			useUIStore.getState().setCommandPaletteOpen(true);
		});
		render(<CommandPalette />);

		// Space shortcut for play/pause should be visible
		expect(screen.getByText('Space')).toBeDefined();
	});

	it('closes the palette when Escape is pressed', async () => {
		const user = userEvent.setup();
		act(() => {
			useUIStore.getState().setCommandPaletteOpen(true);
		});
		render(<CommandPalette />);

		await user.keyboard('{Escape}');

		expect(useUIStore.getState().commandPaletteOpen).toBe(false);
	});

	it('filters commands based on search input', async () => {
		const user = userEvent.setup();
		act(() => {
			useUIStore.getState().setCommandPaletteOpen(true);
		});
		render(<CommandPalette />);

		const input = screen.getByPlaceholderText(/search/i);
		await user.type(input, 'zoom');

		// Zoom commands should still be visible
		expect(screen.getByText('Zoom In')).toBeDefined();
		expect(screen.getByText('Zoom Out')).toBeDefined();
	});

	it('closes when a command is selected', async () => {
		const user = userEvent.setup();
		act(() => {
			useUIStore.getState().setCommandPaletteOpen(true);
		});
		render(<CommandPalette />);

		const item = screen.getByText('Toggle Grid');
		await user.click(item);

		expect(useUIStore.getState().commandPaletteOpen).toBe(false);
	});
});
