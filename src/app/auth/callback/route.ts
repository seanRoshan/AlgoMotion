/**
 * Auth callback route handler — exchanges OAuth code for session.
 *
 * Supabase redirects here after OAuth or magic link auth.
 * The code is exchanged server-side for a session, then the
 * user is redirected to their intended destination.
 *
 * Spec reference: Section 4 (Auth)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const { searchParams, origin } = request.nextUrl;
	const code = searchParams.get('code');
	const next = searchParams.get('next') ?? '/dashboard';

	if (code) {
		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					},
				},
			},
		);

		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// If no code or exchange failed, redirect to login with error
	return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
