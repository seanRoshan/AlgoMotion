'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCanvasKeyboard } from '@/hooks/use-canvas-keyboard';
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

	// Refresh selection overlay after keyboard-driven changes
	const handleSelectionChange = useCallback(() => {
		managerRef.current?.getInteractionManager()?.refreshSelection();
	}, []);

	useCanvasKeyboard(containerRef, handleSelectionChange);

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

				// Wire up interaction system with store dependencies
				const store = useSceneStore.getState;
				manager.initInteractions({
					getElements: () => store().elements,
					getElementIds: () => store().elementIds,
					getSelectedIds: () => store().selectedIds,
					selectElement: (id) => store().selectElement(id),
					deselectAll: () => store().deselectAll(),
					selectMultiple: (ids) => store().selectMultiple(ids),
					toggleSelection: (id) => store().toggleSelection(id),
					moveElements: (updates) => store().moveElements(updates),
					resizeElement: (id, size, pos) => store().resizeElement(id, size, pos),
					rotateElement: (id, rotation) => store().rotateElement(id, rotation),
					getSnapEnabled: () => useUIStore.getState().snapToGrid,
				});

				// Apply initial store state
				const { camera, elements, elementIds } = store();
				manager.setCamera(camera);
				manager.syncElements(elements, elementIds);

				const { gridVisible } = useUIStore.getState();
				manager.setGridVisible(gridVisible);
			});

		// Subscribe to element changes: sync Zustand → SceneManager
		let prevElementIds = useSceneStore.getState().elementIds;
		const unsubElements = useSceneStore.subscribe((state) => {
			const mgr = managerRef.current;
			if (!mgr?.initialized) return;

			// Full sync when element list changes (add/remove)
			if (state.elementIds !== prevElementIds) {
				prevElementIds = state.elementIds;
				mgr.syncElements(state.elements, state.elementIds);
				mgr.getInteractionManager()?.refreshSelection();
				return;
			}

			// Incremental update when individual elements change
			for (const id of state.elementIds) {
				const element = state.elements[id];
				if (element) {
					mgr.updateElement(element);
				}
			}
			mgr.getInteractionManager()?.refreshSelection();
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
			unsubElements();
			unsubUI();
			unsubCamera();
			manager.destroy();
			managerRef.current = null;
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="relative h-full w-full overflow-hidden"
			role="application"
			aria-label="Canvas workspace"
		/>
	);
}
