/**
 * Signup form — email/password + OAuth registration.
 *
 * Client Component that provides account creation.
 * Renders in the centered auth layout.
 *
 * Spec reference: Section 4 (Auth)
 */

'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

export function SignupForm() {
	const { signUp } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSignup(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		const result = await signUp(email, password);
		if (result.error) {
			setError(result.error.message);
		} else {
			setMessage('Check your email to confirm your account!');
		}
		setLoading(false);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<div className="flex justify-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
						<span className="text-xl font-bold text-primary-foreground">A</span>
					</div>
				</div>
				<h1 className="text-2xl font-semibold">Create your account</h1>
				<p className="text-sm text-muted-foreground">Get started with AlgoMotion</p>
			</div>

			<OAuthButtons />

			<div className="relative">
				<Separator />
				<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
					or sign up with email
				</span>
			</div>

			<form onSubmit={handleSignup} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						placeholder="Create a password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={6}
					/>
					<p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}
				{message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? 'Creating account...' : 'Create account'}
				</Button>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Already have an account?{' '}
				<Link href="/login" className="text-primary hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
