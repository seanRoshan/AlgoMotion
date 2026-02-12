/**
 * Tests for SkipToContent component.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkipToContent } from './skip-to-content';

describe('SkipToContent', () => {
	it('renders a skip link', () => {
		render(<SkipToContent />);
		const link = screen.getByText('Skip to main content');
		expect(link).toBeDefined();
	});

	it('links to #main-content', () => {
		render(<SkipToContent />);
		const link = screen.getByText('Skip to main content');
		expect(link.getAttribute('href')).toBe('#main-content');
	});

	it('is an anchor element', () => {
		render(<SkipToContent />);
		const link = screen.getByText('Skip to main content');
		expect(link.tagName).toBe('A');
	});
});
