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

/** Tree node metadata from the store. */
interface TreeNodeData {
	id: string;
	value: number;
	parentId: string | null;
	side: 'left' | 'right' | null;
}

/** Computed position for a tree node. */
interface NodePosition {
	x: number;
	y: number;
}

/**
 * Renderer for Binary Tree composite elements.
 * Computes hierarchical layout from flat node list, renders node circles
 * with value text, and draws edges between parent-child pairs.
 *
 * Node containers are stored for animation targeting — GSAP presets can
 * target individual nodes for traversal, rotation, and insert/delete animations.
 *
 * Spec reference: Section 6.3.1 (Binary Tree), Section 9.3 (Animation Presets)
 */
export class TreeRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<string, PixiContainer>> = {};
	private nodePositions: Record<string, Map<string, NodePosition>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a binary tree element into a Pixi.js container.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const rawNodes = (metadata.nodes as unknown as TreeNodeData[]) ?? [];
		const nodeSize = (metadata.nodeSize as number) ?? 20;
		const levelGap = (metadata.levelGap as number) ?? 60;
		const nodeGap = (metadata.nodeGap as number) ?? 30;
		const highlightedNodes = (metadata.highlightedNodes as string[]) ?? [];
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';

		if (rawNodes.length === 0) {
			this.nodeContainers[element.id] = new Map();
			this.nodePositions[element.id] = new Map();
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);

		// Compute layout positions
		const positions = this.computeLayout(rawNodes, nodeSize, levelGap, nodeGap);
		const nodeMap = new Map<string, PixiContainer>();
		const posMap = new Map<string, NodePosition>();

		// Pass 1: Render all node circles and value texts
		for (const node of rawNodes) {
			const pos = positions.get(node.id);
			if (!pos) continue;

			posMap.set(node.id, pos);
			const isHighlighted = highlightedNodes.includes(node.id);

			// Node circle
			const g = new this.pixi.Graphics();
			g.circle(pos.x, pos.y, nodeSize);
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
			valueText.position.set(pos.x, pos.y);
			container.addChild(valueText);

			nodeMap.set(node.id, container);
		}

		// Pass 2: Draw edges between parent and child nodes
		for (const node of rawNodes) {
			if (!node.parentId) continue;

			const parentPos = positions.get(node.parentId);
			const childPos = positions.get(node.id);
			if (!parentPos || !childPos) continue;

			const edgeG = new this.pixi.Graphics();
			edgeG.moveTo(parentPos.x, parentPos.y + nodeSize);
			edgeG.lineTo(childPos.x, childPos.y - nodeSize);
			edgeG.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(edgeG);
		}

		this.nodeContainers[element.id] = nodeMap;
		this.nodePositions[element.id] = posMap;
		return container;
	}

	/**
	 * Get individual node containers for animation targeting.
	 */
	getNodeContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.nodeContainers[elementId];
	}

	/**
	 * Get computed positions for all nodes.
	 */
	getNodePositions(elementId: string): Map<string, NodePosition> | undefined {
		return this.nodePositions[elementId];
	}

	/**
	 * Compute hierarchical layout positions for a binary tree.
	 * Uses a depth-based spreading algorithm: each level halves the horizontal spread.
	 */
	private computeLayout(
		nodes: TreeNodeData[],
		nodeSize: number,
		levelGap: number,
		nodeGap: number,
	): Map<string, NodePosition> {
		const positions = new Map<string, NodePosition>();
		if (nodes.length === 0) return positions;

		// Build lookup maps
		const nodeById = new Map<string, TreeNodeData>();
		for (const node of nodes) {
			nodeById.set(node.id, node);
		}

		// Find root (parentId === null)
		const root = nodes.find((n) => n.parentId === null);
		if (!root) return positions;

		// Compute depth for each node
		const depths = new Map<string, number>();
		const computeDepth = (nodeId: string, depth: number) => {
			depths.set(nodeId, depth);
			for (const child of nodes) {
				if (child.parentId === nodeId) {
					computeDepth(child.id, depth + 1);
				}
			}
		};
		computeDepth(root.id, 0);

		// Calculate max depth for base spread
		const maxDepth = Math.max(...depths.values());
		const baseSpread = Math.max((nodeSize * 2 + nodeGap) * (1 << maxDepth), nodeGap * 4);

		// Position nodes using recursive halving of spread
		const positionNode = (nodeId: string, x: number, y: number, spread: number) => {
			positions.set(nodeId, { x, y });

			// Find children
			const leftChild = nodes.find((n) => n.parentId === nodeId && n.side === 'left');
			const rightChild = nodes.find((n) => n.parentId === nodeId && n.side === 'right');

			const childSpread = spread / 2;
			if (leftChild) {
				positionNode(leftChild.id, x - childSpread, y + levelGap, childSpread);
			}
			if (rightChild) {
				positionNode(rightChild.id, x + childSpread, y + levelGap, childSpread);
			}
		};

		positionNode(root.id, baseSpread, 0, baseSpread / 2);

		return positions;
	}
}
