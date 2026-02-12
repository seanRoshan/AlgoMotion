/**
 * Renderer for Number Line composite elements.
 *
 * Draws a horizontal line with tick marks, configurable range
 * and intervals, point markers, and range highlights.
 *
 * Spec reference: Section 6.3.3 (Math composites)
 */

import type { SceneElement } from '@/types';
import { hexToPixiColor } from './shared';

// ── Pixi.js DI interfaces ──

interface PixiContainer {
	addChild(...children: unknown[]): void;
	removeChildren(): void;
	destroy(options?: { children: boolean }): void;
	position: { set(x: number, y: number): void; x: number; y: number };
	alpha: number;
	angle: number;
	visible: boolean;
	label: string;
	cullable: boolean;
	children: unknown[];
}

interface PixiGraphics {
	clear(): PixiGraphics;
	rect(x: number, y: number, w: number, h: number): PixiGraphics;
	roundRect(x: number, y: number, w: number, h: number, r: number): PixiGraphics;
	circle(x: number, y: number, r: number): PixiGraphics;
	fill(opts: { color: number; alpha?: number } | number): PixiGraphics;
	stroke(opts: { width: number; color: number; alpha?: number }): PixiGraphics;
	moveTo(x: number, y: number): PixiGraphics;
	lineTo(x: number, y: number): PixiGraphics;
	bezierCurveTo(
		cp1x: number,
		cp1y: number,
		cp2x: number,
		cp2y: number,
		x: number,
		y: number,
	): PixiGraphics;
	poly(points: number[]): PixiGraphics;
	closePath(): PixiGraphics;
	destroy(): void;
}

interface PixiText {
	text: string;
	style: Record<string, unknown>;
	anchor: { set(x: number, y: number): void };
	position: { set(x: number, y: number): void };
	visible: boolean;
	destroy(): void;
}

interface PixiModule {
	Container: new () => PixiContainer;
	Graphics: new () => PixiGraphics;
	Text: new (opts: { text: string; style: unknown }) => PixiText;
	TextStyle: new (opts: Record<string, unknown>) => Record<string, unknown>;
}

// ── Types ──

export interface NumberLineMarker {
	value: number;
	label?: string;
	color?: string;
}

export interface NumberLineRange {
	from: number;
	to: number;
	color?: string;
}

// ── Constants ──

const TICK_HEIGHT = 8;
const MARKER_RADIUS = 5;

/**
 * Renderer for Number Line composite elements.
 */
export class NumberLineRenderer {
	private pixi: PixiModule;
	private markerContainers: Record<string, Map<number, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a number line element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const min = (metadata.min as number) ?? -10;
		const max = (metadata.max as number) ?? 10;
		const interval = (metadata.interval as number) ?? 1;
		const markers = (metadata.markers as unknown as NumberLineMarker[]) ?? [];
		const ranges = (metadata.ranges as unknown as NumberLineRange[]) ?? [];
		const showLabels = (metadata.showLabels as boolean) ?? true;

		const { width } = element.size;
		const padding = 30;
		const lineWidth = width - padding * 2;
		const lineY = element.size.height / 2;
		const range = max - min;

		const toPixelX = (val: number): number => padding + ((val - min) / range) * lineWidth;

		const strokeColor = hexToPixiColor(style.stroke);
		const axisColor = hexToPixiColor('#e5e7eb');

		// Range highlights (draw first, behind everything)
		for (const r of ranges) {
			const fromX = toPixelX(r.from);
			const toX = toPixelX(r.to);
			const rangeColor = hexToPixiColor(r.color ?? '#3b82f6');

			const rangeG = new this.pixi.Graphics();
			rangeG.rect(fromX, lineY - 4, toX - fromX, 8);
			rangeG.fill({ color: rangeColor, alpha: 0.3 });
			container.addChild(rangeG);
		}

		// Main line
		const lineG = new this.pixi.Graphics();
		lineG.moveTo(padding, lineY);
		lineG.lineTo(padding + lineWidth, lineY);
		lineG.stroke({ width: 2, color: axisColor });
		container.addChild(lineG);

		// Tick marks and labels
		const labelStyle = new this.pixi.TextStyle({
			fontSize: 8,
			fontFamily: style.fontFamily,
			fontWeight: '400',
			fill: hexToPixiColor('#9ca3af'),
		});

		for (let v = min; v <= max; v += interval) {
			const px = toPixelX(v);

			const tickG = new this.pixi.Graphics();
			tickG.moveTo(px, lineY - TICK_HEIGHT / 2);
			tickG.lineTo(px, lineY + TICK_HEIGHT / 2);
			tickG.stroke({ width: 1, color: axisColor });
			container.addChild(tickG);

			if (showLabels) {
				const lbl = new this.pixi.Text({ text: String(v), style: labelStyle });
				lbl.anchor.set(0.5, 0);
				lbl.position.set(px, lineY + TICK_HEIGHT / 2 + 2);
				container.addChild(lbl);
			}
		}

		// Markers
		const markerMap = new Map<number, PixiContainer>();
		for (let i = 0; i < markers.length; i++) {
			const marker = markers[i];
			const px = toPixelX(marker.value);
			const markerColor = hexToPixiColor(marker.color ?? '#3b82f6');

			const markerG = new this.pixi.Graphics();
			markerG.circle(px, lineY, MARKER_RADIUS);
			markerG.fill({ color: markerColor });
			markerG.stroke({ width: 1, color: strokeColor });
			container.addChild(markerG);

			if (marker.label) {
				const mlStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: style.fontFamily,
					fontWeight: '600',
					fill: markerColor,
				});
				const mlText = new this.pixi.Text({ text: marker.label, style: mlStyle });
				mlText.anchor.set(0.5, 1);
				mlText.position.set(px, lineY - MARKER_RADIUS - 2);
				container.addChild(mlText);
			}

			markerMap.set(i, container);
		}

		this.markerContainers[element.id] = markerMap;
		return container;
	}

	/**
	 * Get marker containers for animation targeting.
	 */
	getMarkerContainers(elementId: string): Map<number, PixiContainer> | undefined {
		return this.markerContainers[elementId];
	}
}
