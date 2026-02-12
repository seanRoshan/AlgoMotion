/**
 * Layout for embed pages.
 *
 * Minimal chrome, full-screen player. Allows iframe embedding
 * by not setting restrictive X-Frame-Options.
 *
 * Spec reference: Section 5.1 (embed/[projectId])
 */

import type { ReactNode } from 'react';

export default function EmbedLayout({ children }: { children: ReactNode }) {
	return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
