/**
 * Supabase server client for Server Components, Route Handlers, and Server Actions.
 *
 * Uses `createServerClient` from @supabase/ssr with Next.js
 * cookie management for secure session handling.
 *
 * Spec reference: Section 4 (Auth)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						try {
							cookieStore.set(name, value, options);
						} catch {
							// Server Component context — cookies are read-only.
							// Middleware handles refresh instead.
						}
					}
				},
			},
		},
	);
}
