/**
 * Tests for auth callback route handler.
 */

import { describe, expect, it, vi } from 'vitest';

const mockExchangeCodeForSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
	createServerClient: vi.fn(() => ({
		auth: {
			exchangeCodeForSession: mockExchangeCodeForSession,
		},
	})),
}));

vi.mock('next/headers', () => ({
	cookies: vi.fn(() => ({
		getAll: vi.fn(() => []),
		set: vi.fn(),
	})),
}));

vi.mock('next/server', () => ({
	NextResponse: {
		redirect: vi.fn((url: string) => ({ redirectUrl: url })),
	},
}));

describe('auth callback route', () => {
	it('exports a GET handler', async () => {
		const mod = await import('./route');
		expect(mod.GET).toBeDefined();
		expect(typeof mod.GET).toBe('function');
	});

	it('exchanges code for session on success', async () => {
		mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

		const { GET } = await import('./route');
		const searchParams = new URLSearchParams({ code: 'test-code' });

		const request = {
			nextUrl: {
				searchParams,
				origin: 'http://localhost:3000',
			},
		} as never;

		await GET(request);

		expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code');
	});

	it('redirects to login on missing code', async () => {
		const { GET } = await import('./route');
		const { NextResponse } = await import('next/server');

		const request = {
			nextUrl: {
				searchParams: new URLSearchParams(),
				origin: 'http://localhost:3000',
			},
		} as never;

		await GET(request);

		expect(NextResponse.redirect).toHaveBeenCalledWith(
			'http://localhost:3000/login?error=auth_callback_failed',
		);
	});

	it('redirects to dashboard by default after successful exchange', async () => {
		mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

		const { GET } = await import('./route');
		const { NextResponse } = await import('next/server');

		const request = {
			nextUrl: {
				searchParams: new URLSearchParams({ code: 'valid-code' }),
				origin: 'http://localhost:3000',
			},
		} as never;

		await GET(request);

		expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
	});

	it('redirects to custom next path after successful exchange', async () => {
		mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

		const { GET } = await import('./route');
		const { NextResponse } = await import('next/server');

		const request = {
			nextUrl: {
				searchParams: new URLSearchParams({ code: 'valid-code', next: '/editor/123' }),
				origin: 'http://localhost:3000',
			},
		} as never;

		await GET(request);

		expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/editor/123');
	});
});
