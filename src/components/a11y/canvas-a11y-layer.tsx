/**
 * Accessible description layer for the Pixi.js canvas.
 *
 * Creates a parallel DOM that mirrors the canvas scene graph
 * with ARIA attributes for screen reader navigation.
 * Positioned absolutely behind the canvas, invisible visually
 * but accessible to assistive technologies.
 *
 * Spec reference: Section 11 (Accessibility — Parallel DOM)
 */

'use client';

import { useSceneStore } from '@/lib/stores/scene-store';
import { useTimelineStore } from '@/lib/stores/timeline-store';

export function CanvasA11yLayer() {
	const elements = useSceneStore((s) => s.elements);
	const elementIds = useSceneStore((s) => s.elementIds);
	const selectedIds = useSceneStore((s) => s.selectedIds);
	const status = useTimelineStore((s) => s.playback.status);
	const currentTime = useTimelineStore((s) => s.playback.currentTime);

	return (
		<section className="sr-only" aria-label="Canvas scene description" aria-live="polite">
			<p>
				Animation {status}. {elementIds.length} elements on canvas.
				{selectedIds.length > 0 && ` ${selectedIds.length} selected.`}
				{status === 'playing' && ` Time: ${currentTime.toFixed(1)}s.`}
			</p>
			<ul aria-label="Scene elements">
				{elementIds.map((id) => {
					const el = elements[id];
					if (!el) return null;
					const isSelected = selectedIds.includes(id);
					return (
						<li key={id}>
							{el.type} at ({Math.round(el.position.x)}, {Math.round(el.position.y)})
							{el.label ? `: ${el.label}` : ''}
							{isSelected ? ' (selected)' : ''}
						</li>
					);
				})}
			</ul>
		</section>
	);
}
