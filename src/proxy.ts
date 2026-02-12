/**
 * Next.js root proxy — delegates to Supabase session refresh.
 *
 * Runs on every matching request to keep auth sessions alive
 * and protect routes that require authentication.
 *
 * Spec reference: Section 4 (Auth), Section 13 (Infrastructure)
 */

import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
	return updateSession(request);
}

export const config = {
	matcher: [
		/*
		 * Match all routes except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata)
		 * - Public assets in /images, /fonts, etc.
		 */
		'/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|fonts/).*)',
	],
};
