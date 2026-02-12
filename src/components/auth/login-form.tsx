/**
 * Login form — email/password + magic link + OAuth.
 *
 * Client Component that provides all authentication methods
 * supported by the app. Renders in the centered auth layout.
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

export function LoginForm() {
	const { signInWithPassword, signInWithMagicLink } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handlePasswordLogin(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		const result = await signInWithPassword(email, password);
		if (result.error) {
			setError(result.error.message);
		}
		setLoading(false);
	}

	async function handleMagicLink() {
		if (!email) {
			setError('Please enter your email address');
			return;
		}
		setError(null);
		setMessage(null);
		setLoading(true);

		const result = await signInWithMagicLink(email);
		if (result.error) {
			setError(result.error.message);
		} else {
			setMessage('Check your email for the magic link!');
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
				<h1 className="text-2xl font-semibold">Sign in to AlgoMotion</h1>
				<p className="text-sm text-muted-foreground">Choose your preferred sign-in method</p>
			</div>

			<OAuthButtons />

			<div className="relative">
				<Separator />
				<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
					or continue with email
				</span>
			</div>

			<form onSubmit={handlePasswordLogin} className="space-y-4">
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
						placeholder="Your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}
				{message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

				<div className="space-y-2">
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Signing in...' : 'Sign in'}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						onClick={handleMagicLink}
						disabled={loading}
					>
						Send magic link instead
					</Button>
				</div>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Don&apos;t have an account?{' '}
				<Link href="/signup" className="text-primary hover:underline">
					Sign up
				</Link>
			</p>
		</div>
	);
}
