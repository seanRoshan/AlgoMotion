/**
 * Tests for sync store.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { useSyncStore } from './sync-store';

describe('useSyncStore', () => {
	afterEach(() => {
		useSyncStore.getState().reset();
	});

	it('starts with idle defaults', () => {
		const state = useSyncStore.getState();
		expect(state.status).toBe('offline');
		expect(state.connectivity).toBe('offline');
		expect(state.lastSyncedAt).toBeNull();
		expect(state.error).toBeNull();
		expect(state.queue).toEqual([]);
	});

	it('setConnectivity updates connectivity', () => {
		useSyncStore.getState().setConnectivity('online');
		expect(useSyncStore.getState().connectivity).toBe('online');
	});

	it('setStatus updates sync status', () => {
		useSyncStore.getState().setStatus('syncing');
		expect(useSyncStore.getState().status).toBe('syncing');
	});

	it('setLastSyncedAt updates timestamp', () => {
		const ts = '2026-02-10T12:00:00Z';
		useSyncStore.getState().setLastSyncedAt(ts);
		expect(useSyncStore.getState().lastSyncedAt).toBe(ts);
	});

	it('setError updates error message', () => {
		useSyncStore.getState().setError('Network error');
		expect(useSyncStore.getState().error).toBe('Network error');
		expect(useSyncStore.getState().status).toBe('error');
	});

	it('clearError resets error and status', () => {
		useSyncStore.getState().setError('fail');
		useSyncStore.getState().clearError();
		expect(useSyncStore.getState().error).toBeNull();
		expect(useSyncStore.getState().status).toBe('idle');
	});

	it('addToQueue adds a sync queue item', () => {
		useSyncStore.getState().addToQueue({
			id: 'q1',
			entityType: 'project',
			entityId: 'proj-1',
			direction: 'push',
			timestamp: '2026-01-01T00:00:00Z',
			retryCount: 0,
		});
		expect(useSyncStore.getState().queue).toHaveLength(1);
		expect(useSyncStore.getState().queue[0]?.id).toBe('q1');
	});

	it('removeFromQueue removes by id', () => {
		useSyncStore.getState().addToQueue({
			id: 'q1',
			entityType: 'project',
			entityId: 'proj-1',
			direction: 'push',
			timestamp: '2026-01-01T00:00:00Z',
			retryCount: 0,
		});
		useSyncStore.getState().addToQueue({
			id: 'q2',
			entityType: 'scene',
			entityId: 'scene-1',
			direction: 'push',
			timestamp: '2026-01-01T00:00:00Z',
			retryCount: 0,
		});
		useSyncStore.getState().removeFromQueue('q1');
		expect(useSyncStore.getState().queue).toHaveLength(1);
		expect(useSyncStore.getState().queue[0]?.id).toBe('q2');
	});

	it('incrementRetry increases retryCount', () => {
		useSyncStore.getState().addToQueue({
			id: 'q1',
			entityType: 'project',
			entityId: 'proj-1',
			direction: 'push',
			timestamp: '2026-01-01T00:00:00Z',
			retryCount: 0,
		});
		useSyncStore.getState().incrementRetry('q1');
		expect(useSyncStore.getState().queue[0]?.retryCount).toBe(1);
	});

	it('setQuotaUsage updates usage percentage', () => {
		useSyncStore.getState().setQuotaUsage(0.75);
		expect(useSyncStore.getState().quotaUsage).toBe(0.75);
	});

	it('quotaWarning is true when usage exceeds threshold', () => {
		useSyncStore.getState().setQuotaUsage(0.85);
		expect(useSyncStore.getState().quotaWarning).toBe(true);
	});

	it('quotaWarning is false when usage is below threshold', () => {
		useSyncStore.getState().setQuotaUsage(0.5);
		expect(useSyncStore.getState().quotaWarning).toBe(false);
	});

	it('reset restores initial state', () => {
		useSyncStore.getState().setStatus('syncing');
		useSyncStore.getState().setConnectivity('online');
		useSyncStore.getState().setError('fail');
		useSyncStore.getState().reset();

		const state = useSyncStore.getState();
		expect(state.status).toBe('offline');
		expect(state.connectivity).toBe('offline');
		expect(state.error).toBeNull();
	});
});
