/**
 * Tests for SpotlightOverlay component.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpotlightOverlay } from './spotlight-overlay';

describe('SpotlightOverlay', () => {
	afterEach(cleanup);

	const defaultProps = {
		title: 'Add an Element',
		description: 'Click the toolbar to add.',
		currentStep: 0,
		totalSteps: 5,
		placement: 'right' as const,
		onNext: vi.fn(),
		onPrev: vi.fn(),
		onSkip: vi.fn(),
	};

	it('renders title', () => {
		render(<SpotlightOverlay {...defaultProps} />);
		expect(screen.getByText('Add an Element')).toBeDefined();
	});

	it('renders description', () => {
		render(<SpotlightOverlay {...defaultProps} />);
		expect(screen.getByText('Click the toolbar to add.')).toBeDefined();
	});

	it('renders step indicator', () => {
		render(<SpotlightOverlay {...defaultProps} currentStep={2} />);
		expect(screen.getByText('3 of 5')).toBeDefined();
	});

	it('renders Next button', () => {
		render(<SpotlightOverlay {...defaultProps} />);
		expect(screen.getByRole('button', { name: /next/i })).toBeDefined();
	});

	it('renders Skip button', () => {
		render(<SpotlightOverlay {...defaultProps} />);
		expect(screen.getByRole('button', { name: /skip/i })).toBeDefined();
	});

	it('calls onNext when Next is clicked', async () => {
		const onNext = vi.fn();
		render(<SpotlightOverlay {...defaultProps} onNext={onNext} />);
		await userEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(onNext).toHaveBeenCalledTimes(1);
	});

	it('calls onSkip when Skip is clicked', async () => {
		const onSkip = vi.fn();
		render(<SpotlightOverlay {...defaultProps} onSkip={onSkip} />);
		await userEvent.click(screen.getByRole('button', { name: /skip/i }));
		expect(onSkip).toHaveBeenCalledTimes(1);
	});

	it('calls onPrev when Back is clicked', async () => {
		const onPrev = vi.fn();
		render(<SpotlightOverlay {...defaultProps} currentStep={2} onPrev={onPrev} />);
		await userEvent.click(screen.getByRole('button', { name: /back/i }));
		expect(onPrev).toHaveBeenCalledTimes(1);
	});

	it('hides Back button on first step', () => {
		render(<SpotlightOverlay {...defaultProps} currentStep={0} />);
		expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
	});

	it('shows Finish instead of Next on last step', () => {
		render(<SpotlightOverlay {...defaultProps} currentStep={4} totalSteps={5} />);
		expect(screen.getByRole('button', { name: /finish/i })).toBeDefined();
	});

	it('renders step dots', () => {
		render(<SpotlightOverlay {...defaultProps} />);
		const dots = screen.getAllByTestId('step-dot');
		expect(dots).toHaveLength(5);
	});
});
