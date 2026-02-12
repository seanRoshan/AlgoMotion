/**
 * Tests for useSync hook.
 */

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSyncStore } from '@/lib/stores/sync-store';
import { useSync } from './use-sync';

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => ({
	createClient: () => ({
		auth: {
			getSession: vi.fn(async () => ({ data: { session: { user: { id: 'user-1' } } } })),
			onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
		},
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					order: vi.fn(() => ({
						returns: vi.fn(async () => ({ data: [], error: null })),
					})),
				})),
			})),
		})),
	}),
}));

// Mock dexie-storage
vi.mock('@/lib/stores/dexie-storage', () => ({
	getDB: () => ({
		projects: {
			toArray: vi.fn(async () => []),
			put: vi.fn(async () => {}),
			delete: vi.fn(async () => {}),
		},
	}),
}));

describe('useSync', () => {
	afterEach(() => {
		useSyncStore.getState().reset();
	});

	it('returns sync state', () => {
		const { result } = renderHook(() => useSync());
		expect(result.current.status).toBeDefined();
		expect(result.current.connectivity).toBeDefined();
		expect(result.current.lastSyncedAt).toBeDefined();
	});

	it('returns triggerSync function', () => {
		const { result } = renderHook(() => useSync());
		expect(typeof result.current.triggerSync).toBe('function');
	});

	it('exposes error from sync store', () => {
		useSyncStore.getState().setError('Test error');
		const { result } = renderHook(() => useSync());
		expect(result.current.error).toBe('Test error');
	});

	it('exposes quotaWarning from sync store', () => {
		useSyncStore.getState().setQuotaUsage(0.9);
		const { result } = renderHook(() => useSync());
		expect(result.current.quotaWarning).toBe(true);
	});
});
