/**
 * Renderer for Coordinate Plane composite elements.
 *
 * Draws X/Y axes with grid, labels, and supports plotting
 * points, lines, and curves. Configurable range and scale.
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

export interface PlotPoint {
	x: number;
	y: number;
	label?: string;
	color?: string;
}

export interface PlotLine {
	points: Array<{ x: number; y: number }>;
	color?: string;
	width?: number;
}

// ── Constants ──

const GRID_COLOR = '#374151';
const AXIS_COLOR = '#e5e7eb';
const LABEL_COLOR = '#9ca3af';

/**
 * Renderer for Coordinate Plane composite elements.
 */
export class CoordinatePlaneRenderer {
	private pixi: PixiModule;
	private pointContainers: Record<string, Map<number, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a coordinate plane element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const xMin = (metadata.xMin as number) ?? -5;
		const xMax = (metadata.xMax as number) ?? 5;
		const yMin = (metadata.yMin as number) ?? -5;
		const yMax = (metadata.yMax as number) ?? 5;
		const showGrid = (metadata.showGrid as boolean) ?? true;
		const showLabels = (metadata.showLabels as boolean) ?? true;
		const points = (metadata.points as unknown as PlotPoint[]) ?? [];
		const lines = (metadata.lines as unknown as PlotLine[]) ?? [];
		const title = (metadata.title as string) ?? '';

		const { width, height } = element.size;
		const padding = 30;
		const plotW = width - padding * 2;
		const plotH = height - padding * 2;

		const xRange = xMax - xMin;
		const yRange = yMax - yMin;

		const toPixelX = (x: number): number => padding + ((x - xMin) / xRange) * plotW;
		const toPixelY = (y: number): number => padding + ((yMax - y) / yRange) * plotH;

		const strokeColor = hexToPixiColor(style.stroke);
		const axisPixi = hexToPixiColor(AXIS_COLOR);
		const gridPixi = hexToPixiColor(GRID_COLOR);

		// Grid lines
		if (showGrid) {
			const gridG = new this.pixi.Graphics();
			for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
				const px = toPixelX(x);
				gridG.moveTo(px, padding);
				gridG.lineTo(px, padding + plotH);
			}
			for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
				const py = toPixelY(y);
				gridG.moveTo(padding, py);
				gridG.lineTo(padding + plotW, py);
			}
			gridG.stroke({ width: 1, color: gridPixi, alpha: 0.3 });
			container.addChild(gridG);
		}

		// Axes
		const axesG = new this.pixi.Graphics();
		// X axis (y=0)
		if (yMin <= 0 && yMax >= 0) {
			const y0 = toPixelY(0);
			axesG.moveTo(padding, y0);
			axesG.lineTo(padding + plotW, y0);
		}
		// Y axis (x=0)
		if (xMin <= 0 && xMax >= 0) {
			const x0 = toPixelX(0);
			axesG.moveTo(x0, padding);
			axesG.lineTo(x0, padding + plotH);
		}
		axesG.stroke({ width: 2, color: axisPixi });
		container.addChild(axesG);

		// Axis labels
		if (showLabels) {
			const labelStyle = new this.pixi.TextStyle({
				fontSize: 8,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: hexToPixiColor(LABEL_COLOR),
			});

			for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
				if (x === 0) continue;
				const lbl = new this.pixi.Text({ text: String(x), style: labelStyle });
				lbl.anchor.set(0.5, 0);
				lbl.position.set(toPixelX(x), toPixelY(0) + 4);
				container.addChild(lbl);
			}
			for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
				if (y === 0) continue;
				const lbl = new this.pixi.Text({ text: String(y), style: labelStyle });
				lbl.anchor.set(1, 0.5);
				lbl.position.set(toPixelX(0) - 4, toPixelY(y));
				container.addChild(lbl);
			}
		}

		// Lines
		for (const line of lines) {
			if (line.points.length < 2) continue;
			const lineColor = hexToPixiColor(line.color ?? style.stroke);
			const lineG = new this.pixi.Graphics();
			lineG.moveTo(toPixelX(line.points[0].x), toPixelY(line.points[0].y));
			for (let i = 1; i < line.points.length; i++) {
				lineG.lineTo(toPixelX(line.points[i].x), toPixelY(line.points[i].y));
			}
			lineG.stroke({ width: line.width ?? 2, color: lineColor });
			container.addChild(lineG);
		}

		// Points
		const pointMap = new Map<number, PixiContainer>();
		for (let i = 0; i < points.length; i++) {
			const pt = points[i];
			const px = toPixelX(pt.x);
			const py = toPixelY(pt.y);
			const ptColor = hexToPixiColor(pt.color ?? '#3b82f6');

			const ptG = new this.pixi.Graphics();
			ptG.circle(px, py, 4);
			ptG.fill({ color: ptColor });
			ptG.stroke({ width: 1, color: strokeColor });
			container.addChild(ptG);

			if (pt.label) {
				const ptStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: style.fontFamily,
					fontWeight: '600',
					fill: ptColor,
				});
				const ptText = new this.pixi.Text({ text: pt.label, style: ptStyle });
				ptText.anchor.set(0, 1);
				ptText.position.set(px + 6, py - 2);
				container.addChild(ptText);
			}

			pointMap.set(i, container);
		}

		// Title
		if (title) {
			const titleStyle = new this.pixi.TextStyle({
				fontSize: 11,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor('#e5e7eb'),
			});
			const titleText = new this.pixi.Text({ text: title, style: titleStyle });
			titleText.anchor.set(0.5, 1);
			titleText.position.set(width / 2, padding - 8);
			container.addChild(titleText);
		}

		this.pointContainers[element.id] = pointMap;
		return container;
	}

	/**
	 * Get point containers for animation targeting.
	 */
	getPointContainers(elementId: string): Map<number, PixiContainer> | undefined {
		return this.pointContainers[elementId];
	}
}
