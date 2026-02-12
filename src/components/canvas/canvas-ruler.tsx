'use client';

import { useCallback, useEffect, useRef } from 'react';
import { RulerRenderer } from '@/lib/pixi/ruler-renderer';
import { useSceneStore } from '@/lib/stores/scene-store';

const RULER_SIZE = 24;
const BACKGROUND_COLOR = 0x1e1e2e;
const TICK_COLOR = 0x666666;
const LABEL_COLOR = '#999999';
const CURSOR_COLOR = 0xff4444;

const rendererInstance = new RulerRenderer();

export function CanvasRuler({
	orientation,
	cursorPosition,
}: {
	orientation: 'horizontal' | 'vertical';
	cursorPosition: number | null;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const camera = useSceneStore((s) => s.camera);

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		const length = orientation === 'horizontal' ? rect.width : rect.height;

		// Size canvas to match CSS size at native resolution
		const w = orientation === 'horizontal' ? length * dpr : RULER_SIZE * dpr;
		const h = orientation === 'horizontal' ? RULER_SIZE * dpr : length * dpr;

		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		rendererInstance.render(ctx, {
			orientation,
			length,
			rulerSize: RULER_SIZE,
			cameraX: camera.x,
			cameraY: camera.y,
			zoom: camera.zoom,
			cursorPosition,
			backgroundColor: BACKGROUND_COLOR,
			tickColor: TICK_COLOR,
			labelColor: LABEL_COLOR,
			cursorColor: CURSOR_COLOR,
		});
	}, [orientation, camera, cursorPosition]);

	useEffect(() => {
		draw();
	}, [draw]);

	const style =
		orientation === 'horizontal'
			? { height: `${RULER_SIZE}px`, width: '100%' }
			: { width: `${RULER_SIZE}px`, height: '100%' };

	return <canvas ref={canvasRef} style={style} className="pointer-events-none" />;
}
