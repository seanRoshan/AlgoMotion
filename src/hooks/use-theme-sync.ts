import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/stores/ui-store';

/**
 * Syncs the persisted UI store theme with next-themes.
 *
 * On mount, reads the theme from the UI store (persisted in IndexedDB)
 * and applies it to next-themes. Also subscribes to UI store changes
 * so that any setTheme() call is reflected in the DOM.
 */
export function useThemeSync(): void {
	const { setTheme: setNextTheme } = useTheme();
	const setNextThemeRef = useRef(setNextTheme);
	setNextThemeRef.current = setNextTheme;

	// On mount: sync persisted theme to next-themes
	useEffect(() => {
		const storeTheme = useUIStore.getState().theme;
		setNextThemeRef.current(storeTheme);
	}, []);

	// Subscribe to UI store theme changes and forward to next-themes
	useEffect(() => {
		const unsubscribe = useUIStore.subscribe((state, prevState) => {
			if (state.theme !== prevState.theme) {
				setNextThemeRef.current(state.theme);
			}
		});
		return unsubscribe;
	}, []);
}
