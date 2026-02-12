import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CameraState } from '@/types';
import {
	type MinimapInteractionDeps,
	MinimapInteractionHandler,
} from './minimap-interaction-handler';

function makeDeps(overrides: Partial<MinimapInteractionDeps> = {}): MinimapInteractionDeps {
	return {
		hitTest: vi.fn().mockReturnValue({ type: 'none' }),
		minimapToWorld: vi.fn().mockReturnValue({ x: 0, y: 0 }),
		getViewportRect: vi.fn().mockReturnValue({ x: 50, y: 50, width: 40, height: 30 }),
		getMinimapScreenBounds: vi.fn().mockReturnValue({ x: 984, y: 634, width: 200, height: 150 }),
		setCamera: vi.fn(),
		getCamera: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 }),
		getViewportSize: vi.fn().mockReturnValue({ width: 1200, height: 800 }),
		...overrides,
	};
}

function makePointerEvent(overrides: Partial<PointerEvent> = {}): PointerEvent {
	return {
		clientX: 0,
		clientY: 0,
		button: 0,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		...overrides,
	} as unknown as PointerEvent;
}

describe('MinimapInteractionHandler', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('onPointerDown', () => {
		it('returns false when hit test returns none', () => {
			const deps = makeDeps();
			const handler = new MinimapInteractionHandler(deps);

			const e = makePointerEvent({ clientX: 100, clientY: 100 });
			const consumed = handler.onPointerDown(e);

			expect(consumed).toBe(false);
		});

		it('returns true and jumps camera when clicking on map body', () => {
			const targetWorld = { x: 500, y: 300 };
			const deps = makeDeps({
				hitTest: vi.fn().mockReturnValue({ type: 'map', worldPosition: targetWorld }),
				getCamera: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 }),
				getViewportSize: vi.fn().mockReturnValue({ width: 1200, height: 800 }),
			});
			const handler = new MinimapInteractionHandler(deps);

			const e = makePointerEvent({ clientX: 1050, clientY: 700 });
			const consumed = handler.onPointerDown(e);

			expect(consumed).toBe(true);
			expect(deps.setCamera).toHaveBeenCalledTimes(1);

			// Camera should be set to center the viewport on the clicked world position
			const cameraArg = (deps.setCamera as ReturnType<typeof vi.fn>).mock
				.calls[0][0] as CameraState;
			// With zoom=1, viewport=1200x800, centering on (500,300):
			// x = -(500 - 1200/2) * 1 = -(500-600) = 100
			// y = -(300 - 800/2) * 1 = -(300-400) = 100
			expect(cameraArg.x).toBeCloseTo(100, 0);
			expect(cameraArg.y).toBeCloseTo(100, 0);
		});

		it('returns true and starts drag when clicking on viewport rect', () => {
			const deps = makeDeps({
				hitTest: vi.fn().mockReturnValue({ type: 'viewport' }),
			});
			const handler = new MinimapInteractionHandler(deps);

			const e = makePointerEvent({ clientX: 1050, clientY: 700 });
			const consumed = handler.onPointerDown(e);

			expect(consumed).toBe(true);
			expect(handler.isDragging).toBe(true);
		});

		it('only handles left-click (button 0)', () => {
			const deps = makeDeps({
				hitTest: vi.fn().mockReturnValue({ type: 'viewport' }),
			});
			const handler = new MinimapInteractionHandler(deps);

			const e = makePointerEvent({ button: 2 });
			const consumed = handler.onPointerDown(e);

			expect(consumed).toBe(false);
		});
	});

	describe('onPointerMove', () => {
		it('does nothing when not dragging', () => {
			const deps = makeDeps();
			const handler = new MinimapInteractionHandler(deps);

			handler.onPointerMove(makePointerEvent({ clientX: 100, clientY: 100 }));

			expect(deps.setCamera).not.toHaveBeenCalled();
		});

		it('updates camera when dragging viewport rect', () => {
			const deps = makeDeps({
				hitTest: vi.fn().mockReturnValue({ type: 'viewport' }),
				getCamera: vi.fn().mockReturnValue({ x: 100, y: 50, zoom: 1 }),
				minimapToWorld: vi
					.fn()
					.mockReturnValueOnce({ x: 200, y: 150 }) // drag start world position
					.mockReturnValueOnce({ x: 250, y: 180 }), // current world position
			});
			const handler = new MinimapInteractionHandler(deps);

			// Start drag
			handler.onPointerDown(makePointerEvent({ clientX: 1050, clientY: 700 }));

			// Move
			handler.onPointerMove(makePointerEvent({ clientX: 1060, clientY: 710 }));

			expect(deps.setCamera).toHaveBeenCalled();
		});
	});

	describe('onPointerUp', () => {
		it('ends drag state', () => {
			const deps = makeDeps({
				hitTest: vi.fn().mockReturnValue({ type: 'viewport' }),
			});
			const handler = new MinimapInteractionHandler(deps);

			handler.onPointerDown(makePointerEvent({ clientX: 1050, clientY: 700 }));
			expect(handler.isDragging).toBe(true);

			handler.onPointerUp(makePointerEvent());
			expect(handler.isDragging).toBe(false);
		});

		it('does nothing when not dragging', () => {
			const deps = makeDeps();
			const handler = new MinimapInteractionHandler(deps);

			handler.onPointerUp(makePointerEvent());
			expect(handler.isDragging).toBe(false);
		});
	});

	describe('camera centering on click', () => {
		it('centers viewport on clicked world position at different zoom levels', () => {
			const zoom = 2;
			const targetWorld = { x: 300, y: 200 };
			const deps = makeDeps({
				hitTest: vi.fn().mockReturnValue({ type: 'map', worldPosition: targetWorld }),
				getCamera: vi.fn().mockReturnValue({ x: 0, y: 0, zoom }),
				getViewportSize: vi.fn().mockReturnValue({ width: 1200, height: 800 }),
			});
			const handler = new MinimapInteractionHandler(deps);

			handler.onPointerDown(makePointerEvent({ clientX: 1050, clientY: 700 }));

			const cameraArg = (deps.setCamera as ReturnType<typeof vi.fn>).mock
				.calls[0][0] as CameraState;
			// x = -(worldX - viewportWidth / 2 / zoom) * zoom
			// x = -(300 - 1200/2/2) * 2 = -(300 - 300) * 2 = 0
			expect(cameraArg.x).toBeCloseTo(-(targetWorld.x * zoom) + 1200 / 2, 0);
			expect(cameraArg.y).toBeCloseTo(-(targetWorld.y * zoom) + 800 / 2, 0);
			expect(cameraArg.zoom).toBe(zoom);
		});
	});
});
