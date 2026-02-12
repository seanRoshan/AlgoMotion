import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ELEMENT_CATALOG } from '@/lib/element-library/element-catalog';
import { useSceneStore } from '@/lib/stores/scene-store';
import { ElementLibrary } from './element-library';

// Mock next-themes
vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

// Mock pixi.js for SceneManager dependency chain
vi.mock('pixi.js', () => ({}));

describe('ElementLibrary', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useSceneStore.getState().reset();
	});

	afterEach(() => {
		useSceneStore.getState().reset();
	});

	it('renders all category headings', () => {
		render(<ElementLibrary />);
		for (const category of ELEMENT_CATALOG) {
			expect(screen.getByText(category.label)).toBeDefined();
		}
	});

	it('renders search input', () => {
		render(<ElementLibrary />);
		expect(screen.getByPlaceholderText(/search elements/i)).toBeDefined();
	});

	it('shows enabled categories expanded by default', () => {
		render(<ElementLibrary />);
		const enabledCategories = ELEMENT_CATALOG.filter((c) => c.enabled);
		for (const category of enabledCategories) {
			// Items from enabled categories should be visible
			for (const item of category.items) {
				expect(screen.getByText(item.label)).toBeDefined();
			}
		}
	});

	it('shows disabled reason badge on disabled categories', () => {
		render(<ElementLibrary />);
		const disabledReasons = [
			...new Set(
				ELEMENT_CATALOG.filter((c) => !c.enabled && c.disabledReason).map((c) => c.disabledReason!),
			),
		];
		for (const reason of disabledReasons) {
			expect(screen.getAllByText(reason).length).toBeGreaterThan(0);
		}
	});

	it('does not show items from disabled categories', () => {
		render(<ElementLibrary />);
		const disabledCategories = ELEMENT_CATALOG.filter((c) => !c.enabled);
		for (const category of disabledCategories) {
			for (const item of category.items) {
				expect(screen.queryByText(item.label)).toBeNull();
			}
		}
	});

	it('filters elements by search query', async () => {
		const user = userEvent.setup();
		render(<ElementLibrary />);

		const input = screen.getByPlaceholderText(/search elements/i);
		await user.type(input, 'arrow');

		// Arrow should be visible
		expect(screen.getByText('Arrow')).toBeDefined();
		// Node should not be visible
		expect(screen.queryByText('Node')).toBeNull();
	});

	it('shows "No elements found" when search has no results', async () => {
		const user = userEvent.setup();
		render(<ElementLibrary />);

		const input = screen.getByPlaceholderText(/search elements/i);
		await user.type(input, 'xyznonexistent');

		expect(screen.getByText(/no elements found/i)).toBeDefined();
	});

	it('does not search disabled categories', async () => {
		const user = userEvent.setup();
		render(<ElementLibrary />);

		const input = screen.getByPlaceholderText(/search elements/i);
		// "Array Cell" is in disabled Data Structures category
		await user.type(input, 'array');

		expect(screen.queryByText('Array Cell')).toBeNull();
	});

	it('makes enabled element items draggable', () => {
		render(<ElementLibrary />);
		const nodeElement = screen.getByText('Node').closest('[draggable]');
		expect(nodeElement).toBeDefined();
		expect(nodeElement?.getAttribute('draggable')).toBe('true');
	});

	it('sets element type in dataTransfer on drag start', () => {
		render(<ElementLibrary />);
		const nodeElement = screen.getByText('Node').closest('[draggable]');
		expect(nodeElement).toBeDefined();

		const setDataMock = vi.fn();
		fireEvent.dragStart(nodeElement!, {
			dataTransfer: {
				setData: setDataMock,
				effectAllowed: '',
			},
		});

		expect(setDataMock).toHaveBeenCalledWith('application/algomotion-element', 'node');
	});

	it('shows element count per enabled category', () => {
		render(<ElementLibrary />);
		const primitives = ELEMENT_CATALOG.find((c) => c.id === 'primitives')!;
		expect(screen.getByText(String(primitives.items.length))).toBeDefined();
	});

	it('clicking same element type twice places at different positions', async () => {
		const user = userEvent.setup();
		render(<ElementLibrary />);

		const nodeBtn = screen.getByText('Node').closest('[role="button"]')!;
		await user.click(nodeBtn);
		await user.click(nodeBtn);

		const { elements, elementIds } = useSceneStore.getState();
		expect(elementIds).toHaveLength(2);

		const first = elements[elementIds[0]!]!;
		const second = elements[elementIds[1]!]!;
		// Positions should differ due to cascading offset
		expect(first.position.x).not.toBe(second.position.x);
		expect(first.position.y).not.toBe(second.position.y);
	});
});
