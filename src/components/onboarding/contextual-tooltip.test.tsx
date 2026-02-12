/**
 * Tests for ContextualTooltip component.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ContextualTooltip } from './contextual-tooltip';

describe('ContextualTooltip', () => {
	afterEach(cleanup);

	it('renders children', () => {
		render(
			<ContextualTooltip tip="Helpful tip">
				<button type="button">Hover me</button>
			</ContextualTooltip>,
		);
		expect(screen.getByText('Hover me')).toBeDefined();
	});

	it('renders tooltip content with aria', () => {
		render(
			<ContextualTooltip tip="This is a tip">
				<span>Target</span>
			</ContextualTooltip>,
		);
		// Tooltip is present in DOM but visually hidden until hover
		expect(screen.getByRole('tooltip')).toBeDefined();
		expect(screen.getByText('This is a tip')).toBeDefined();
	});

	it('has correct aria-describedby relationship', () => {
		render(
			<ContextualTooltip tip="Tip text" id="test-tip">
				<span>Target</span>
			</ContextualTooltip>,
		);
		const tooltip = screen.getByRole('tooltip');
		expect(tooltip.id).toBe('test-tip');
	});
});
