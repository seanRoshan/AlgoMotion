/**
 * Tests for OfflineIndicator component.
 */

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineIndicator } from './offline-indicator';

// Mock the useOnlineStatus hook
vi.mock('@/hooks/use-online-status', () => ({
	useOnlineStatus: vi.fn(),
}));

import { useOnlineStatus } from '@/hooks/use-online-status';

const mockUseOnlineStatus = vi.mocked(useOnlineStatus);

describe('OfflineIndicator', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders offline message when offline', () => {
		mockUseOnlineStatus.mockReturnValue(false);
		render(<OfflineIndicator />);
		expect(screen.getByRole('status')).toBeDefined();
		expect(screen.getByText(/you are offline/i)).toBeDefined();
	});

	it('renders nothing when online', () => {
		mockUseOnlineStatus.mockReturnValue(true);
		const { container } = render(<OfflineIndicator />);
		expect(container.innerHTML).toBe('');
	});

	it('has role=status for accessibility', () => {
		mockUseOnlineStatus.mockReturnValue(false);
		render(<OfflineIndicator />);
		expect(screen.getByRole('status')).toBeDefined();
	});
});
