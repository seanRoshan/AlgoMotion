import { describe, expect, it, vi } from 'vitest';
import { AlignmentGuideRenderer } from './alignment-guide-renderer';
import type { AlignmentGuide } from './snap-engine';

function mockGraphics() {
	const g = {
		clear: vi.fn().mockReturnThis(),
		moveTo: vi.fn().mockReturnThis(),
		lineTo: vi.fn().mockReturnThis(),
		stroke: vi.fn().mockReturnThis(),
		destroy: vi.fn(),
	};
	return g;
}

/** Create a mock Pixi module with constructable Graphics. Uses `this`-binding so Biome won't convert to arrow. */
function createPixiMock(...gfxInstances: ReturnType<typeof mockGraphics>[]) {
	let idx = 0;
	return {
		Graphics: vi.fn(function (this: Record<string, unknown>) {
			// biome-ignore lint/style/noNonNullAssertion: gfxInstances always has entries
			const g = gfxInstances[idx++ % gfxInstances.length]!;
			this.clear = g.clear;
			this.moveTo = g.moveTo;
			this.lineTo = g.lineTo;
			this.stroke = g.stroke;
			this.destroy = g.destroy;
		}),
	};
}

function mockSelectionLayer() {
	return {
		addChild: vi.fn(),
		removeChild: vi.fn(),
		children: [] as unknown[],
	};
}

describe('AlignmentGuideRenderer', () => {
	describe('render', () => {
		it('does not create graphics for empty guides', () => {
			const pixi = createPixiMock(mockGraphics());
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			renderer.render([], 1);

			expect(pixi.Graphics).not.toHaveBeenCalled();
			expect(layer.addChild).not.toHaveBeenCalled();
		});

		it('creates graphics and draws for non-empty guides', () => {
			const pixi = createPixiMock(mockGraphics());
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			const guides: AlignmentGuide[] = [{ axis: 'vertical', position: 100, start: 0, end: 500 }];
			renderer.render(guides, 1);

			expect(pixi.Graphics).toHaveBeenCalled();
			expect(layer.addChild).toHaveBeenCalled();
		});

		it('draws vertical guide line at correct x position', () => {
			const gfx = mockGraphics();
			const pixi = createPixiMock(gfx);
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			const guides: AlignmentGuide[] = [{ axis: 'vertical', position: 150, start: 0, end: 400 }];
			renderer.render(guides, 1);

			// Should call moveTo/lineTo with x=150 (position) for all dashes
			const moveToXValues = gfx.moveTo.mock.calls.map((call: number[]) => call[0]);
			for (const x of moveToXValues) {
				expect(x).toBe(150);
			}
			expect(gfx.moveTo).toHaveBeenCalled();
			expect(gfx.stroke).toHaveBeenCalled();
		});

		it('draws horizontal guide line at correct y position', () => {
			const gfx = mockGraphics();
			const pixi = createPixiMock(gfx);
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			const guides: AlignmentGuide[] = [{ axis: 'horizontal', position: 200, start: 0, end: 600 }];
			renderer.render(guides, 1);

			// Should call moveTo/lineTo with y=200 for all dashes
			const moveToYValues = gfx.moveTo.mock.calls.map((call: number[]) => call[1]);
			for (const y of moveToYValues) {
				expect(y).toBe(200);
			}
			expect(gfx.moveTo).toHaveBeenCalled();
		});

		it('scales stroke width inversely with camera zoom', () => {
			const gfx = mockGraphics();
			const pixi = createPixiMock(gfx);
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			const guides: AlignmentGuide[] = [{ axis: 'vertical', position: 100, start: 0, end: 200 }];
			renderer.render(guides, 2);

			const strokeCall = gfx.stroke.mock.calls[0][0] as {
				width: number;
				color: number;
			};
			expect(strokeCall.width).toBeCloseTo(0.5, 5); // 1 / 2
		});

		it('destroys previous graphics on re-render', () => {
			const gfx1 = mockGraphics();
			const gfx2 = mockGraphics();
			const pixi = createPixiMock(gfx1, gfx2);
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			const guides: AlignmentGuide[] = [{ axis: 'vertical', position: 100, start: 0, end: 200 }];
			renderer.render(guides, 1);
			renderer.render(guides, 1);

			expect(gfx1.destroy).toHaveBeenCalled();
		});
	});

	describe('clear', () => {
		it('destroys graphics object', () => {
			const gfx = mockGraphics();
			const pixi = createPixiMock(gfx);
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			renderer.render([{ axis: 'vertical', position: 100, start: 0, end: 200 }], 1);
			renderer.clear();

			expect(layer.removeChild).toHaveBeenCalled();
			expect(gfx.destroy).toHaveBeenCalled();
		});

		it('is safe to call when no graphics exist', () => {
			const pixi = createPixiMock(mockGraphics());
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			expect(() => renderer.clear()).not.toThrow();
		});
	});

	describe('destroy', () => {
		it('cleans up all resources', () => {
			const gfx = mockGraphics();
			const pixi = createPixiMock(gfx);
			const layer = mockSelectionLayer();
			const renderer = new AlignmentGuideRenderer(
				pixi as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[0],
				layer as unknown as ConstructorParameters<typeof AlignmentGuideRenderer>[1],
			);

			renderer.render([{ axis: 'vertical', position: 100, start: 0, end: 200 }], 1);
			renderer.destroy();

			expect(gfx.destroy).toHaveBeenCalled();
		});
	});
});
