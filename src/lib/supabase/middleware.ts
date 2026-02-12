/**
 * Supabase middleware helper — refreshes session on every request.
 *
 * Called from Next.js middleware to keep the Supabase
 * session alive and redirect unauthenticated users
 * away from protected routes.
 *
 * Spec reference: Section 4 (Auth), Section 13 (Infrastructure)
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/editor', '/dashboard', '/profile'];
const AUTH_ROUTES = ['/login', '/signup'];

function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
	return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
	// Skip auth checks during E2E testing (no Supabase session available)
	if (process.env.E2E_TESTING === 'true') {
		return NextResponse.next({ request });
	}

	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({ request });
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { pathname } = request.nextUrl;

	// Redirect unauthenticated users from protected routes to login
	if (!user && isProtectedRoute(pathname)) {
		const loginUrl = request.nextUrl.clone();
		loginUrl.pathname = '/login';
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Redirect authenticated users from auth routes to dashboard
	if (user && isAuthRoute(pathname)) {
		const dashboardUrl = request.nextUrl.clone();
		dashboardUrl.pathname = '/dashboard';
		return NextResponse.redirect(dashboardUrl);
	}

	return supabaseResponse;
}
