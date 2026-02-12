/**
 * Tests for Next.js root middleware.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/middleware', () => ({
	updateSession: vi.fn(() => new Response()),
}));

describe('middleware', () => {
	it('exports middleware function', async () => {
		const mod = await import('./middleware');
		expect(mod.middleware).toBeDefined();
		expect(typeof mod.middleware).toBe('function');
	});

	it('exports config with matcher', async () => {
		const mod = await import('./middleware');
		expect(mod.config).toBeDefined();
		expect(mod.config.matcher).toBeDefined();
		expect(Array.isArray(mod.config.matcher)).toBe(true);
	});

	it('calls updateSession with the request', async () => {
		const { updateSession } = await import('@/lib/supabase/middleware');
		const { middleware } = await import('./middleware');

		const mockRequest = { nextUrl: { pathname: '/dashboard' } } as never;
		await middleware(mockRequest);

		expect(updateSession).toHaveBeenCalledWith(mockRequest);
	});
});
