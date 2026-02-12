import type { SceneElement } from '@/types';
import { hexToPixiColor } from './shared';

/**
 * Minimal Pixi.js type interfaces for dependency injection.
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

/** Graph node metadata. */
interface GraphNodeData {
	id: string;
	value: string;
	x: number;
	y: number;
}

/** Graph edge metadata. */
interface GraphEdgeData {
	from: string;
	to: string;
	weight?: number;
	directed?: boolean;
}

/**
 * Renderer for Graph composite elements.
 * Renders graph nodes as circles with labels at pre-computed positions,
 * and draws edges (lines) between connected nodes.
 *
 * Node and edge display objects are stored for animation targeting — GSAP
 * presets can access them for BFS/DFS wavefront, path highlighting, etc.
 *
 * Spec reference: Section 6.3.1 (Graph), Section 6.3.3 (Graph algorithms)
 */
export class GraphRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<string, PixiContainer>> = {};
	private edgeGraphics: Record<string, Map<string, PixiGraphics>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a graph element into a Pixi.js container.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const rawNodes = (metadata.nodes as unknown as GraphNodeData[]) ?? [];
		const rawEdges = (metadata.edges as unknown as GraphEdgeData[]) ?? [];
		const nodeSize = (metadata.nodeSize as number) ?? 20;
		const highlightedNodes = (metadata.highlightedNodes as string[]) ?? [];
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';

		if (rawNodes.length === 0) {
			this.nodeContainers[element.id] = new Map();
			this.edgeGraphics[element.id] = new Map();
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);

		// Build position lookup
		const positions = new Map<string, { x: number; y: number }>();
		for (const node of rawNodes) {
			positions.set(node.id, { x: node.x, y: node.y });
		}

		const nodeMap = new Map<string, PixiContainer>();
		const edgeMap = new Map<string, PixiGraphics>();

		// Pass 1: Render all node circles and value texts
		for (const node of rawNodes) {
			const isHighlighted = highlightedNodes.includes(node.id);

			// Node circle
			const g = new this.pixi.Graphics();
			g.circle(node.x, node.y, nodeSize);
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
				text: String(node.value),
				style: textStyle,
			});
			valueText.anchor.set(0.5, 0.5);
			valueText.position.set(node.x, node.y);
			container.addChild(valueText);

			nodeMap.set(node.id, container);
		}

		// Pass 2: Draw edges between connected nodes
		for (const edge of rawEdges) {
			const fromPos = positions.get(edge.from);
			const toPos = positions.get(edge.to);
			if (!fromPos || !toPos) continue;

			const edgeG = new this.pixi.Graphics();
			edgeG.moveTo(fromPos.x, fromPos.y);
			edgeG.lineTo(toPos.x, toPos.y);
			edgeG.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(edgeG);

			const edgeKey = `${edge.from}->${edge.to}`;
			edgeMap.set(edgeKey, edgeG);
		}

		this.nodeContainers[element.id] = nodeMap;
		this.edgeGraphics[element.id] = edgeMap;
		return container;
	}

	/**
	 * Get node containers for animation targeting.
	 */
	getNodeContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.nodeContainers[elementId];
	}

	/**
	 * Get edge graphics for animation targeting.
	 */
	getEdgeGraphics(elementId: string): Map<string, PixiGraphics> | undefined {
		return this.edgeGraphics[elementId];
	}
}
