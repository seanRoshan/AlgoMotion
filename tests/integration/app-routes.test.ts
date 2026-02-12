import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
	Inter: () => ({ variable: '--font-inter', className: 'inter' }),
	JetBrains_Mono: () => ({ variable: '--font-mono', className: 'mono' }),
}));

const root = resolve(__dirname, '../..');

describe('App Router page structure (Issue #8)', () => {
	describe('route files exist', () => {
		it('has auth routes (login, signup, callback)', () => {
			expect(existsSync(resolve(root, 'src/app/(auth)/layout.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/(auth)/login/page.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/(auth)/signup/page.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/(auth)/callback/page.tsx'))).toBe(true);
		});

		it('has dashboard routes (index, templates, settings)', () => {
			expect(existsSync(resolve(root, 'src/app/dashboard/layout.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/dashboard/page.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/dashboard/templates/page.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/dashboard/settings/page.tsx'))).toBe(true);
		});

		it('has editor route with layout', () => {
			expect(existsSync(resolve(root, 'src/app/editor/[projectId]/page.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/editor/[projectId]/layout.tsx'))).toBe(true);
		});

		it('has embed route with layout', () => {
			expect(existsSync(resolve(root, 'src/app/embed/[projectId]/page.tsx'))).toBe(true);
			expect(existsSync(resolve(root, 'src/app/embed/[projectId]/layout.tsx'))).toBe(true);
		});

		it('has 404 page', () => {
			expect(existsSync(resolve(root, 'src/app/not-found.tsx'))).toBe(true);
		});
	});

	describe('metadata exports', () => {
		it('root layout has metadata', async () => {
			const mod = await import('../../src/app/layout');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toContain('AlgoMotion');
			expect(mod.metadata.description).toBeTruthy();
		});

		it('login page has metadata', async () => {
			const mod = await import('../../src/app/(auth)/login/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('signup page has metadata', async () => {
			const mod = await import('../../src/app/(auth)/signup/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('callback page has metadata', async () => {
			const mod = await import('../../src/app/(auth)/callback/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('dashboard page has metadata', async () => {
			const mod = await import('../../src/app/dashboard/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('templates page has metadata', async () => {
			const mod = await import('../../src/app/dashboard/templates/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('settings page has metadata', async () => {
			const mod = await import('../../src/app/dashboard/settings/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('editor page has metadata', async () => {
			const mod = await import('../../src/app/editor/[projectId]/page');
			expect(mod.metadata).toBeDefined();
			expect(mod.metadata.title).toBeTruthy();
		});

		it('embed page has generateMetadata', async () => {
			const mod = await import('../../src/app/embed/[projectId]/page');
			expect(mod.generateMetadata).toBeDefined();
			expect(typeof mod.generateMetadata).toBe('function');
		});
	});
});
