/**
 * Invisible ARIA live region for screen reader announcements.
 *
 * Provides polite and assertive announcement channels.
 * Must remain mounted in the DOM at all times — content
 * is changed dynamically, never conditionally rendered.
 *
 * Spec reference: Section 11 (Accessibility Requirements)
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAnnouncerStore } from '@/lib/stores/announcer-store';

export function ScreenReaderAnnouncer() {
	const politeRef = useRef<HTMLOutputElement>(null);
	const assertiveRef = useRef<HTMLDivElement>(null);
	const message = useAnnouncerStore((s) => s.message);
	const priority = useAnnouncerStore((s) => s.priority);
	const version = useAnnouncerStore((s) => s.version);

	// biome-ignore lint/correctness/useExhaustiveDependencies: version forces re-announcement of identical messages
	useEffect(() => {
		if (!message) return;

		const target = priority === 'assertive' ? assertiveRef.current : politeRef.current;
		if (target) {
			// Clear then set to ensure screen readers detect the change
			target.textContent = '';
			requestAnimationFrame(() => {
				target.textContent = message;
			});
		}
	}, [message, priority, version]);

	return (
		<>
			<output ref={politeRef} aria-live="polite" aria-atomic="true" className="sr-only" />
			<div
				ref={assertiveRef}
				role="alert"
				aria-live="assertive"
				aria-atomic="true"
				className="sr-only"
			/>
		</>
	);
}
