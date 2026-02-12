/**
 * Renderer for AVL Tree composite elements.
 *
 * Extends the binary tree visualization with:
 * - Balance factor display per node (color-coded: green=balanced, red=unbalanced)
 * - Height tracking per node
 * - Rotation indicator arrows
 *
 * Uses the same hierarchical layout as TreeRenderer but adds AVL-specific
 * metadata overlays. Node containers are stored for GSAP rotation animations.
 *
 * Spec reference: Section 6.3.1 (AVL Tree)
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

// ── AVL Types ──

export interface AvlNodeData {
	id: string;
	value: number;
	parentId: string | null;
	side: 'left' | 'right' | null;
	height: number;
	balanceFactor: number;
}

interface NodePosition {
	x: number;
	y: number;
}

// ── Balance Factor Colors ──

const BF_COLORS = {
	balanced: '#4ade80',
	warning: '#fbbf24',
	unbalanced: '#ef4444',
};

function getBalanceColor(bf: number): string {
	const absBf = Math.abs(bf);
	if (absBf <= 1) return BF_COLORS.balanced;
	if (absBf === 2) return BF_COLORS.warning;
	return BF_COLORS.unbalanced;
}

/**
 * Renderer for AVL Tree composite elements.
 */
export class AvlTreeRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<string, PixiContainer>> = {};
	private nodePositions: Record<string, Map<string, NodePosition>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render an AVL tree element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const rawNodes = (metadata.nodes as unknown as AvlNodeData[]) ?? [];
		const nodeSize = (metadata.nodeSize as number) ?? 20;
		const levelGap = (metadata.levelGap as number) ?? 60;
		const nodeGap = (metadata.nodeGap as number) ?? 30;
		const highlightedNodes = (metadata.highlightedNodes as string[]) ?? [];
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';
		const showBalanceFactor = (metadata.showBalanceFactor as boolean) ?? true;
		const showHeight = (metadata.showHeight as boolean) ?? false;
		const rotationIndicator = (metadata.rotationIndicator as string) ?? '';

		if (rawNodes.length === 0) {
			this.nodeContainers[element.id] = new Map();
			this.nodePositions[element.id] = new Map();
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);

		// Compute layout
		const positions = this.computeLayout(rawNodes, nodeSize, levelGap, nodeGap);
		const nodeMap = new Map<string, PixiContainer>();
		const posMap = new Map<string, NodePosition>();

		// Pass 1: Draw edges
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

		// Pass 2: Draw nodes
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

			// Balance factor badge
			if (showBalanceFactor) {
				const bfColor = getBalanceColor(node.balanceFactor);
				const badgeG = new this.pixi.Graphics();
				badgeG.circle(pos.x + nodeSize + 4, pos.y - nodeSize + 4, 8);
				badgeG.fill({ color: hexToPixiColor(bfColor), alpha: 0.8 });
				container.addChild(badgeG);

				const bfStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: style.fontFamily,
					fontWeight: '700',
					fill: hexToPixiColor('#ffffff'),
				});
				const bfText = new this.pixi.Text({
					text: String(node.balanceFactor),
					style: bfStyle,
				});
				bfText.anchor.set(0.5, 0.5);
				bfText.position.set(pos.x + nodeSize + 4, pos.y - nodeSize + 4);
				container.addChild(bfText);
			}

			// Height label
			if (showHeight) {
				const heightStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: style.fontFamily,
					fontWeight: '400',
					fill: hexToPixiColor('#9ca3af'),
				});
				const heightText = new this.pixi.Text({
					text: `h=${node.height}`,
					style: heightStyle,
				});
				heightText.anchor.set(0.5, 0);
				heightText.position.set(pos.x, pos.y + nodeSize + 4);
				container.addChild(heightText);
			}

			nodeMap.set(node.id, container);
		}

		// Rotation indicator text
		if (rotationIndicator) {
			const rotStyle = new this.pixi.TextStyle({
				fontSize: 12,
				fontFamily: style.fontFamily,
				fontWeight: '700',
				fill: hexToPixiColor('#f97316'),
			});
			const rotText = new this.pixi.Text({
				text: rotationIndicator,
				style: rotStyle,
			});
			rotText.anchor.set(0.5, 0);
			rotText.position.set(element.size.width / 2, -20);
			container.addChild(rotText);
		}

		this.nodeContainers[element.id] = nodeMap;
		this.nodePositions[element.id] = posMap;
		return container;
	}

	/**
	 * Get node containers for animation targeting.
	 */
	getNodeContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.nodeContainers[elementId];
	}

	/**
	 * Get computed node positions for animation.
	 */
	getNodePositions(elementId: string): Map<string, NodePosition> | undefined {
		return this.nodePositions[elementId];
	}

	/**
	 * Compute hierarchical tree layout from flat node list.
	 * Same algorithm as TreeRenderer — centered binary tree layout.
	 */
	private computeLayout(
		nodes: AvlNodeData[],
		nodeSize: number,
		levelGap: number,
		nodeGap: number,
	): Map<string, NodePosition> {
		const positions = new Map<string, NodePosition>();

		// Build adjacency: parentId → children
		const childrenMap = new Map<string, { left?: string; right?: string }>();
		let rootId: string | null = null;

		for (const node of nodes) {
			if (!node.parentId) {
				rootId = node.id;
			} else {
				const siblings = childrenMap.get(node.parentId) ?? {};
				if (node.side === 'left') siblings.left = node.id;
				else siblings.right = node.id;
				childrenMap.set(node.parentId, siblings);
			}
		}

		if (!rootId) return positions;

		// BFS to assign levels
		const levels = new Map<string, number>();
		const queue: string[] = [rootId];
		levels.set(rootId, 0);

		while (queue.length > 0) {
			// biome-ignore lint/style/noNonNullAssertion: guaranteed by length check and prior set
			const current = queue.shift()!;
			const children = childrenMap.get(current);
			// biome-ignore lint/style/noNonNullAssertion: level set before BFS traversal
			const currentLevel = levels.get(current)!;

			if (children?.left) {
				levels.set(children.left, currentLevel + 1);
				queue.push(children.left);
			}
			if (children?.right) {
				levels.set(children.right, currentLevel + 1);
				queue.push(children.right);
			}
		}

		// In-order traversal for x positions
		let xIndex = 0;
		const xPositions = new Map<string, number>();

		const inOrder = (nodeId: string): void => {
			const children = childrenMap.get(nodeId);
			if (children?.left) inOrder(children.left);
			xPositions.set(nodeId, xIndex);
			xIndex++;
			if (children?.right) inOrder(children.right);
		};

		inOrder(rootId);

		// Convert to pixel positions
		const spacing = nodeSize * 2 + nodeGap;
		for (const node of nodes) {
			const xIdx = xPositions.get(node.id);
			const level = levels.get(node.id);
			if (xIdx === undefined || level === undefined) continue;

			positions.set(node.id, {
				x: xIdx * spacing + nodeSize,
				y: level * levelGap + nodeSize,
			});
		}

		return positions;
	}
}
