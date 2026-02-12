import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimelineScrubber } from './timeline-scrubber';

// Mock the timeline store
const mockSeek = vi.fn();

vi.mock('@/lib/stores/timeline-store', () => ({
	useTimelineStore: vi.fn((selector) =>
		selector({
			playback: { status: 'idle', speed: 1, currentTime: 3.5, loop: false },
			duration: 10,
			seek: mockSeek,
		}),
	),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
	useTheme: () => ({
		theme: 'dark',
		setTheme: vi.fn(),
		resolvedTheme: 'dark',
		systemTheme: 'dark',
	}),
}));

describe('TimelineScrubber', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the scrubber track', () => {
		render(<TimelineScrubber />);
		expect(screen.getByRole('slider')).toBeDefined();
	});

	it('displays the slider with correct value', () => {
		render(<TimelineScrubber />);
		const slider = screen.getByRole('slider');
		expect(slider.getAttribute('aria-valuenow')).toBe('3.5');
	});

	it('has correct min and max values', () => {
		render(<TimelineScrubber />);
		const slider = screen.getByRole('slider');
		expect(slider.getAttribute('aria-valuemin')).toBe('0');
		expect(slider.getAttribute('aria-valuemax')).toBe('10');
	});

	it('renders time ruler marks', () => {
		render(<TimelineScrubber />);
		// Should show time marks for a 10s timeline
		expect(screen.getByText('0s')).toBeDefined();
	});
});
