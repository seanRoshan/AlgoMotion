/**
 * Client-side auth hook — provides user state and auth methods.
 *
 * Listens to Supabase auth state changes and provides
 * sign-in, sign-up, and sign-out functions for Client Components.
 *
 * Spec reference: Section 4 (Auth)
 */

'use client';

import type { Provider, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AuthState {
	user: User | null;
	loading: boolean;
	signInWithOAuth: (provider: Provider) => Promise<void>;
	signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
	signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
	signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
	signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const signInWithOAuth = useCallback(async (provider: Provider) => {
		const supabase = createClient();
		await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
	}, []);

	const signInWithMagicLink = useCallback(async (email: string) => {
		const supabase = createClient();
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`,
			},
		});
		return { error: error ? new Error(error.message) : null };
	}, []);

	const signInWithPassword = useCallback(async (email: string, password: string) => {
		const supabase = createClient();
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		return { error: error ? new Error(error.message) : null };
	}, []);

	const signUp = useCallback(async (email: string, password: string) => {
		const supabase = createClient();
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`,
			},
		});
		return { error: error ? new Error(error.message) : null };
	}, []);

	const signOut = useCallback(async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
	}, []);

	return {
		user,
		loading,
		signInWithOAuth,
		signInWithMagicLink,
		signInWithPassword,
		signUp,
		signOut,
	};
}
