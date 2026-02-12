import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Authenticating — AlgoMotion',
	description: 'Completing authentication...',
};

/**
 * Fallback callback page — shown briefly during OAuth redirect.
 *
 * The actual OAuth code exchange happens in the Route Handler at
 * /auth/callback/route.ts. This page at /callback is shown only
 * if a user navigates directly to /callback.
 */
export default function CallbackPage() {
	return (
		<div className="space-y-4 text-center">
			<div className="flex justify-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
					<span className="text-xl font-bold text-primary-foreground">A</span>
				</div>
			</div>
			<h1 className="text-2xl font-semibold">Signing you in...</h1>
			<p className="text-sm text-muted-foreground">Completing authentication</p>
		</div>
	);
}
