import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaybackControls } from './playback-controls';

// Mock the timeline store
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockStop = vi.fn();
const mockSetSpeed = vi.fn();
const mockToggleLoop = vi.fn();
const mockSeek = vi.fn();

vi.mock('@/lib/stores/timeline-store', () => ({
	useTimelineStore: vi.fn((selector) =>
		selector({
			playback: { status: 'idle', speed: 1, currentTime: 0, loop: false },
			duration: 10,
			play: mockPlay,
			pause: mockPause,
			stop: mockStop,
			setSpeed: mockSetSpeed,
			toggleLoop: mockToggleLoop,
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

describe('PlaybackControls', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders play button when idle', () => {
		render(<PlaybackControls />);
		expect(screen.getByLabelText('Play')).toBeDefined();
	});

	it('calls play when play button is clicked', async () => {
		const user = userEvent.setup();
		render(<PlaybackControls />);
		await user.click(screen.getByLabelText('Play'));
		expect(mockPlay).toHaveBeenCalledTimes(1);
	});

	it('renders stop button', () => {
		render(<PlaybackControls />);
		expect(screen.getByLabelText('Stop')).toBeDefined();
	});

	it('calls stop when stop button is clicked', async () => {
		const user = userEvent.setup();
		render(<PlaybackControls />);
		await user.click(screen.getByLabelText('Stop'));
		expect(mockStop).toHaveBeenCalledTimes(1);
	});

	it('renders loop toggle', () => {
		render(<PlaybackControls />);
		expect(screen.getByLabelText('Toggle loop')).toBeDefined();
	});

	it('calls toggleLoop when loop button is clicked', async () => {
		const user = userEvent.setup();
		render(<PlaybackControls />);
		await user.click(screen.getByLabelText('Toggle loop'));
		expect(mockToggleLoop).toHaveBeenCalledTimes(1);
	});

	it('renders step forward button', () => {
		render(<PlaybackControls />);
		expect(screen.getByLabelText('Step forward')).toBeDefined();
	});

	it('renders step backward button', () => {
		render(<PlaybackControls />);
		expect(screen.getByLabelText('Step backward')).toBeDefined();
	});

	it('renders speed selector showing current speed', () => {
		render(<PlaybackControls />);
		expect(screen.getByText('1x')).toBeDefined();
	});

	it('displays current time', () => {
		render(<PlaybackControls />);
		expect(screen.getByText('0:00')).toBeDefined();
	});
});
