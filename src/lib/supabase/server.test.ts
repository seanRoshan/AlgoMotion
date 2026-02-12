/**
 * Tests for Supabase server client utility.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
	createServerClient: vi.fn(() => ({
		auth: { getUser: vi.fn() },
		from: vi.fn(),
	})),
}));

vi.mock('next/headers', () => ({
	cookies: vi.fn(() => ({
		getAll: vi.fn(() => []),
		set: vi.fn(),
	})),
}));

describe('createServerSupabaseClient', () => {
	it('exports createServerSupabaseClient function', async () => {
		const mod = await import('./server');
		expect(mod.createServerSupabaseClient).toBeDefined();
		expect(typeof mod.createServerSupabaseClient).toBe('function');
	});

	it('returns a Supabase client', async () => {
		const { createServerSupabaseClient } = await import('./server');
		const client = await createServerSupabaseClient();
		expect(client).toBeDefined();
		expect(client.auth).toBeDefined();
	});

	it('calls createServerClient from @supabase/ssr', async () => {
		const { createServerClient } = await import('@supabase/ssr');
		const { createServerSupabaseClient } = await import('./server');
		await createServerSupabaseClient();
		expect(createServerClient).toHaveBeenCalled();
	});
});
