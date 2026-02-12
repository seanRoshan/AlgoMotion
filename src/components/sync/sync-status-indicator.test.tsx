/**
 * Tests for SyncStatusIndicator component.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/lib/stores/sync-store';
import { SyncStatusIndicator } from './sync-status-indicator';

// Mock useSync hook
const mockTriggerSync = vi.fn();
vi.mock('@/hooks/use-sync', () => ({
	useSync: () => ({
		...useSyncStore.getState(),
		triggerSync: mockTriggerSync,
		quotaWarning: useSyncStore.getState().quotaWarning,
	}),
}));

describe('SyncStatusIndicator', () => {
	afterEach(() => {
		cleanup();
		useSyncStore.getState().reset();
		mockTriggerSync.mockClear();
	});

	it('shows offline status', () => {
		useSyncStore.getState().setConnectivity('offline');
		useSyncStore.getState().setStatus('offline');
		render(<SyncStatusIndicator />);
		expect(screen.getByText('Offline')).toBeDefined();
	});

	it('shows syncing status', () => {
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setStatus('syncing');
		render(<SyncStatusIndicator />);
		expect(screen.getByText('Syncing...')).toBeDefined();
	});

	it('shows synced status', () => {
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setStatus('synced');
		render(<SyncStatusIndicator />);
		expect(screen.getByText('Synced')).toBeDefined();
	});

	it('shows error status', () => {
		useSyncStore.getState().setError('Network failure');
		render(<SyncStatusIndicator />);
		expect(screen.getByText('Sync error')).toBeDefined();
	});

	it('shows pending status', () => {
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setStatus('pending');
		render(<SyncStatusIndicator />);
		expect(screen.getByText('Pending')).toBeDefined();
	});

	it('renders sync button', () => {
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setStatus('synced');
		render(<SyncStatusIndicator />);
		expect(screen.getByRole('button', { name: /sync now/i })).toBeDefined();
	});

	it('calls triggerSync on button click', async () => {
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setStatus('synced');
		render(<SyncStatusIndicator />);

		const btn = screen.getByRole('button', { name: /sync now/i });
		await userEvent.click(btn);

		expect(mockTriggerSync).toHaveBeenCalledTimes(1);
	});

	it('disables sync button when offline', () => {
		useSyncStore.getState().setConnectivity('offline');
		useSyncStore.getState().setStatus('offline');
		render(<SyncStatusIndicator />);

		const btn = screen.getByRole('button', { name: /sync now/i });
		expect(btn.hasAttribute('disabled')).toBe(true);
	});

	it('disables sync button when syncing', () => {
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setStatus('syncing');
		render(<SyncStatusIndicator />);

		const btn = screen.getByRole('button', { name: /sync now/i });
		expect(btn.hasAttribute('disabled')).toBe(true);
	});

	it('shows quota warning when usage is high', () => {
		useSyncStore.getState().setQuotaUsage(0.9);
		render(<SyncStatusIndicator />);
		expect(screen.getByText(/storage.*90%/i)).toBeDefined();
	});
});
