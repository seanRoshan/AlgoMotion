/**
 * Tests for ScreenReaderAnnouncer component.
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAnnouncerStore } from '@/lib/stores/announcer-store';
import { ScreenReaderAnnouncer } from './screen-reader-announcer';

describe('ScreenReaderAnnouncer', () => {
	beforeEach(() => {
		useAnnouncerStore.getState().clear();
	});

	it('renders polite and assertive live regions', () => {
		render(<ScreenReaderAnnouncer />);
		expect(screen.getByRole('status')).toBeDefined();
		expect(screen.getByRole('alert')).toBeDefined();
	});

	it('has aria-live polite on status region', () => {
		render(<ScreenReaderAnnouncer />);
		const status = screen.getByRole('status');
		expect(status.getAttribute('aria-live')).toBe('polite');
	});

	it('has aria-live assertive on alert region', () => {
		render(<ScreenReaderAnnouncer />);
		const alert = screen.getByRole('alert');
		expect(alert.getAttribute('aria-live')).toBe('assertive');
	});

	it('has aria-atomic true on both regions', () => {
		render(<ScreenReaderAnnouncer />);
		expect(screen.getByRole('status').getAttribute('aria-atomic')).toBe('true');
		expect(screen.getByRole('alert').getAttribute('aria-atomic')).toBe('true');
	});

	it('regions are visually hidden with sr-only', () => {
		render(<ScreenReaderAnnouncer />);
		const status = screen.getByRole('status');
		expect(status.className).toContain('sr-only');
	});
});
