'use client';

import { useEffect, useRef } from 'react';
import { SceneManager } from '@/lib/pixi/scene-manager';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useUIStore } from '@/lib/stores/ui-store';

/**
 * React wrapper for the imperative Pixi.js canvas.
 * Initializes SceneManager, syncs with Zustand stores,
 * and handles cleanup on unmount.
 *
 * React handles ONLY this thin wrapper — all canvas rendering
 * is managed imperatively by SceneManager.
 *
 * Spec reference: Section 5, 6.1
 */
export function PixiCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const managerRef = useRef<SceneManager | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const manager = new SceneManager();
		managerRef.current = manager;

		// Re-entry guard prevents infinite loops in bidirectional camera sync
		let isSyncingCamera = false;

		manager
			.init({
				container,
				backgroundColor: 0x1a1a2e,
				backgroundMode: 'dots',
				gridSize: 20,
			})
			.then(() => {
				// SceneManager → Zustand: sync camera on pan/zoom
				manager.setCameraChangeHandler((camera) => {
					if (isSyncingCamera) return;
					isSyncingCamera = true;
					useSceneStore.getState().setCamera(camera);
					isSyncingCamera = false;
				});

				// Apply initial store state
				const { camera } = useSceneStore.getState();
				manager.setCamera(camera);

				const { gridVisible } = useUIStore.getState();
				manager.setGridVisible(gridVisible);
			});

		// Subscribe to grid visibility changes
		let prevGridVisible = useUIStore.getState().gridVisible;
		const unsubUI = useUIStore.subscribe((state) => {
			if (state.gridVisible !== prevGridVisible) {
				prevGridVisible = state.gridVisible;
				managerRef.current?.setGridVisible(state.gridVisible);
			}
		});

		// Zustand → SceneManager: sync camera from programmatic changes
		let prevCamera = useSceneStore.getState().camera;
		const unsubCamera = useSceneStore.subscribe((state) => {
			if (isSyncingCamera) return;
			const { camera } = state;
			if (
				camera.x !== prevCamera.x ||
				camera.y !== prevCamera.y ||
				camera.zoom !== prevCamera.zoom
			) {
				prevCamera = { ...camera };
				isSyncingCamera = true;
				managerRef.current?.setCamera(camera);
				isSyncingCamera = false;
			}
		});

		return () => {
			unsubUI();
			unsubCamera();
			manager.destroy();
			managerRef.current = null;
		};
	}, []);

	return (
		<main
			ref={containerRef}
			className="relative h-full w-full overflow-hidden"
			aria-label="Canvas workspace"
		/>
	);
}
