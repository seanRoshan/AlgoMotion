/**
 * Tests for announcer store.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { announce, useAnnouncerStore } from './announcer-store';

describe('announcerStore', () => {
	beforeEach(() => {
		useAnnouncerStore.getState().clear();
	});

	it('starts with empty message', () => {
		const state = useAnnouncerStore.getState();
		expect(state.message).toBe('');
		expect(state.priority).toBe('polite');
		expect(state.version).toBe(0);
	});

	it('announces a polite message', () => {
		useAnnouncerStore.getState().announce('Step 1 of 5');
		const state = useAnnouncerStore.getState();
		expect(state.message).toBe('Step 1 of 5');
		expect(state.priority).toBe('polite');
		expect(state.version).toBe(1);
	});

	it('announces an assertive message', () => {
		useAnnouncerStore.getState().announce('Error occurred', 'assertive');
		const state = useAnnouncerStore.getState();
		expect(state.message).toBe('Error occurred');
		expect(state.priority).toBe('assertive');
	});

	it('increments version on each announcement', () => {
		const store = useAnnouncerStore.getState();
		store.announce('First');
		store.announce('Second');
		expect(useAnnouncerStore.getState().version).toBe(2);
	});

	it('clears message and resets version', () => {
		useAnnouncerStore.getState().announce('Hello');
		useAnnouncerStore.getState().clear();
		const state = useAnnouncerStore.getState();
		expect(state.message).toBe('');
		expect(state.version).toBe(0);
	});

	it('exports convenience announce function', () => {
		announce('Convenience message', 'assertive');
		const state = useAnnouncerStore.getState();
		expect(state.message).toBe('Convenience message');
		expect(state.priority).toBe('assertive');
	});

	it('defaults to polite priority', () => {
		announce('Default priority');
		expect(useAnnouncerStore.getState().priority).toBe('polite');
	});
});
