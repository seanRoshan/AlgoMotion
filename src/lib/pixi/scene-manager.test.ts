import { describe, expect, it } from 'vitest';
import { SceneManager } from './scene-manager';

/**
 * SceneManager tests for non-DOM functionality.
 * We test coordinate conversion, camera math, and viewport bounds
 * without needing a real WebGL/WebGPU context.
 *
 * Full canvas rendering tests are in Playwright E2E tests.
 */

describe('SceneManager', () => {
	describe('construction', () => {
		it('creates an instance', () => {
			const manager = new SceneManager();
			expect(manager).toBeInstanceOf(SceneManager);
		});

		it('starts uninitialized', () => {
			const manager = new SceneManager();
			expect(manager.initialized).toBe(false);
		});

		it('starts with default camera', () => {
			const manager = new SceneManager();
			expect(manager.camera).toEqual({ x: 0, y: 0, zoom: 1 });
		});

		it('worldRoot is null before init', () => {
			const manager = new SceneManager();
			expect(manager.worldRoot).toBeNull();
		});
	});

	describe('screenToWorld (before init)', () => {
		it('converts screen to world coordinates at default camera (1:1)', () => {
			const manager = new SceneManager();
			const world = manager.screenToWorld(100, 200);
			expect(world).toEqual({ x: 100, y: 200 });
		});

		it('accounts for camera offset', () => {
			const manager = new SceneManager();
			// Simulate camera at offset (50, 100) with zoom 1
			manager.setCamera({ x: 50, y: 100 });

			const world = manager.screenToWorld(150, 300);
			// screenToWorld: (screenX - camera.x) / zoom = (150 - 50) / 1 = 100
			expect(world).toEqual({ x: 100, y: 200 });
		});

		it('accounts for camera zoom', () => {
			const manager = new SceneManager();
			manager.setCamera({ zoom: 2 });

			const world = manager.screenToWorld(200, 400);
			// (200 - 0) / 2 = 100, (400 - 0) / 2 = 200
			expect(world).toEqual({ x: 100, y: 200 });
		});

		it('handles combined offset and zoom', () => {
			const manager = new SceneManager();
			manager.setCamera({ x: 100, y: 50, zoom: 0.5 });

			const world = manager.screenToWorld(200, 150);
			// (200 - 100) / 0.5 = 200, (150 - 50) / 0.5 = 200
			expect(world).toEqual({ x: 200, y: 200 });
		});
	});

	describe('worldToScreen (before init)', () => {
		it('converts world to screen at default camera', () => {
			const manager = new SceneManager();
			const screen = manager.worldToScreen(100, 200);
			expect(screen).toEqual({ x: 100, y: 200 });
		});

		it('accounts for camera offset', () => {
			const manager = new SceneManager();
			manager.setCamera({ x: 50, y: 100 });

			const screen = manager.worldToScreen(100, 200);
			// worldToScreen: worldX * zoom + camera.x = 100 * 1 + 50 = 150
			expect(screen).toEqual({ x: 150, y: 300 });
		});

		it('accounts for camera zoom', () => {
			const manager = new SceneManager();
			manager.setCamera({ zoom: 2 });

			const screen = manager.worldToScreen(100, 200);
			// 100 * 2 + 0 = 200, 200 * 2 + 0 = 400
			expect(screen).toEqual({ x: 200, y: 400 });
		});
	});

	describe('screenToWorld / worldToScreen roundtrip', () => {
		it('roundtrips correctly with offset and zoom', () => {
			const manager = new SceneManager();
			manager.setCamera({ x: 150, y: -50, zoom: 1.5 });

			const world = manager.screenToWorld(300, 400);
			const screen = manager.worldToScreen(world.x, world.y);

			expect(screen.x).toBeCloseTo(300, 5);
			expect(screen.y).toBeCloseTo(400, 5);
		});
	});

	describe('setCamera', () => {
		it('updates camera position', () => {
			const manager = new SceneManager();
			manager.setCamera({ x: 100, y: 200 });
			expect(manager.camera).toEqual({ x: 100, y: 200, zoom: 1 });
		});

		it('updates camera zoom', () => {
			const manager = new SceneManager();
			manager.setCamera({ zoom: 2.5 });
			expect(manager.camera.zoom).toBe(2.5);
		});

		it('partial update preserves other values', () => {
			const manager = new SceneManager();
			manager.setCamera({ x: 100, y: 200, zoom: 2 });
			manager.setCamera({ x: 50 });
			expect(manager.camera).toEqual({ x: 50, y: 200, zoom: 2 });
		});

		it('clamps zoom to default min (0.1)', () => {
			const manager = new SceneManager();
			manager.setCamera({ zoom: 0.01 });
			expect(manager.camera.zoom).toBe(0.1);
		});

		it('clamps zoom to default max (5)', () => {
			const manager = new SceneManager();
			manager.setCamera({ zoom: 10 });
			expect(manager.camera.zoom).toBe(5);
		});

		it('returns a copy of camera (not mutable reference)', () => {
			const manager = new SceneManager();
			const cam1 = manager.camera;
			cam1.x = 999;
			expect(manager.camera.x).toBe(0);
		});
	});

	describe('getViewportBounds (before init)', () => {
		it('returns zero-size bounds when not initialized', () => {
			const manager = new SceneManager();
			const bounds = manager.getViewportBounds();
			expect(bounds.width).toBe(0);
			expect(bounds.height).toBe(0);
		});
	});

	describe('getDisplayObject (before init)', () => {
		it('returns null when elementRenderer is not initialized', () => {
			const manager = new SceneManager();
			expect(manager.getDisplayObject('any-id')).toBeNull();
		});
	});

	describe('setBackgroundColor (before init)', () => {
		it('does not throw when app is not initialized', () => {
			const manager = new SceneManager();
			expect(() => manager.setBackgroundColor(0xffffff)).not.toThrow();
		});
	});

	describe('setGridColor (before init)', () => {
		it('does not throw when app is not initialized', () => {
			const manager = new SceneManager();
			expect(() => manager.setGridColor(0xcccccc)).not.toThrow();
		});
	});

	describe('destroy (before init)', () => {
		it('can be called safely without init', () => {
			const manager = new SceneManager();
			expect(() => manager.destroy()).not.toThrow();
		});
	});
});
