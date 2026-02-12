/**
 * Supabase browser client for Client Components.
 *
 * Uses `createBrowserClient` from @supabase/ssr for
 * cookie-based session management in the browser.
 *
 * Spec reference: Section 4 (Auth)
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);
}
