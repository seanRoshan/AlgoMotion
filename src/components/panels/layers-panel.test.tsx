import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from '@/lib/element-library/create-element';
import { useSceneStore } from '@/lib/stores/scene-store';
import { LayersPanel } from './layers-panel';

// Mock pixi.js for SceneManager dependency chain
vi.mock('pixi.js', () => ({}));

describe('LayersPanel', () => {
	beforeEach(() => {
		useSceneStore.getState().reset();
	});

	afterEach(() => {
		cleanup();
	});

	it('shows empty message when no elements exist', () => {
		render(<LayersPanel />);
		expect(screen.getByText(/No layers/)).toBeDefined();
	});

	it('lists elements when they exist on canvas', () => {
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);

		render(<LayersPanel />);
		// createElement('rect') sets label: 'Rectangle'
		expect(screen.getByText('Rectangle')).toBeDefined();
	});

	it('shows custom label when element has one', () => {
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);
		useSceneStore.getState().updateElement(rect.id, { label: 'My Rectangle' });

		render(<LayersPanel />);
		expect(screen.getByText('My Rectangle')).toBeDefined();
	});

	it('lists multiple elements in reverse order (top layer first)', () => {
		const rect = createElement('rect', 0, 0);
		const ellipse = createElement('ellipse', 100, 100);
		useSceneStore.getState().addElement(rect);
		useSceneStore.getState().addElement(ellipse);

		render(<LayersPanel />);
		const options = screen.getAllByRole('option');
		expect(options).toHaveLength(2);
		// Ellipse added last = top layer = first in list
		expect(options[0]?.textContent).toContain('Ellipse');
		expect(options[1]?.textContent).toContain('Rect');
	});

	it('highlights selected element', () => {
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);
		useSceneStore.getState().selectElement(rect.id);

		render(<LayersPanel />);
		const option = screen.getByRole('option');
		expect(option.getAttribute('aria-selected')).toBe('true');
	});

	it('clicking a layer selects the element', async () => {
		const user = userEvent.setup();
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);

		render(<LayersPanel />);
		await user.click(screen.getByRole('option'));
		expect(useSceneStore.getState().selectedIds).toContain(rect.id);
	});

	it('renders visibility toggle button', () => {
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);

		render(<LayersPanel />);
		expect(screen.getByLabelText('Hide layer')).toBeDefined();
	});

	it('renders lock toggle button', () => {
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);

		render(<LayersPanel />);
		expect(screen.getByLabelText('Lock layer')).toBeDefined();
	});

	it('toggling visibility updates element visible state', async () => {
		const user = userEvent.setup();
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);

		render(<LayersPanel />);
		await user.click(screen.getByLabelText('Hide layer'));
		expect(useSceneStore.getState().elements[rect.id]?.visible).toBe(false);
	});

	it('toggling lock updates element locked state', async () => {
		const user = userEvent.setup();
		const rect = createElement('rect', 0, 0);
		useSceneStore.getState().addElement(rect);

		render(<LayersPanel />);
		await user.click(screen.getByLabelText('Lock layer'));
		expect(useSceneStore.getState().elements[rect.id]?.locked).toBe(true);
	});

	it('formats camelCase element types when no label exists', () => {
		const cell = createElement('arrayCell', 0, 0);
		// Clear the label so formatElementType is used
		useSceneStore.getState().addElement(cell);
		useSceneStore.getState().updateElement(cell.id, { label: '' });

		render(<LayersPanel />);
		expect(screen.getByText('Array Cell')).toBeDefined();
	});
});
