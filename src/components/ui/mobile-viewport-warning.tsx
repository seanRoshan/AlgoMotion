/**
 * Warning banner for small viewports (< 1024px).
 *
 * Displays a full-screen overlay suggesting users switch
 * to a desktop browser for the best editor experience.
 *
 * Spec reference: Section 17 (Offline Support)
 */

'use client';

import { useEffect, useState } from 'react';

const BREAKPOINT = 1024;

export function MobileViewportWarning() {
	const [isSmallViewport, setIsSmallViewport] = useState(false);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		function check() {
			setIsSmallViewport(window.innerWidth < BREAKPOINT);
		}

		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	if (!isSmallViewport || dismissed) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 p-6">
			<div className="max-w-md text-center">
				<h2 className="mb-2 text-lg font-semibold text-foreground">Desktop recommended</h2>
				<p className="mb-4 text-sm text-muted-foreground">
					AlgoMotion is designed for desktop browsers with viewports of 1024px or wider. For the
					best experience, please use a larger screen.
				</p>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					Continue anyway
				</button>
			</div>
		</div>
	);
}
