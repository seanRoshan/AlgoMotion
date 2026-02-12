import type { SceneElement } from '@/types';
import { hexToPixiColor } from './shared';

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

/**
 * Renderer for Queue composite elements.
 * Creates a horizontal FIFO structure with cells and front/rear markers.
 *
 * Rendering order:
 * Pass 1: Cell rects (Graphics) + value texts (Text)
 * Pass 2: FRONT and REAR marker labels
 *
 * Cell containers are stored for GSAP animation targeting.
 */
export class QueueRenderer {
	private pixi: PixiModule;
	private cellContainers: Record<string, PixiContainer[]> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const values = (metadata.values as (number | string)[]) ?? [];
		const cellSize = (metadata.cellSize as number) ?? 48;
		const gap = (metadata.gap as number) ?? 4;
		const front = (metadata.front as number) ?? 0;
		const rear = (metadata.rear as number) ?? values.length - 1;
		const highlightedIndex = (metadata.highlightedIndex as number) ?? -1;
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);
		const cornerRadius = style.cornerRadius;
		const stride = cellSize + gap;

		const cells: PixiContainer[] = [];

		if (values.length === 0) {
			const emptyStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize - 2,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: hexToPixiColor(style.textColor),
			});
			const emptyText = new this.pixi.Text({ text: 'EMPTY', style: emptyStyle });
			emptyText.anchor.set(0.5, 0.5);
			emptyText.position.set(cellSize / 2, cellSize / 2);
			container.addChild(emptyText);

			this.cellContainers[element.id] = cells;
			return container;
		}

		// Pass 1: Cell rects and value texts
		for (let i = 0; i < values.length; i++) {
			const x = i * stride;
			const isHighlighted = i === highlightedIndex;

			const g = new this.pixi.Graphics();
			g.roundRect(x, 0, cellSize, cellSize, cornerRadius);
			g.fill({ color: isHighlighted ? highlightPixi : fillColor });
			g.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(g);

			const textStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: String(style.fontWeight),
				fill: hexToPixiColor(style.textColor),
			});
			const valueText = new this.pixi.Text({
				text: String(values[i]),
				style: textStyle,
			});
			valueText.anchor.set(0.5, 0.5);
			valueText.position.set(x + cellSize / 2, cellSize / 2);
			container.addChild(valueText);

			cells.push(container);
		}

		// Pass 2: FRONT and REAR markers below the cells
		const markerStyle = new this.pixi.TextStyle({
			fontSize: Math.max(10, style.fontSize - 4),
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor(highlightColor),
		});

		const frontText = new this.pixi.Text({ text: 'FRONT', style: markerStyle });
		frontText.anchor.set(0.5, 0);
		frontText.position.set(front * stride + cellSize / 2, cellSize + 4);
		container.addChild(frontText);

		const rearText = new this.pixi.Text({ text: 'REAR', style: markerStyle });
		rearText.anchor.set(0.5, 0);
		rearText.position.set(rear * stride + cellSize / 2, cellSize + 4);
		container.addChild(rearText);

		this.cellContainers[element.id] = cells;
		return container;
	}

	/**
	 * Get cell containers for animation targeting.
	 */
	getCellContainers(elementId: string): PixiContainer[] | undefined {
		return this.cellContainers[elementId];
	}
}
