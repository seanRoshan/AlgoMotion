/**
 * Tests for signup form component.
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

describe('SignupForm', () => {
	it('exports SignupForm component', async () => {
		const mod = await import('./signup-form');
		expect(mod.SignupForm).toBeDefined();
	});

	it('renders without crashing', async () => {
		const { SignupForm } = await import('./signup-form');
		const { container } = render(<SignupForm />);
		expect(container.querySelector('form')).not.toBeNull();
	});

	it('renders email input', async () => {
		const { SignupForm } = await import('./signup-form');
		render(<SignupForm />);
		expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
	});

	it('renders password input', async () => {
		const { SignupForm } = await import('./signup-form');
		render(<SignupForm />);
		expect(screen.getByPlaceholderText('Create a password')).toBeDefined();
	});

	it('renders create account button', async () => {
		const { SignupForm } = await import('./signup-form');
		render(<SignupForm />);
		expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();
	});

	it('renders link to login page', async () => {
		const { SignupForm } = await import('./signup-form');
		render(<SignupForm />);
		expect(screen.getByRole('link', { name: 'Sign in' })).toBeDefined();
	});
});
