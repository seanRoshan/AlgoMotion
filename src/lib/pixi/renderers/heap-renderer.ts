/**
 * Renderer for Heap composite elements.
 *
 * Provides a complete binary tree visualization with an array overlay below.
 * Supports both min-heap and max-heap display. Shows parent-child index
 * relationships and highlights corresponding positions in tree/array views.
 *
 * Node containers are stored for GSAP heapify and swap animations.
 *
 * Spec reference: Section 6.3.1 (Heap)
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

// ── Heap Types ──

export type HeapType = 'min' | 'max';

export interface HeapNodeData {
	index: number;
	value: number;
}

interface NodePosition {
	x: number;
	y: number;
}

// ── Constants ──

const ARRAY_CELL_SIZE = 32;
const ARRAY_GAP = 4;

/**
 * Renderer for Heap composite elements.
 */
export class HeapRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<number, PixiContainer>> = {};
	private nodePositions: Record<string, Map<number, NodePosition>> = {};
	private arrayCellContainers: Record<string, Map<number, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a heap element with tree view and array overlay.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const nodes = (metadata.nodes as unknown as HeapNodeData[]) ?? [];
		const heapType = (metadata.heapType as HeapType) ?? 'max';
		const nodeSize = (metadata.nodeSize as number) ?? 20;
		const levelGap = (metadata.levelGap as number) ?? 60;
		const showArray = (metadata.showArray as boolean) ?? true;
		const showIndices = (metadata.showIndices as boolean) ?? true;
		const highlightedIndices = (metadata.highlightedIndices as number[]) ?? [];
		const swapIndices = (metadata.swapIndices as number[]) ?? [];

		const nodeMap = new Map<number, PixiContainer>();
		const posMap = new Map<number, NodePosition>();
		const arrayMap = new Map<number, PixiContainer>();

		if (nodes.length === 0) {
			this.nodeContainers[element.id] = nodeMap;
			this.nodePositions[element.id] = posMap;
			this.arrayCellContainers[element.id] = arrayMap;
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);

		// Compute tree layout
		const positions = this.computeTreeLayout(nodes.length, nodeSize, levelGap);
		const highlightColor = hexToPixiColor('#3b82f6');
		const swapColor = hexToPixiColor('#f97316');

		// Heap type label
		const typeStyle = new this.pixi.TextStyle({
			fontSize: 10,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor('#9ca3af'),
		});
		const typeText = new this.pixi.Text({
			text: heapType === 'min' ? 'Min-Heap' : 'Max-Heap',
			style: typeStyle,
		});
		typeText.anchor.set(0.5, 1);
		typeText.position.set(element.size.width / 2, -4);
		container.addChild(typeText);

		// Pass 1: Draw edges
		for (let i = 1; i < nodes.length; i++) {
			const parentIdx = Math.floor((i - 1) / 2);
			const parentPos = positions.get(parentIdx);
			const childPos = positions.get(i);
			if (!parentPos || !childPos) continue;

			const edgeG = new this.pixi.Graphics();
			edgeG.moveTo(parentPos.x, parentPos.y + nodeSize);
			edgeG.lineTo(childPos.x, childPos.y - nodeSize);
			edgeG.stroke({ width: style.strokeWidth, color: strokeColor, alpha: 0.5 });
			container.addChild(edgeG);
		}

		// Pass 2: Draw tree nodes
		for (const node of nodes) {
			const pos = positions.get(node.index);
			if (!pos) continue;

			posMap.set(node.index, pos);
			const isHighlighted = highlightedIndices.includes(node.index);
			const isSwapping = swapIndices.includes(node.index);

			const nodeColor = isSwapping ? swapColor : isHighlighted ? highlightColor : fillColor;

			const g = new this.pixi.Graphics();
			g.circle(pos.x, pos.y, nodeSize);
			g.fill({ color: nodeColor });
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
				text: String(node.value),
				style: textStyle,
			});
			valueText.anchor.set(0.5, 0.5);
			valueText.position.set(pos.x, pos.y);
			container.addChild(valueText);

			// Index label below node
			if (showIndices) {
				const idxStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: style.fontFamily,
					fontWeight: '400',
					fill: hexToPixiColor('#9ca3af'),
				});
				const idxText = new this.pixi.Text({
					text: String(node.index),
					style: idxStyle,
				});
				idxText.anchor.set(0.5, 0);
				idxText.position.set(pos.x, pos.y + nodeSize + 2);
				container.addChild(idxText);
			}

			nodeMap.set(node.index, container);
		}

		// Pass 3: Array overlay
		if (showArray) {
			const treeHeight = this.getTreeHeight(nodes.length);
			const arrayY = (treeHeight + 1) * levelGap + nodeSize + 30;
			const totalWidth = nodes.length * (ARRAY_CELL_SIZE + ARRAY_GAP) - ARRAY_GAP;
			const startX = (element.size.width - totalWidth) / 2;

			// "Array:" label
			const arrayLabelStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor('#9ca3af'),
			});
			const arrayLabel = new this.pixi.Text({
				text: 'Array:',
				style: arrayLabelStyle,
			});
			arrayLabel.anchor.set(1, 0.5);
			arrayLabel.position.set(startX - 8, arrayY + ARRAY_CELL_SIZE / 2);
			container.addChild(arrayLabel);

			for (const node of nodes) {
				const cellX = startX + node.index * (ARRAY_CELL_SIZE + ARRAY_GAP);
				const isHighlighted = highlightedIndices.includes(node.index);
				const isSwapping = swapIndices.includes(node.index);
				const cellColor = isSwapping ? swapColor : isHighlighted ? highlightColor : fillColor;

				const cellG = new this.pixi.Graphics();
				cellG.rect(cellX, arrayY, ARRAY_CELL_SIZE, ARRAY_CELL_SIZE);
				cellG.fill({ color: cellColor, alpha: 0.8 });
				cellG.stroke({ width: 1, color: strokeColor });
				container.addChild(cellG);

				// Value in cell
				const cellTextStyle = new this.pixi.TextStyle({
					fontSize: 10,
					fontFamily: style.fontFamily,
					fontWeight: '600',
					fill: hexToPixiColor(style.textColor),
				});
				const cellText = new this.pixi.Text({
					text: String(node.value),
					style: cellTextStyle,
				});
				cellText.anchor.set(0.5, 0.5);
				cellText.position.set(cellX + ARRAY_CELL_SIZE / 2, arrayY + ARRAY_CELL_SIZE / 2);
				container.addChild(cellText);

				// Index below cell
				const cellIdxStyle = new this.pixi.TextStyle({
					fontSize: 7,
					fontFamily: style.fontFamily,
					fontWeight: '400',
					fill: hexToPixiColor('#6b7280'),
				});
				const cellIdx = new this.pixi.Text({
					text: String(node.index),
					style: cellIdxStyle,
				});
				cellIdx.anchor.set(0.5, 0);
				cellIdx.position.set(cellX + ARRAY_CELL_SIZE / 2, arrayY + ARRAY_CELL_SIZE + 2);
				container.addChild(cellIdx);

				arrayMap.set(node.index, container);
			}
		}

		this.nodeContainers[element.id] = nodeMap;
		this.nodePositions[element.id] = posMap;
		this.arrayCellContainers[element.id] = arrayMap;
		return container;
	}

	/**
	 * Get tree node containers for animation targeting.
	 */
	getNodeContainers(elementId: string): Map<number, PixiContainer> | undefined {
		return this.nodeContainers[elementId];
	}

	/**
	 * Get computed tree node positions for animation.
	 */
	getNodePositions(elementId: string): Map<number, NodePosition> | undefined {
		return this.nodePositions[elementId];
	}

	/**
	 * Get array cell containers for animation targeting.
	 */
	getArrayCellContainers(elementId: string): Map<number, PixiContainer> | undefined {
		return this.arrayCellContainers[elementId];
	}

	/**
	 * Compute tree height from node count (0-indexed levels).
	 */
	private getTreeHeight(count: number): number {
		if (count <= 0) return 0;
		return Math.floor(Math.log2(count));
	}

	/**
	 * Compute complete binary tree layout using index-based positioning.
	 * Each level has 2^level nodes, positioned evenly.
	 */
	private computeTreeLayout(
		count: number,
		nodeSize: number,
		levelGap: number,
	): Map<number, NodePosition> {
		const positions = new Map<number, NodePosition>();
		const height = this.getTreeHeight(count);
		const maxWidth = 2 ** height;
		const spacing = nodeSize * 2.5;

		for (let i = 0; i < count; i++) {
			const level = Math.floor(Math.log2(i + 1));
			const levelStart = 2 ** level - 1;
			const posInLevel = i - levelStart;
			const nodesInLevel = 2 ** level;

			// Center nodes within the widest level span
			const levelWidth = maxWidth * spacing;
			const cellWidth = levelWidth / nodesInLevel;
			const x = cellWidth * posInLevel + cellWidth / 2;
			const y = level * levelGap + nodeSize;

			positions.set(i, { x, y });
		}

		return positions;
	}
}
