/**
 * Tests for useAuth hook — client-side auth state.
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
	createClient: vi.fn(() => ({
		auth: {
			getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
			onAuthStateChange: vi.fn(() => ({
				data: { subscription: { unsubscribe: vi.fn() } },
			})),
		},
	})),
}));

describe('useAuth', () => {
	it('exports useAuth hook', async () => {
		const mod = await import('./use-auth');
		expect(mod.useAuth).toBeDefined();
	});

	it('returns initial state with no user', async () => {
		const { useAuth } = await import('./use-auth');
		const { result } = renderHook(() => useAuth());

		expect(result.current.user).toBeNull();
		expect(result.current.loading).toBe(true);
	});

	it('provides signOut function', async () => {
		const { useAuth } = await import('./use-auth');
		const { result } = renderHook(() => useAuth());

		expect(typeof result.current.signOut).toBe('function');
	});

	it('provides signInWithOAuth function', async () => {
		const { useAuth } = await import('./use-auth');
		const { result } = renderHook(() => useAuth());

		expect(typeof result.current.signInWithOAuth).toBe('function');
	});

	it('provides signInWithMagicLink function', async () => {
		const { useAuth } = await import('./use-auth');
		const { result } = renderHook(() => useAuth());

		expect(typeof result.current.signInWithMagicLink).toBe('function');
	});

	it('provides signInWithPassword function', async () => {
		const { useAuth } = await import('./use-auth');
		const { result } = renderHook(() => useAuth());

		expect(typeof result.current.signInWithPassword).toBe('function');
	});

	it('provides signUp function', async () => {
		const { useAuth } = await import('./use-auth');
		const { result } = renderHook(() => useAuth());

		expect(typeof result.current.signUp).toBe('function');
	});
});
