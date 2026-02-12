import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { SceneElement } from '@/types';
import { PropertiesInspector } from './properties-inspector';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

const mockUpdateElement = vi.fn();
const mockMoveElement = vi.fn();
const mockResizeElement = vi.fn();
const mockRotateElement = vi.fn();

let mockSelectedIds: string[] = [];
let mockElements: Record<string, SceneElement> = {};

vi.mock('@/lib/stores/scene-store', () => ({
	useSceneStore: vi.fn((selector) =>
		selector({
			selectedIds: mockSelectedIds,
			elements: mockElements,
			elementIds: Object.keys(mockElements),
			connections: {},
			connectionIds: [],
			clipboard: [],
			clipboardConnections: [],
			camera: { x: 0, y: 0, zoom: 1 },
			updateElement: mockUpdateElement,
			moveElement: mockMoveElement,
			resizeElement: mockResizeElement,
			rotateElement: mockRotateElement,
		}),
	),
}));

vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

function makeElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'el-1',
		type: 'rect',
		position: { x: 100, y: 200 },
		size: { width: 120, height: 80 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label: 'Test Label',
		style: {
			fill: '#2a2a4a',
			stroke: '#6366f1',
			strokeWidth: 2,
			cornerRadius: 8,
			fontSize: 14,
			fontFamily: 'Inter, system-ui, sans-serif',
			fontWeight: 500,
			textColor: '#e0e0f0',
		},
		metadata: {},
		...overrides,
	};
}

describe('PropertiesInspector', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSelectedIds = [];
		mockElements = {};
	});

	it('shows empty state when no element is selected', () => {
		mockSelectedIds = [];
		render(<PropertiesInspector />, { wrapper: Wrapper });
		expect(screen.getByText(/select an element/i)).toBeDefined();
	});

	it('shows multi-select message when multiple elements are selected', () => {
		mockSelectedIds = ['el-1', 'el-2'];
		mockElements = {
			'el-1': makeElement({ id: 'el-1' }),
			'el-2': makeElement({ id: 'el-2' }),
		};
		render(<PropertiesInspector />, { wrapper: Wrapper });
		expect(screen.getByText(/2 elements selected/i)).toBeDefined();
	});

	it('displays transform section with position values', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		// Should show X and Y position labels
		expect(screen.getByLabelText('X')).toBeDefined();
		expect(screen.getByLabelText('Y')).toBeDefined();
	});

	it('displays size values', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByLabelText('W')).toBeDefined();
		expect(screen.getByLabelText('H')).toBeDefined();
	});

	it('displays opacity slider', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByText('Opacity')).toBeDefined();
	});

	it('displays style section with fill color', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByText('Fill')).toBeDefined();
	});

	it('displays element type label', () => {
		const el = makeElement({ type: 'rect' });
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByText('rect')).toBeDefined();
	});

	it('displays rotation input', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByLabelText('Rotation')).toBeDefined();
	});

	it('displays stroke section', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByText('Stroke')).toBeDefined();
	});

	it('displays corner radius', () => {
		const el = makeElement();
		mockSelectedIds = ['el-1'];
		mockElements = { 'el-1': el };
		render(<PropertiesInspector />, { wrapper: Wrapper });

		expect(screen.getByText('Radius')).toBeDefined();
	});
});
