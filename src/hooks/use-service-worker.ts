/**
 * Hook for registering the service worker.
 *
 * Registers sw.js from /public on mount, handles
 * updates, and logs registration status.
 *
 * Spec reference: Section 17 (Offline Support)
 */

'use client';

import { useEffect, useState } from 'react';

export type SWStatus = 'idle' | 'registering' | 'registered' | 'error' | 'unsupported';

export function useServiceWorker(): SWStatus {
	const [status, setStatus] = useState<SWStatus>('idle');

	useEffect(() => {
		if (!navigator.serviceWorker) {
			setStatus('unsupported');
			return;
		}

		setStatus('registering');

		navigator.serviceWorker
			.register('/sw.js')
			.then(() => {
				setStatus('registered');
			})
			.catch(() => {
				setStatus('error');
			});
	}, []);

	return status;
}
