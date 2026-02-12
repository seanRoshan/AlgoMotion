/**
 * Tests for OAuth buttons component.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/use-auth', () => ({
	useAuth: vi.fn(() => ({
		user: null,
		loading: false,
		signInWithOAuth: vi.fn(),
		signInWithMagicLink: vi.fn(),
		signInWithPassword: vi.fn(),
		signUp: vi.fn(),
		signOut: vi.fn(),
	})),
}));

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

describe('OAuthButtons', () => {
	it('exports OAuthButtons component', async () => {
		const mod = await import('./oauth-buttons');
		expect(mod.OAuthButtons).toBeDefined();
	});
});
