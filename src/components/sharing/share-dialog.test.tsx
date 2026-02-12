/**
 * Tests for ShareDialog component.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShareDialog } from './share-dialog';

// Mock navigator.clipboard
Object.assign(navigator, {
	clipboard: {
		writeText: vi.fn(async () => {}),
	},
});

describe('ShareDialog', () => {
	afterEach(cleanup);

	const defaultProps = {
		projectId: 'proj-1',
		projectName: 'Bubble Sort',
		isPublic: false,
		onTogglePublic: vi.fn(),
		open: true,
		onOpenChange: vi.fn(),
	};

	it('renders dialog title', () => {
		render(<ShareDialog {...defaultProps} />);
		expect(screen.getByText('Share Project')).toBeDefined();
	});

	it('shows project name', () => {
		render(<ShareDialog {...defaultProps} />);
		expect(screen.getByText(/Bubble Sort/)).toBeDefined();
	});

	it('renders public toggle', () => {
		render(<ShareDialog {...defaultProps} />);
		expect(screen.getByRole('switch')).toBeDefined();
	});

	it('toggle is off when project is private', () => {
		render(<ShareDialog {...defaultProps} isPublic={false} />);
		const toggle = screen.getByRole('switch');
		expect(toggle.getAttribute('aria-checked')).toBe('false');
	});

	it('toggle is on when project is public', () => {
		render(<ShareDialog {...defaultProps} isPublic={true} />);
		const toggle = screen.getByRole('switch');
		expect(toggle.getAttribute('aria-checked')).toBe('true');
	});

	it('calls onTogglePublic when toggle is clicked', async () => {
		const onToggle = vi.fn();
		render(<ShareDialog {...defaultProps} onTogglePublic={onToggle} />);
		const toggle = screen.getByRole('switch');
		await userEvent.click(toggle);
		expect(onToggle).toHaveBeenCalled();
	});

	it('shows share link when public', () => {
		render(<ShareDialog {...defaultProps} isPublic={true} />);
		expect(screen.getByDisplayValue(/\/embed\/proj-1/)).toBeDefined();
	});

	it('hides share link when private', () => {
		render(<ShareDialog {...defaultProps} isPublic={false} />);
		expect(screen.queryByDisplayValue(/\/embed\/proj-1/)).toBeNull();
	});

	it('renders copy button when public', () => {
		render(<ShareDialog {...defaultProps} isPublic={true} />);
		expect(screen.getByRole('button', { name: /copy/i })).toBeDefined();
	});

	it('copies link to clipboard on click', async () => {
		render(<ShareDialog {...defaultProps} isPublic={true} />);
		const copyBtn = screen.getByRole('button', { name: /copy/i });
		await userEvent.click(copyBtn);
		expect(navigator.clipboard.writeText).toHaveBeenCalled();
	});

	it('does not render when closed', () => {
		render(<ShareDialog {...defaultProps} open={false} />);
		expect(screen.queryByText('Share Project')).toBeNull();
	});
});
