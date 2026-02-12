/**
 * OAuth sign-in buttons — Google and GitHub providers.
 *
 * Reusable across login and signup pages.
 * Uses the useAuth hook for Supabase OAuth flow.
 *
 * Spec reference: Section 4 (Auth)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function OAuthButtons() {
	const { signInWithOAuth } = useAuth();
	const [loading, setLoading] = useState<string | null>(null);

	async function handleOAuth(provider: 'google' | 'github') {
		setLoading(provider);
		await signInWithOAuth(provider);
		setLoading(null);
	}

	return (
		<div className="grid grid-cols-2 gap-3">
			<Button variant="outline" onClick={() => handleOAuth('github')} disabled={loading !== null}>
				{loading === 'github' ? 'Connecting...' : 'GitHub'}
			</Button>
			<Button variant="outline" onClick={() => handleOAuth('google')} disabled={loading !== null}>
				{loading === 'google' ? 'Connecting...' : 'Google'}
			</Button>
		</div>
	);
}
