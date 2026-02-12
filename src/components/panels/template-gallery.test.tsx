import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TemplateGallery } from './template-gallery';

function Wrapper({ children }: { children: React.ReactNode }) {
	return <TooltipProvider>{children}</TooltipProvider>;
}

const mockAddElement = vi.fn();
const mockDeselectAll = vi.fn();
const mockReset = vi.fn();

vi.mock('@/lib/stores/scene-store', () => ({
	useSceneStore: vi.fn((selector) =>
		selector({
			selectedIds: [],
			elements: {},
			elementIds: [],
			connections: {},
			connectionIds: [],
			clipboard: [],
			clipboardConnections: [],
			camera: { x: 0, y: 0, zoom: 1 },
			addElement: mockAddElement,
			deselectAll: mockDeselectAll,
			reset: mockReset,
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

describe('TemplateGallery', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders template gallery with templates', () => {
		render(<TemplateGallery />, { wrapper: Wrapper });
		// Should show at least one template name
		expect(screen.getByText('Bubble Sort')).toBeDefined();
	});

	it('renders category filter tabs', () => {
		render(<TemplateGallery />, { wrapper: Wrapper });
		expect(screen.getByText('All')).toBeDefined();
		expect(screen.getByText('Sorting')).toBeDefined();
	});

	it('renders search input', () => {
		render(<TemplateGallery />, { wrapper: Wrapper });
		expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
	});

	it('filters templates by search', async () => {
		const user = userEvent.setup();
		render(<TemplateGallery />, { wrapper: Wrapper });

		await user.type(screen.getByPlaceholderText(/search/i), 'binary');
		expect(screen.getByText('Binary Search')).toBeDefined();
	});

	it('shows template difficulty badge', () => {
		render(<TemplateGallery />, { wrapper: Wrapper });
		// At least one beginner template
		expect(screen.getAllByText('beginner').length).toBeGreaterThan(0);
	});

	it('shows template descriptions', () => {
		render(<TemplateGallery />, { wrapper: Wrapper });
		// Each template card should have a description
		const descriptions = screen.getAllByRole('article');
		expect(descriptions.length).toBeGreaterThan(0);
	});
});
