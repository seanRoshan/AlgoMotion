/**
 * Tests for Supabase middleware helper (session refresh on request).
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
	createServerClient: vi.fn(() => ({
		auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })) },
	})),
}));

describe('updateSession', () => {
	it('exports updateSession function', async () => {
		const mod = await import('./middleware');
		expect(mod.updateSession).toBeDefined();
		expect(typeof mod.updateSession).toBe('function');
	});

	it('returns a NextResponse', async () => {
		const { NextRequest, NextResponse } = await import('next/server');
		const { updateSession } = await import('./middleware');

		const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
		const response = await updateSession(request);

		expect(response).toBeInstanceOf(NextResponse);
	});

	it('redirects to login for protected routes when not authenticated', async () => {
		const { NextRequest } = await import('next/server');
		const { updateSession } = await import('./middleware');

		const request = new NextRequest(new URL('http://localhost:3000/editor/abc'));
		const response = await updateSession(request);

		// Protected routes redirect to login when no user
		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toContain('/login');
	});

	it('allows public routes without auth', async () => {
		const { NextRequest } = await import('next/server');
		const { updateSession } = await import('./middleware');

		const request = new NextRequest(new URL('http://localhost:3000/'));
		const response = await updateSession(request);

		expect(response.status).toBe(200);
	});

	it('bypasses auth when E2E_TESTING is set', async () => {
		const original = process.env.E2E_TESTING;
		process.env.E2E_TESTING = 'true';

		try {
			const { NextRequest } = await import('next/server');
			const { updateSession } = await import('./middleware');

			const request = new NextRequest(new URL('http://localhost:3000/editor/abc'));
			const response = await updateSession(request);

			// Should pass through without redirect
			expect(response.status).toBe(200);
		} finally {
			process.env.E2E_TESTING = original;
		}
	});
});
