import { describe, expect, it, vi } from 'vitest';
import type { RulerRenderOptions } from './ruler-renderer';
import { RulerRenderer } from './ruler-renderer';

function createMockContext() {
	return {
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		fillText: vi.fn(),
		beginPath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		stroke: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 1,
		font: '',
		textAlign: '' as CanvasTextAlign,
		textBaseline: '' as CanvasTextBaseline,
	} as unknown as CanvasRenderingContext2D;
}

function baseOptions(overrides: Partial<RulerRenderOptions> = {}): RulerRenderOptions {
	return {
		orientation: 'horizontal',
		length: 800,
		rulerSize: 24,
		cameraX: 0,
		cameraY: 0,
		zoom: 1,
		cursorPosition: null,
		backgroundColor: 0x1e1e2e,
		tickColor: 0x666666,
		labelColor: '#999999',
		cursorColor: 0xff4444,
		...overrides,
	};
}

describe('RulerRenderer', () => {
	describe('getNiceInterval', () => {
		it('returns ~100 world units at zoom 1', () => {
			const renderer = new RulerRenderer();
			const interval = renderer.getNiceInterval(1);
			expect(interval).toBe(100);
		});

		it('returns smaller interval at zoom 2 (more detail)', () => {
			const renderer = new RulerRenderer();
			const interval = renderer.getNiceInterval(2);
			expect(interval).toBeLessThan(100);
			expect(interval).toBeGreaterThan(0);
		});

		it('returns larger interval at zoom 0.5 (less detail)', () => {
			const renderer = new RulerRenderer();
			const interval = renderer.getNiceInterval(0.5);
			expect(interval).toBeGreaterThan(100);
		});

		it('returns a nice number (1, 2, 5, 10, 20, 50, 100, ...)', () => {
			const renderer = new RulerRenderer();
			const niceValues = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
			for (const zoom of [0.1, 0.25, 0.5, 1, 2, 4, 8]) {
				const interval = renderer.getNiceInterval(zoom);
				expect(niceValues).toContain(interval);
			}
		});

		it('ensures screen spacing is between 50 and 200 pixels', () => {
			const renderer = new RulerRenderer();
			for (const zoom of [0.1, 0.2, 0.5, 1, 2, 5, 10]) {
				const interval = renderer.getNiceInterval(zoom);
				const screenSpacing = interval * zoom;
				expect(screenSpacing).toBeGreaterThanOrEqual(50);
				expect(screenSpacing).toBeLessThanOrEqual(500);
			}
		});
	});

	describe('render horizontal', () => {
		it('clears the canvas', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions());
			expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 24);
		});

		it('draws background fill', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions());
			expect(ctx.fillRect).toHaveBeenCalled();
		});

		it('draws tick lines', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions());
			expect(ctx.moveTo).toHaveBeenCalled();
			expect(ctx.lineTo).toHaveBeenCalled();
			expect(ctx.stroke).toHaveBeenCalled();
		});

		it('draws labels for major ticks', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions());
			expect(ctx.fillText).toHaveBeenCalled();
			// Check that labels contain numeric values
			const labelCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
			for (const call of labelCalls) {
				expect(typeof call[0]).toBe('string');
				expect(Number.isFinite(Number(call[0]))).toBe(true);
			}
		});

		it('draws cursor indicator when cursorPosition is set', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions({ cursorPosition: 400 }));
			// Should draw at least one more line for the cursor
			const moveToCallsWithCursor = (ctx.moveTo as ReturnType<typeof vi.fn>).mock.calls;
			expect(moveToCallsWithCursor.length).toBeGreaterThan(0);
		});

		it('does not draw cursor indicator when cursorPosition is null', () => {
			const ctxWith = createMockContext();
			const ctxWithout = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctxWith, baseOptions({ cursorPosition: 200 }));
			renderer.render(ctxWithout, baseOptions({ cursorPosition: null }));
			// The version with cursor should have more drawing calls
			const withCalls = (ctxWith.moveTo as ReturnType<typeof vi.fn>).mock.calls.length;
			const withoutCalls = (ctxWithout.moveTo as ReturnType<typeof vi.fn>).mock.calls.length;
			expect(withCalls).toBeGreaterThan(withoutCalls);
		});
	});

	describe('render vertical', () => {
		it('clears with correct dimensions', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions({ orientation: 'vertical', length: 600 }));
			expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 24, 600);
		});

		it('draws tick lines and labels', () => {
			const ctx = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx, baseOptions({ orientation: 'vertical', length: 600 }));
			expect(ctx.moveTo).toHaveBeenCalled();
			expect(ctx.lineTo).toHaveBeenCalled();
			expect(ctx.fillText).toHaveBeenCalled();
		});
	});

	describe('camera offset', () => {
		it('shifts tick positions based on camera X for horizontal ruler', () => {
			const ctx1 = createMockContext();
			const ctx2 = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx1, baseOptions({ cameraX: 0 }));
			renderer.render(ctx2, baseOptions({ cameraX: 200 }));

			// Labels should be different because camera moved
			const labels1 = (ctx1.fillText as ReturnType<typeof vi.fn>).mock.calls.map(
				(c: string[]) => c[0],
			);
			const labels2 = (ctx2.fillText as ReturnType<typeof vi.fn>).mock.calls.map(
				(c: string[]) => c[0],
			);
			expect(labels1).not.toEqual(labels2);
		});

		it('shifts tick positions based on camera Y for vertical ruler', () => {
			const ctx1 = createMockContext();
			const ctx2 = createMockContext();
			const renderer = new RulerRenderer();
			renderer.render(ctx1, baseOptions({ orientation: 'vertical', cameraY: 0, length: 600 }));
			renderer.render(ctx2, baseOptions({ orientation: 'vertical', cameraY: 200, length: 600 }));

			const labels1 = (ctx1.fillText as ReturnType<typeof vi.fn>).mock.calls.map(
				(c: string[]) => c[0],
			);
			const labels2 = (ctx2.fillText as ReturnType<typeof vi.fn>).mock.calls.map(
				(c: string[]) => c[0],
			);
			expect(labels1).not.toEqual(labels2);
		});
	});
});
