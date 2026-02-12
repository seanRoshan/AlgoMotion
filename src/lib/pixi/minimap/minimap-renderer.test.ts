import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CameraState, SceneElement } from '@/types';
import { MINIMAP_DEFAULTS } from '@/types';
import { MinimapRenderer, type MinimapRenderOptions } from './minimap-renderer';

// ── Mocks ──

function mockGraphics() {
	const g = {
		clear: vi.fn().mockReturnThis(),
		rect: vi.fn().mockReturnThis(),
		fill: vi.fn().mockReturnThis(),
		stroke: vi.fn().mockReturnThis(),
		roundRect: vi.fn().mockReturnThis(),
		setStrokeStyle: vi.fn().mockReturnThis(),
		position: { set: vi.fn() },
		alpha: 1,
		visible: true,
	};
	return g;
}

function mockContainer() {
	const children: unknown[] = [];
	return {
		addChild: vi.fn((child: unknown) => {
			children.push(child);
			return child;
		}),
		removeChildren: vi.fn(() => {
			children.length = 0;
		}),
		children,
		position: { set: vi.fn() },
		visible: true,
		label: '',
	};
}

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: `el-${Math.random().toString(36).slice(2, 8)}`,
		type: 'rect',
		position: { x: 100, y: 200 },
		size: { width: 120, height: 80 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: {
			fill: '#2a2a4a',
			stroke: '#4a4a6a',
			strokeWidth: 2,
			cornerRadius: 0,
			fontSize: 14,
			fontFamily: 'sans-serif',
			fontWeight: 500,
			textColor: '#ffffff',
		},
		metadata: {},
		...overrides,
	};
}

function makeOptions(overrides: Partial<MinimapRenderOptions> = {}): MinimapRenderOptions {
	return {
		elements: {},
		elementIds: [],
		camera: { x: 0, y: 0, zoom: 1 },
		viewportWidth: 1200,
		viewportHeight: 800,
		minimapWidth: MINIMAP_DEFAULTS.width,
		minimapHeight: MINIMAP_DEFAULTS.height,
		...overrides,
	};
}

