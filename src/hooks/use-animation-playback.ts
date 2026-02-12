import { useCallback, useEffect, useRef } from 'react';
import { buildAnimationTimeline } from '@/lib/gsap/algorithm-animations';
import type { SceneManager } from '@/lib/pixi/scene-manager';
import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';

/**
 * Bridges Zustand timeline store ↔ GSAP ↔ Pixi.js SceneManager.
 *
 * When playback status changes to 'playing', builds a GSAP timeline from
 * the current scene elements and plays it. The GSAP timeline directly
 * mutates Pixi display objects — React is NOT involved during playback.
 *
 * On pause/stop, the GSAP timeline is paused/rewound accordingly.
 * currentTime is synced back to the timeline store on each GSAP update.
 */
export function useAnimationPlayback(managerRef: React.RefObject<SceneManager | null>) {
	const timelineRef = useRef<gsap.core.Timeline | null>(null);
	const activeTemplateRef = useRef<string | null>(null);

	const rebuildTimeline = useCallback(() => {
		// Kill existing timeline
		if (timelineRef.current) {
			timelineRef.current.kill();
			timelineRef.current = null;
		}

		const manager = managerRef.current;
		if (!manager?.initialized) return null;

		const { elements, elementIds } = useSceneStore.getState();
		if (elementIds.length === 0) return null;

		const orderedElements = elementIds.map((id) => elements[id]).filter(Boolean);

		// Determine template type from element types
		const templateId = orderedElements[0]?.type === 'arrayCell' ? 'bubble-sort' : 'generic';

		const getDisplayObject = (id: string) => {
			const obj = manager.getDisplayObject(id);
			if (!obj) return null;
			// Return the real Pixi Container — GSAP will animate its x/y/alpha directly
			return obj as unknown as { x: number; y: number; alpha: number };
		};

		const tl = buildAnimationTimeline(templateId, orderedElements, getDisplayObject);
		if (!tl) return null;

		// Sync currentTime back to store on each update
		tl.eventCallback('onUpdate', () => {
			useTimelineStore.getState().seek(tl.time());
		});

		// When animation completes, keep elements in final position.
		// Use 'completed' status (not 'stopped') so elements don't rewind.
		tl.eventCallback('onComplete', () => {
			const { loop } = useTimelineStore.getState().playback;
			if (loop) {
				tl.restart();
			} else {
				useTimelineStore.getState().setStatus('completed');
			}
		});

		// Set timeline duration in the store
		useTimelineStore.getState().setDuration(tl.totalDuration());

		timelineRef.current = tl;
		activeTemplateRef.current = templateId;
		return tl;
	}, [managerRef]);

	// React to playback state changes
	useEffect(() => {
		const unsub = useTimelineStore.subscribe((state, prev) => {
			const { status, speed, currentTime } = state.playback;
			const prevStatus = prev.playback.status;

			if (status === prevStatus) {
				// Status unchanged — check for speed or currentTime changes
				if (speed !== prev.playback.speed && timelineRef.current) {
					timelineRef.current.timeScale(speed);
				}
				// External seek (step buttons, scrubber drag) while not playing
				if (
					currentTime !== prev.playback.currentTime &&
					status !== 'playing' &&
					timelineRef.current
				) {
					timelineRef.current.seek(currentTime);
				}
				return;
			}

			if (status === 'playing') {
				let tl = timelineRef.current;

				// Build timeline if we don't have one
				if (!tl) {
					tl = rebuildTimeline();
				}

				if (tl) {
					tl.timeScale(speed);
					if (prevStatus === 'stopped' || prevStatus === 'idle' || prevStatus === 'completed') {
						tl.restart();
					} else {
						tl.play();
					}
				}
			} else if (status === 'paused') {
				timelineRef.current?.pause();
			} else if (status === 'completed') {
				// Animation finished naturally — keep elements in final position
				timelineRef.current?.pause();
			} else if (status === 'stopped') {
				// Explicit user stop — rewind to beginning
				if (timelineRef.current) {
					timelineRef.current.pause();
					timelineRef.current.seek(0);
				}
				useTimelineStore.getState().seek(0);
			}
		});

		return () => {
			unsub();
			if (timelineRef.current) {
				timelineRef.current.kill();
				timelineRef.current = null;
			}
		};
	}, [rebuildTimeline]);

	// Rebuild timeline when elements change (e.g., new template loaded)
	useEffect(() => {
		let prevElementIds = useSceneStore.getState().elementIds;

		const unsub = useSceneStore.subscribe((state) => {
			if (state.elementIds !== prevElementIds) {
				prevElementIds = state.elementIds;
				// Kill existing timeline — a new one will be built on next play
				if (timelineRef.current) {
					timelineRef.current.kill();
					timelineRef.current = null;
				}
				activeTemplateRef.current = null;
			}
		});

		return unsub;
	}, []);
}
