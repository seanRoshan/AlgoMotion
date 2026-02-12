/**
 * Tests for usePlaybackAnnouncer hook.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAnnounce = vi.fn();

vi.mock('@/lib/stores/announcer-store', () => ({
	announce: (...args: unknown[]) => mockAnnounce(...args),
}));

let mockStatus = 'idle';

vi.mock('@/lib/stores/timeline-store', () => ({
	useTimelineStore: vi.fn((selector: (s: unknown) => unknown) => {
		const state = {
			playback: { status: mockStatus },
		};
		return selector(state);
	}),
}));

// Must import after mocks
const { usePlaybackAnnouncer } = await import('./use-playback-announcer');

describe('usePlaybackAnnouncer', () => {
	beforeEach(() => {
		mockStatus = 'idle';
		mockAnnounce.mockClear();
	});

	it('does not announce on initial idle state', () => {
		renderHook(() => usePlaybackAnnouncer());
		expect(mockAnnounce).not.toHaveBeenCalled();
	});

	it('announces when status changes to playing', () => {
		mockStatus = 'idle';
		const { rerender } = renderHook(() => usePlaybackAnnouncer());

		mockStatus = 'playing';
		rerender();

		expect(mockAnnounce).toHaveBeenCalledWith('Animation playing');
	});

	it('announces when status changes to paused', () => {
		mockStatus = 'playing';
		const { rerender } = renderHook(() => usePlaybackAnnouncer());

		mockStatus = 'paused';
		rerender();

		expect(mockAnnounce).toHaveBeenCalledWith('Animation paused');
	});

	it('announces when status changes to stopped', () => {
		mockStatus = 'playing';
		const { rerender } = renderHook(() => usePlaybackAnnouncer());

		mockStatus = 'stopped';
		rerender();

		expect(mockAnnounce).toHaveBeenCalledWith('Animation stopped');
	});
});
