import { useEffect, useRef } from 'react';
import { saveProjectToIndex } from '@/lib/persistence/project-persistence';
import { useProjectStore } from '@/lib/stores/project-store';

const AUTO_SAVE_INTERVAL_MS = 5000;

/**
 * Manually save the current project to IndexedDB.
 * Used by the Ctrl+S shortcut handler.
 */
export async function saveProject(): Promise<void> {
	const { project, isDirty } = useProjectStore.getState();
	if (!project || !isDirty) return;

	await saveProjectToIndex(project);
	useProjectStore.getState().markSaved();
}

/**
 * Auto-save hook that persists the project to IndexedDB
 * when dirty, debounced to avoid excessive writes.
 *
 * Subscribes to the project store outside of React render
 * and uses a timer-based debounce.
 */
export function useAutoSave(): void {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		function scheduleSave() {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			timerRef.current = setTimeout(async () => {
				const { project, isDirty } = useProjectStore.getState();
				if (!project || !isDirty) return;

				await saveProjectToIndex(project);
				useProjectStore.getState().markSaved();
			}, AUTO_SAVE_INTERVAL_MS);
		}

		// If already dirty on mount, schedule a save
		const { project, isDirty } = useProjectStore.getState();
		if (project && isDirty) {
			scheduleSave();
		}

		const unsubscribe = useProjectStore.subscribe((state) => {
			if (!state.isDirty || !state.project) return;
			scheduleSave();
		});

		return () => {
			unsubscribe();
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);
}
