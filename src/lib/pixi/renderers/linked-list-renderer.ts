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

interface LinkedListNodeData {
	id: string;
	value: number | string;
}

/**
 * Renderer for Linked List composite elements.
 * Creates a horizontal chain of node rectangles connected by arrows,
 * terminated with a null indicator.
 *
 * Node containers are stored in a Map for GSAP animation targeting.
 *
 * Rendering order (two-pass for predictable Graphics ordering):
 * Pass 1: Node rects (Graphics) + value texts (Text)
 * Pass 2: Arrow lines (Graphics) between adjacent nodes
 * Pass 3: Null terminator (Graphics)
 */
export class LinkedListRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<string, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const nodes = (metadata.nodes as unknown as LinkedListNodeData[]) ?? [];
		const nodeWidth = (metadata.nodeWidth as number) ?? 60;
		const nodeHeight = (metadata.nodeHeight as number) ?? 40;
		const arrowGap = (metadata.arrowGap as number) ?? 30;
		const highlightedNodes = (metadata.highlightedNodes as string[]) ?? [];
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);
		const cornerRadius = style.cornerRadius;
		const stride = nodeWidth + arrowGap;

		const nodeMap = new Map<string, PixiContainer>();

		if (nodes.length === 0) {
			this.nodeContainers[element.id] = nodeMap;
			return container;
		}

		// Pass 1: Node rects and value texts
		for (let i = 0; i < nodes.length; i++) {
			const x = i * stride;
			const isHighlighted = highlightedNodes.includes(nodes[i].id);

			const g = new this.pixi.Graphics();
			g.roundRect(x, 0, nodeWidth, nodeHeight, cornerRadius);
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
				text: String(nodes[i].value),
				style: textStyle,
			});
			valueText.anchor.set(0.5, 0.5);
			valueText.position.set(x + nodeWidth / 2, nodeHeight / 2);
			container.addChild(valueText);

			nodeMap.set(nodes[i].id, container);
		}

		// Pass 2: Arrow lines between adjacent nodes
		for (let i = 0; i < nodes.length - 1; i++) {
			const startX = i * stride + nodeWidth;
			const endX = (i + 1) * stride;
			const midY = nodeHeight / 2;

			const arrow = new this.pixi.Graphics();
			arrow.moveTo(startX, midY);
			arrow.lineTo(endX, midY);
			arrow.stroke({ width: style.strokeWidth, color: strokeColor });

			// Arrowhead triangle
			const headSize = 6;
			arrow.poly([
				endX,
				midY,
				endX - headSize,
				midY - headSize / 2,
				endX - headSize,
				midY + headSize / 2,
			]);
			arrow.fill({ color: strokeColor });

			container.addChild(arrow);
		}

		// Pass 3: Null terminator after the last node
		const lastEndX = (nodes.length - 1) * stride + nodeWidth;
		const midY = nodeHeight / 2;
		const nullG = new this.pixi.Graphics();
		nullG.moveTo(lastEndX, midY);
		nullG.lineTo(lastEndX + arrowGap * 0.4, midY);
		nullG.stroke({ width: style.strokeWidth, color: strokeColor });
		// Ground symbol (two short perpendicular lines)
		const gx = lastEndX + arrowGap * 0.5;
		nullG.moveTo(gx, midY - 6);
		nullG.lineTo(gx, midY + 6);
		nullG.stroke({ width: style.strokeWidth, color: strokeColor });
		container.addChild(nullG);

		this.nodeContainers[element.id] = nodeMap;
		return container;
	}

	getNodeContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.nodeContainers[elementId];
	}
}
