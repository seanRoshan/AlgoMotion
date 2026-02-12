/**
 * Tests for Supabase browser client utility.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
	createBrowserClient: vi.fn(() => ({
		auth: { getSession: vi.fn() },
		from: vi.fn(),
	})),
}));

describe('createClient (browser)', () => {
	it('exports createClient function', async () => {
		const mod = await import('./client');
		expect(mod.createClient).toBeDefined();
		expect(typeof mod.createClient).toBe('function');
	});

	it('returns a Supabase client', async () => {
		const { createClient } = await import('./client');
		const client = createClient();
		expect(client).toBeDefined();
		expect(client.auth).toBeDefined();
	});

	it('calls createBrowserClient from @supabase/ssr', async () => {
		const { createBrowserClient } = await import('@supabase/ssr');
		const { createClient } = await import('./client');
		createClient();
		expect(createBrowserClient).toHaveBeenCalled();
	});
});
