/**
 * Renderer for Matrix composite elements.
 *
 * Draws a grid of cells with bracket notation, row/column
 * highlighting, and element-level animation targets.
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

// ── Constants ──

const CELL_SIZE = 40;
const CELL_GAP = 2;
const BRACKET_WIDTH = 6;
const BRACKET_COLOR = '#e5e7eb';

/**
 * Renderer for Matrix composite elements.
 */
export class MatrixRenderer {
	private pixi: PixiModule;
	private cellContainers: Record<string, Map<string, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a matrix element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const data = (metadata.data as number[][]) ?? [];
		const rows = data.length;
		const cols = rows > 0 ? data[0].length : 0;
		const highlightedRow = (metadata.highlightedRow as number) ?? -1;
		const highlightedCol = (metadata.highlightedCol as number) ?? -1;
		const highlightedCell = (metadata.highlightedCell as number[]) ?? [];
		const label = (metadata.label as string) ?? '';

		const cellMap = new Map<string, PixiContainer>();

		if (rows === 0 || cols === 0) {
			this.cellContainers[element.id] = cellMap;
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightColor = hexToPixiColor('#3b82f6');
		const bracketPixi = hexToPixiColor(BRACKET_COLOR);

		const totalW = cols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
		const totalH = rows * (CELL_SIZE + CELL_GAP) - CELL_GAP;
		const startX = BRACKET_WIDTH + 8;
		const startY = label ? 20 : 0;

		// Label
		if (label) {
			const labelStyle = new this.pixi.TextStyle({
				fontSize: 11,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor('#e5e7eb'),
			});
			const labelText = new this.pixi.Text({ text: label, style: labelStyle });
			labelText.anchor.set(0.5, 1);
			labelText.position.set(startX + totalW / 2, startY - 4);
			container.addChild(labelText);
		}

		// Left bracket
		const lBracket = new this.pixi.Graphics();
		lBracket.moveTo(startX - 2, startY);
		lBracket.lineTo(startX - BRACKET_WIDTH, startY);
		lBracket.lineTo(startX - BRACKET_WIDTH, startY + totalH);
		lBracket.lineTo(startX - 2, startY + totalH);
		lBracket.stroke({ width: 2, color: bracketPixi });
		container.addChild(lBracket);

		// Right bracket
		const rBracket = new this.pixi.Graphics();
		const rightX = startX + totalW + 2;
		rBracket.moveTo(rightX, startY);
		rBracket.lineTo(rightX + BRACKET_WIDTH, startY);
		rBracket.lineTo(rightX + BRACKET_WIDTH, startY + totalH);
		rBracket.lineTo(rightX, startY + totalH);
		rBracket.stroke({ width: 2, color: bracketPixi });
		container.addChild(rBracket);

		// Cells
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const cellX = startX + c * (CELL_SIZE + CELL_GAP);
				const cellY = startY + r * (CELL_SIZE + CELL_GAP);

				const isRowHL = r === highlightedRow;
				const isColHL = c === highlightedCol;
				const isCellHL =
					highlightedCell.length === 2 && highlightedCell[0] === r && highlightedCell[1] === c;

				const cellColor = isCellHL || isRowHL || isColHL ? highlightColor : fillColor;

				const cellG = new this.pixi.Graphics();
				cellG.rect(cellX, cellY, CELL_SIZE, CELL_SIZE);
				cellG.fill({ color: cellColor, alpha: isCellHL ? 1 : isRowHL || isColHL ? 0.6 : 0.8 });
				cellG.stroke({ width: 1, color: strokeColor, alpha: 0.5 });
				container.addChild(cellG);

				// Value
				const valStyle = new this.pixi.TextStyle({
					fontSize: style.fontSize,
					fontFamily: style.fontFamily,
					fontWeight: String(style.fontWeight),
					fill: hexToPixiColor(style.textColor),
				});
				const valText = new this.pixi.Text({
					text: String(data[r][c]),
					style: valStyle,
				});
				valText.anchor.set(0.5, 0.5);
				valText.position.set(cellX + CELL_SIZE / 2, cellY + CELL_SIZE / 2);
				container.addChild(valText);

				cellMap.set(`${r},${c}`, container);
			}
		}

		this.cellContainers[element.id] = cellMap;
		return container;
	}

	/**
	 * Get cell containers for animation targeting.
	 */
	getCellContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.cellContainers[elementId];
	}
}
