/**
 * Tests for login form component.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

afterEach(cleanup);

describe('LoginForm', () => {
	it('exports LoginForm component', async () => {
		const mod = await import('./login-form');
		expect(mod.LoginForm).toBeDefined();
	});

	it('renders without crashing', async () => {
		const { LoginForm } = await import('./login-form');
		const { container } = render(<LoginForm />);
		expect(container.querySelector('form')).not.toBeNull();
	});

	it('renders email input', async () => {
		const { LoginForm } = await import('./login-form');
		render(<LoginForm />);
		expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
	});

	it('renders password input', async () => {
		const { LoginForm } = await import('./login-form');
		render(<LoginForm />);
		expect(screen.getByPlaceholderText('Your password')).toBeDefined();
	});

	it('renders sign-in submit button', async () => {
		const { LoginForm } = await import('./login-form');
		render(<LoginForm />);
		expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();
	});

	it('renders magic link button', async () => {
		const { LoginForm } = await import('./login-form');
		render(<LoginForm />);
		expect(screen.getByRole('button', { name: /magic link/i })).toBeDefined();
	});

	it('renders link to signup page', async () => {
		const { LoginForm } = await import('./login-form');
		render(<LoginForm />);
		expect(screen.getByRole('link', { name: 'Sign up' })).toBeDefined();
	});
});
