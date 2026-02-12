/**
 * Hook for detecting the user's reduced motion preference.
 *
 * Listens to `prefers-reduced-motion` media query and
 * provides a reactive boolean. Used by GSAP animation
 * engine and CSS transitions to respect user preferences.
 *
 * Spec reference: Section 11 (Accessibility Requirements)
 */

'use client';

import { useEffect, useState } from 'react';

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia(MEDIA_QUERY).matches;
	});

	useEffect(() => {
		const mql = window.matchMedia(MEDIA_QUERY);

		function handleChange(e: MediaQueryListEvent) {
			setPrefersReducedMotion(e.matches);
		}

		mql.addEventListener('change', handleChange);
		return () => mql.removeEventListener('change', handleChange);
	}, []);

	return prefersReducedMotion;
}
