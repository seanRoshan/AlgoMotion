import type { SceneElement } from '@/types';
import { hexToPixiColor } from './shared';

/**
 * Minimal Pixi.js type interfaces for dependency injection.
 * Matches the PixiModule interface in element-renderer.ts.
 */
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
 * Renderer for Array composite elements.
 * Creates a container with individual cell sub-containers, each containing
 * a background graphic, value text, and optional index label.
 *
 * Cell containers are stored for animation targeting — GSAP presets can
 * access individual cells to animate swaps, shifts, highlights, etc.
 *
 * Spec reference: Section 6.3.1 (Composites), Section 9.3 (Animation Presets)
 */
export class ArrayRenderer {
	private pixi: PixiModule;
	private cellContainers: Record<string, PixiContainer[]> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render an array element into a Pixi.js container.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const values = (metadata.values as number[]) ?? [];
		const cellSize = (metadata.cellSize as number) ?? 48;
		const gap = (metadata.gap as number) ?? 4;
		const showIndices = metadata.showIndices !== false;
		const highlightedIndices = (metadata.highlightedIndices as number[]) ?? [];
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);
		const cornerRadius = style.cornerRadius;

		const cells: PixiContainer[] = [];

		// Pass 1: Cell backgrounds and value texts
		for (let i = 0; i < values.length; i++) {
			const x = i * (cellSize + gap);
			const isHighlighted = highlightedIndices.includes(i);

			// Cell background
			const g = new this.pixi.Graphics();
			g.roundRect(x, 0, cellSize, cellSize, cornerRadius);
			g.fill({ color: isHighlighted ? highlightPixi : fillColor });
			g.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(g);

			// Value text
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

		// Pass 2: Index labels (rendered on top of all cells)
		if (showIndices) {
			for (let i = 0; i < values.length; i++) {
				const x = i * (cellSize + gap);
				const indexStyle = new this.pixi.TextStyle({
					fontSize: Math.max(10, style.fontSize - 4),
					fontFamily: style.fontFamily,
					fontWeight: '400',
					fill: hexToPixiColor(style.textColor),
				});
				const indexText = new this.pixi.Text({
					text: String(i),
					style: indexStyle,
				});
				indexText.anchor.set(0.5, 0);
				indexText.position.set(x + cellSize / 2, cellSize + 4);
				container.addChild(indexText);
			}
		}

		this.cellContainers[element.id] = cells;
		return container;
	}

	/**
	 * Get individual cell containers for animation targeting.
	 */
	getCellContainers(elementId: string): PixiContainer[] | undefined {
		return this.cellContainers[elementId];
	}

	/**
	 * Calculate the total width of an array element.
	 */
	static calculateWidth(count: number, cellSize: number, gap: number): number {
		if (count === 0) return 0;
		return count * cellSize + (count - 1) * gap;
	}
}
