/**
 * Hook for tracking online/offline connectivity status.
 *
 * Listens to browser online/offline events and provides
 * a reactive boolean. Used by sync indicator and service
 * worker registration.
 *
 * Spec reference: Section 17 (Offline Support)
 */

'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
	const [isOnline, setIsOnline] = useState(() => {
		if (typeof window === 'undefined') return true;
		return navigator.onLine;
	});

	useEffect(() => {
		function handleOnline() {
			setIsOnline(true);
		}

		function handleOffline() {
			setIsOnline(false);
		}

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	return isOnline;
}
