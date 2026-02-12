/**
 * Tests for Next.js root proxy.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/middleware', () => ({
	updateSession: vi.fn(() => new Response()),
}));

describe('proxy', () => {
	it('exports proxy function', async () => {
		const mod = await import('./proxy');
		expect(mod.proxy).toBeDefined();
		expect(typeof mod.proxy).toBe('function');
	});

	it('exports config with matcher', async () => {
		const mod = await import('./proxy');
		expect(mod.config).toBeDefined();
		expect(mod.config.matcher).toBeDefined();
		expect(Array.isArray(mod.config.matcher)).toBe(true);
	});

	it('calls updateSession with the request', async () => {
		const { updateSession } = await import('@/lib/supabase/middleware');
		const { proxy } = await import('./proxy');

		const mockRequest = { nextUrl: { pathname: '/dashboard' } } as never;
		await proxy(mockRequest);

		expect(updateSession).toHaveBeenCalledWith(mockRequest);
	});
});
