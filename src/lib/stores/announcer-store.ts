/**
 * Store for screen reader announcements.
 *
 * Provides a centralized way to announce messages to
 * assistive technologies via ARIA live regions.
 *
 * Spec reference: Section 11 (Accessibility Requirements)
 */

import { create } from 'zustand';

export type AnnouncerPriority = 'polite' | 'assertive';

export interface AnnouncerState {
	message: string;
	priority: AnnouncerPriority;
	/** Incrementing counter to force re-announcements of identical messages */
	version: number;
}

export interface AnnouncerActions {
	announce: (message: string, priority?: AnnouncerPriority) => void;
	clear: () => void;
}

export const useAnnouncerStore = create<AnnouncerState & AnnouncerActions>((set) => ({
	message: '',
	priority: 'polite',
	version: 0,

	announce: (message, priority = 'polite') =>
		set((state) => ({
			message,
			priority,
			version: state.version + 1,
		})),

	clear: () => set({ message: '', version: 0 }),
}));

/** Convenience function for announcing from outside React components */
export function announce(message: string, priority: AnnouncerPriority = 'polite'): void {
	useAnnouncerStore.getState().announce(message, priority);
}