describe('MinimapRenderer', () => {
	let renderer: MinimapRenderer;
	let container: ReturnType<typeof mockContainer>;
	let background: ReturnType<typeof mockGraphics>;
	let elements: ReturnType<typeof mockGraphics>;
	let viewport: ReturnType<typeof mockGraphics>;

	function setup() {
		renderer = new MinimapRenderer();
		container = mockContainer();
		background = mockGraphics();
		elements = mockGraphics();
		viewport = mockGraphics();
		renderer.setGraphics(
			container as unknown as Parameters<MinimapRenderer['setGraphics']>[0],
			background as unknown as Parameters<MinimapRenderer['setGraphics']>[1],
			elements as unknown as Parameters<MinimapRenderer['setGraphics']>[2],
			viewport as unknown as Parameters<MinimapRenderer['setGraphics']>[3],
		);
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('setGraphics', () => {
		it('throws if render called before setGraphics', () => {
			const r = new MinimapRenderer();
			expect(() => r.render(makeOptions())).toThrow('Graphics not set');
		});

		it('accepts Graphics objects', () => {
			setup();
			expect(() => renderer.render(makeOptions())).not.toThrow();
		});
	});

	describe('computeWorldBounds', () => {
		it('returns default bounds for empty scene', () => {
			setup();
			const bounds = renderer.computeWorldBounds({}, []);
			expect(bounds).toBeDefined();
			expect(bounds.worldBounds.width).toBeGreaterThan(0);
			expect(bounds.worldBounds.height).toBeGreaterThan(0);
		});

		it('computes tight bounds around elements with padding', () => {
			setup();
			const el1 = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 100, height: 50 },
			});
			const el2 = makeElement({
				id: 'b',
				position: { x: 200, y: 300 },
				size: { width: 80, height: 60 },
			});
			const elMap = { a: el1, b: el2 };

			const bounds = renderer.computeWorldBounds(elMap, ['a', 'b']);

			// World extent: x=[0..280], y=[0..360]
			// With 10% padding on each side
			const contentWidth = 280; // 200 + 80
			const contentHeight = 360; // 300 + 60
			const padX = contentWidth * MINIMAP_DEFAULTS.padding;
			const padY = contentHeight * MINIMAP_DEFAULTS.padding;

			expect(bounds.worldBounds.x).toBeCloseTo(0 - padX, 1);
			expect(bounds.worldBounds.y).toBeCloseTo(0 - padY, 1);
			expect(bounds.worldBounds.width).toBeCloseTo(contentWidth + 2 * padX, 1);
			expect(bounds.worldBounds.height).toBeCloseTo(contentHeight + 2 * padY, 1);
		});

		it('computes uniform scale (fit-contain)', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 1000, height: 100 },
			});

			const bounds = renderer.computeWorldBounds({ a: el }, ['a']);

			// Very wide element: scale should be limited by width
			expect(bounds.scale).toBeGreaterThan(0);
			expect(bounds.scale).toBeLessThan(1);
		});

		it('handles single element', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: 50, y: 50 },
				size: { width: 100, height: 100 },
			});

			const bounds = renderer.computeWorldBounds({ a: el }, ['a']);

			expect(bounds.worldBounds.width).toBeGreaterThan(0);
			expect(bounds.scale).toBeGreaterThan(0);
		});
	});

	describe('render', () => {
		it('clears all graphics on each render', () => {
			setup();
			renderer.render(makeOptions());
			expect(background.clear).toHaveBeenCalled();
			expect(elements.clear).toHaveBeenCalled();
			expect(viewport.clear).toHaveBeenCalled();
		});

		it('draws background rectangle', () => {
			setup();
			renderer.render(makeOptions());
			expect(background.rect).toHaveBeenCalled();
			expect(background.fill).toHaveBeenCalled();
		});

		it('draws viewport rectangle', () => {
			setup();
			renderer.render(makeOptions());
			expect(viewport.rect).toHaveBeenCalled();
			expect(viewport.stroke).toHaveBeenCalled();
		});

		it('draws element rectangles when elements exist', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: 10, y: 20 },
				size: { width: 50, height: 30 },
			});
			renderer.render(makeOptions({ elements: { a: el }, elementIds: ['a'] }));
			expect(elements.rect).toHaveBeenCalled();
			expect(elements.fill).toHaveBeenCalled();
		});

		it('does not draw element rects for empty scene', () => {
			setup();
			renderer.render(makeOptions());
			expect(elements.rect).not.toHaveBeenCalled();
		});

		it('positions container at bottom-right', () => {
			setup();
			const opts = makeOptions({ viewportWidth: 1200, viewportHeight: 800 });
			renderer.render(opts);

			const [x, y] = container.position.set.mock.calls[0] as [number, number];
			// Should be at bottom-right with margin
			expect(x).toBe(1200 - MINIMAP_DEFAULTS.width - MINIMAP_DEFAULTS.margin);
			expect(y).toBe(800 - MINIMAP_DEFAULTS.height - MINIMAP_DEFAULTS.margin);
		});
	});

	describe('coordinate transforms', () => {
		it('worldToMinimap maps world center to minimap center', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: -50, y: -50 },
				size: { width: 100, height: 100 },
			});
			renderer.render(makeOptions({ elements: { a: el }, elementIds: ['a'] }));

			// World center is (0, 0) for this element at (-50,-50) with size 100x100
			const result = renderer.worldToMinimap(0, 0);
			expect(result).toBeDefined();
			// Should be near the center of the minimap
			expect(result.x).toBeGreaterThan(0);
			expect(result.x).toBeLessThan(MINIMAP_DEFAULTS.width);
			expect(result.y).toBeGreaterThan(0);
			expect(result.y).toBeLessThan(MINIMAP_DEFAULTS.height);
		});

		it('minimapToWorld is inverse of worldToMinimap', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 200, height: 200 },
			});
			renderer.render(makeOptions({ elements: { a: el }, elementIds: ['a'] }));

			const worldPoint = { x: 100, y: 100 };
			const minimapPoint = renderer.worldToMinimap(worldPoint.x, worldPoint.y);
			const backToWorld = renderer.minimapToWorld(minimapPoint.x, minimapPoint.y);

			expect(backToWorld.x).toBeCloseTo(worldPoint.x, 1);
			expect(backToWorld.y).toBeCloseTo(worldPoint.y, 1);
		});

		it('returns zero point when no bounds computed', () => {
			renderer = new MinimapRenderer();
			const result = renderer.worldToMinimap(0, 0);
			expect(result).toEqual({ x: 0, y: 0 });
		});
	});

	describe('hitTest', () => {
		it('returns "none" for points outside minimap', () => {
			setup();
			renderer.render(makeOptions({ viewportWidth: 1200, viewportHeight: 800 }));

			// Point at top-left of canvas (far from minimap)
			const hit = renderer.hitTest(0, 0, { x: 0, y: 0, zoom: 1 }, 1200, 800);
			expect(hit.type).toBe('none');
		});

		it('returns "map" for points inside minimap but outside viewport rect', () => {
			setup();
			// Very large scene so viewport rect is small relative to minimap
			const el = makeElement({
				id: 'a',
				position: { x: -5000, y: -5000 },
				size: { width: 10000, height: 10000 },
			});
			const camera: CameraState = { x: 0, y: 0, zoom: 1 };
			renderer.render(
				makeOptions({
					elements: { a: el },
					elementIds: ['a'],
					viewportWidth: 1200,
					viewportHeight: 800,
					camera,
				}),
			);

			// Click at a corner of the minimap — far from the viewport rect which is
			// centered around the camera position (which sees world 0..1200, 0..800,
			// a tiny portion of the 10000x10000 scene)
			const minimapLeft = 1200 - MINIMAP_DEFAULTS.width - MINIMAP_DEFAULTS.margin;
			const minimapTop = 800 - MINIMAP_DEFAULTS.height - MINIMAP_DEFAULTS.margin;
			const hit = renderer.hitTest(minimapLeft + 5, minimapTop + 5, camera, 1200, 800);

			expect(hit.type).toBe('map');
			if (hit.type === 'map') {
				expect(typeof hit.worldPosition.x).toBe('number');
				expect(typeof hit.worldPosition.y).toBe('number');
			}
		});

		it('returns "viewport" for points inside viewport rectangle', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: -1000, y: -1000 },
				size: { width: 2000, height: 2000 },
			});
			const camera: CameraState = { x: 0, y: 0, zoom: 1 };
			renderer.render(
				makeOptions({
					elements: { a: el },
					elementIds: ['a'],
					viewportWidth: 1200,
					viewportHeight: 800,
					camera,
				}),
			);

			// The viewport rect on the minimap corresponds to what the camera sees
			// Camera at (0,0,1) means viewport shows world coords (0,0) to (1200,800)
			// We need to find where that maps to in screen coords (minimap position)
			const viewportRect = renderer.getViewportRect(camera, 1200, 800);
			if (viewportRect) {
				const minimapLeft = 1200 - MINIMAP_DEFAULTS.width - MINIMAP_DEFAULTS.margin;
				const minimapTop = 800 - MINIMAP_DEFAULTS.height - MINIMAP_DEFAULTS.margin;
				const hitX = minimapLeft + viewportRect.x + viewportRect.width / 2;
				const hitY = minimapTop + viewportRect.y + viewportRect.height / 2;

				const hit = renderer.hitTest(hitX, hitY, camera, 1200, 800);
				expect(hit.type).toBe('viewport');
			}
		});
	});

	describe('getViewportRect', () => {
		it('returns null when no bounds computed', () => {
			renderer = new MinimapRenderer();
			expect(renderer.getViewportRect({ x: 0, y: 0, zoom: 1 }, 1200, 800)).toBeNull();
		});

		it('returns rectangle in minimap coordinates', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: -500, y: -500 },
				size: { width: 1000, height: 1000 },
			});
			renderer.render(
				makeOptions({
					elements: { a: el },
					elementIds: ['a'],
					camera: { x: 0, y: 0, zoom: 1 },
				}),
			);

			const rect = renderer.getViewportRect({ x: 0, y: 0, zoom: 1 }, 1200, 800);
			expect(rect).not.toBeNull();
			if (rect) {
				expect(rect.width).toBeGreaterThan(0);
				expect(rect.height).toBeGreaterThan(0);
			}
		});

		it('viewport rect shrinks when zoomed out', () => {
			setup();
			const el = makeElement({
				id: 'a',
				position: { x: -500, y: -500 },
				size: { width: 1000, height: 1000 },
			});
			renderer.render(
				makeOptions({
					elements: { a: el },
					elementIds: ['a'],
				}),
			);

			const zoomedIn = renderer.getViewportRect({ x: 0, y: 0, zoom: 2 }, 1200, 800);
			const zoomedOut = renderer.getViewportRect({ x: 0, y: 0, zoom: 0.5 }, 1200, 800);

			if (zoomedIn && zoomedOut) {
				expect(zoomedOut.width).toBeGreaterThan(zoomedIn.width);
				expect(zoomedOut.height).toBeGreaterThan(zoomedIn.height);
			}
		});
	});

	describe('getMinimapScreenBounds', () => {
		it('returns the screen-space bounds of the minimap', () => {
			setup();
			renderer.render(makeOptions({ viewportWidth: 1200, viewportHeight: 800 }));
			const bounds = renderer.getMinimapScreenBounds();

			expect(bounds.x).toBe(1200 - MINIMAP_DEFAULTS.width - MINIMAP_DEFAULTS.margin);
			expect(bounds.y).toBe(800 - MINIMAP_DEFAULTS.height - MINIMAP_DEFAULTS.margin);
			expect(bounds.width).toBe(MINIMAP_DEFAULTS.width);
			expect(bounds.height).toBe(MINIMAP_DEFAULTS.height);
		});
	});
});
