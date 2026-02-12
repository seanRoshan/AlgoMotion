import { describe, expect, it, vi } from 'vitest';
import { GridRenderer } from './grid-renderer';

/**
 * GridRenderer tests.
 * Uses a mock Graphics object since we can't create real Pixi.js
 * Graphics in jsdom. Tests verify the correct drawing commands are called.
 */

function createMockGraphics() {
	const mock = {
		clear: vi.fn().mockReturnThis(),
		circle: vi.fn().mockReturnThis(),
		fill: vi.fn().mockReturnThis(),
		moveTo: vi.fn().mockReturnThis(),
		lineTo: vi.fn().mockReturnThis(),
		stroke: vi.fn().mockReturnThis(),
	};
	return mock;
}

describe('GridRenderer', () => {
	describe('setGraphics', () => {
		it('throws when rendering without graphics set', () => {
			const renderer = new GridRenderer();
			expect(() =>
				renderer.render({
					mode: 'dots',
					viewportWidth: 800,
					viewportHeight: 600,
					camera: { x: 0, y: 0, zoom: 1 },
					gridSize: 20,
					color: 0x3a3a4a,
				}),
			).toThrow('Graphics not set');
		});
	});

	describe('render mode: none', () => {
		it('clears graphics and returns without drawing', () => {
			const renderer = new GridRenderer();
			const mock = createMockGraphics();
			// biome-ignore lint/suspicious/noExplicitAny: mock Graphics for testing
			renderer.setGraphics(mock as any);

			renderer.render({
				mode: 'none',
				viewportWidth: 800,
				viewportHeight: 600,
				camera: { x: 0, y: 0, zoom: 1 },
				gridSize: 20,
				color: 0x3a3a4a,
			});

			expect(mock.clear).toHaveBeenCalled();
			expect(mock.circle).not.toHaveBeenCalled();
			expect(mock.moveTo).not.toHaveBeenCalled();
		});
	});

	describe('render mode: dots', () => {
		it('draws circles for dot grid', () => {
			const renderer = new GridRenderer();
			const mock = createMockGraphics();
			// biome-ignore lint/suspicious/noExplicitAny: mock Graphics for testing
			renderer.setGraphics(mock as any);

			renderer.render({
				mode: 'dots',
				viewportWidth: 100,
				viewportHeight: 100,
				camera: { x: 0, y: 0, zoom: 1 },
				gridSize: 20,
				color: 0xffffff,
			});

			expect(mock.clear).toHaveBeenCalled();
			expect(mock.circle).toHaveBeenCalled();
			expect(mock.fill).toHaveBeenCalled();
		});

		it('calls fill with correct color', () => {
			const renderer = new GridRenderer();
			const mock = createMockGraphics();
			// biome-ignore lint/suspicious/noExplicitAny: mock Graphics for testing
			renderer.setGraphics(mock as any);

			renderer.render({
				mode: 'dots',
				viewportWidth: 100,
				viewportHeight: 100,
				camera: { x: 0, y: 0, zoom: 1 },
				gridSize: 20,
				color: 0xabcdef,
			});

			expect(mock.fill).toHaveBeenCalledWith(expect.objectContaining({ color: 0xabcdef }));
		});
	});

	describe('render mode: lines', () => {
		it('draws lines for line grid', () => {
			const renderer = new GridRenderer();
			const mock = createMockGraphics();
			// biome-ignore lint/suspicious/noExplicitAny: mock Graphics for testing
			renderer.setGraphics(mock as any);

			renderer.render({
				mode: 'lines',
				viewportWidth: 100,
				viewportHeight: 100,
				camera: { x: 0, y: 0, zoom: 1 },
				gridSize: 20,
				color: 0xffffff,
			});

			expect(mock.clear).toHaveBeenCalled();
			expect(mock.moveTo).toHaveBeenCalled();
			expect(mock.lineTo).toHaveBeenCalled();
			expect(mock.stroke).toHaveBeenCalled();
		});

		it('calls stroke with correct color', () => {
			const renderer = new GridRenderer();
			const mock = createMockGraphics();
			// biome-ignore lint/suspicious/noExplicitAny: mock Graphics for testing
			renderer.setGraphics(mock as any);

			renderer.render({
				mode: 'lines',
				viewportWidth: 100,
				viewportHeight: 100,
				camera: { x: 0, y: 0, zoom: 1 },
				gridSize: 20,
				color: 0xabcdef,
			});

			expect(mock.stroke).toHaveBeenCalledWith(expect.objectContaining({ color: 0xabcdef }));
		});
	});

	describe('adaptive grid spacing', () => {
		it('doubles spacing at low zoom to avoid clutter', () => {
			const renderer = new GridRenderer();
			const mock = createMockGraphics();
			// biome-ignore lint/suspicious/noExplicitAny: mock Graphics for testing
			renderer.setGraphics(mock as any);

			// At zoom 0.2 with gridSize 20, screen spacing = 4px → too small
			// Should double to 40 (8px), still too small → 80 (16px), still small → 160 (32px)
			renderer.render({
				mode: 'dots',
				viewportWidth: 200,
				viewportHeight: 200,
				camera: { x: 0, y: 0, zoom: 0.2 },
				gridSize: 20,
				color: 0xffffff,
			});

			// At zoom 0.2 and viewport 200x200, there should be very few dots
			// because the spacing is increased adaptively
			const circleCallCount = mock.circle.mock.calls.length;
			// With gridSize 20 at zoom 0.2: effective spacing should be ~80 (20 * 4)
			// 200/0.2 = 1000 world units visible, 1000/80 ≈ 12 per axis
			expect(circleCallCount).toBeLessThan(200); // Much fewer than naive 50*50 = 2500
		});
	});
});
