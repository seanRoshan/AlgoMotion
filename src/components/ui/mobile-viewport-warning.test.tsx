/**
 * Tests for MobileViewportWarning component.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileViewportWarning } from './mobile-viewport-warning';

describe('MobileViewportWarning', () => {
	const originalInnerWidth = window.innerWidth;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: originalInnerWidth,
		});
	});

	it('renders warning when viewport is below 1024px', () => {
		Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
		render(<MobileViewportWarning />);
		expect(screen.getByText('Desktop recommended')).toBeDefined();
	});

	it('does not render when viewport is 1024px or wider', () => {
		Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
		render(<MobileViewportWarning />);
		expect(screen.queryByText('Desktop recommended')).toBeNull();
	});

	it('can be dismissed', () => {
		Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
		render(<MobileViewportWarning />);
		fireEvent.click(screen.getByText('Continue anyway'));
		expect(screen.queryByText('Desktop recommended')).toBeNull();
	});

	it('updates on resize', () => {
		Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
		render(<MobileViewportWarning />);
		expect(screen.queryByText('Desktop recommended')).toBeNull();

		Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
		fireEvent(window, new Event('resize'));
		expect(screen.getByText('Desktop recommended')).toBeDefined();
	});

	it('registers and cleans up resize listener', () => {
		const addSpy = vi.spyOn(window, 'addEventListener');
		const removeSpy = vi.spyOn(window, 'removeEventListener');

		Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
		const { unmount } = render(<MobileViewportWarning />);
		expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

		unmount();
		expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
	});
});
