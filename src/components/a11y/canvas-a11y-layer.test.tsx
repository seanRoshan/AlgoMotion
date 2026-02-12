/**
 * Tests for CanvasA11yLayer component.
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasA11yLayer } from './canvas-a11y-layer';

vi.mock('@/lib/stores/scene-store', () => ({
	useSceneStore: vi.fn((selector: (s: unknown) => unknown) => {
		const state = {
			elements: {
				el1: {
					id: 'el1',
					type: 'rect',
					position: { x: 100, y: 200 },
					label: 'Node A',
				},
				el2: {
					id: 'el2',
					type: 'ellipse',
					position: { x: 300, y: 400 },
				},
			},
			elementIds: ['el1', 'el2'],
			selectedIds: ['el1'],
		};
		return selector(state);
	}),
}));

vi.mock('@/lib/stores/timeline-store', () => ({
	useTimelineStore: vi.fn((selector: (s: unknown) => unknown) => {
		const state = {
			playback: { status: 'stopped', currentTime: 0 },
		};
		return selector(state);
	}),
}));

describe('CanvasA11yLayer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders a region for canvas description', () => {
		render(<CanvasA11yLayer />);
		const region = screen.getByRole('region', { name: 'Canvas scene description' });
		expect(region).toBeDefined();
	});

	it('shows element count', () => {
		render(<CanvasA11yLayer />);
		expect(screen.getByText(/2 elements on canvas/)).toBeDefined();
	});

	it('shows selected count', () => {
		render(<CanvasA11yLayer />);
		expect(screen.getByText(/1 selected/)).toBeDefined();
	});

	it('lists scene elements with positions', () => {
		render(<CanvasA11yLayer />);
		expect(screen.getByText(/rect at \(100, 200\): Node A \(selected\)/)).toBeDefined();
	});

	it('renders elements without labels', () => {
		render(<CanvasA11yLayer />);
		expect(screen.getByText(/ellipse at \(300, 400\)/)).toBeDefined();
	});

	it('has sr-only class for visual hiding', () => {
		render(<CanvasA11yLayer />);
		const region = screen.getByRole('region', { name: 'Canvas scene description' });
		expect(region.className).toContain('sr-only');
	});

	it('has aria-live polite', () => {
		render(<CanvasA11yLayer />);
		const region = screen.getByRole('region', { name: 'Canvas scene description' });
		expect(region.getAttribute('aria-live')).toBe('polite');
	});
});
