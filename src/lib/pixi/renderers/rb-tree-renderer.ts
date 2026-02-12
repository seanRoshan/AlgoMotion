/**
 * Renderer for Red-Black Tree composite elements.
 *
 * Extends binary tree visualization with:
 * - Red/black node coloring with distinct visual treatment
 * - NIL leaf sentinel nodes (small gray squares)
 * - Uncle/parent/grandparent role annotations during fixup
 *
 * Node containers are stored for GSAP recolor and rotation animations.
 *
 * Spec reference: Section 6.3.1 (Red-Black Tree)
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

// ── RB Tree Types ──

export type RbColor = 'red' | 'black';

export type RbRole = 'parent' | 'uncle' | 'grandparent' | 'sibling' | null;

export interface RbNodeData {
	id: string;
	value: number;
	parentId: string | null;
	side: 'left' | 'right' | null;
	color: RbColor;
	isNil: boolean;
	role?: RbRole;
}

interface NodePosition {
	x: number;
	y: number;
}

// ── Colors ──

const RB_COLORS = {
	red: '#ef4444',
	black: '#1f2937',
	nil: '#4b5563',
	redStroke: '#fca5a5',
	blackStroke: '#6b7280',
};

const ROLE_COLORS: Record<string, string> = {
	parent: '#3b82f6',
	uncle: '#f97316',
	grandparent: '#a78bfa',
	sibling: '#22d3ee',
};

/**
 * Renderer for Red-Black Tree composite elements.
 */
export class RbTreeRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<string, PixiContainer>> = {};
	private nodePositions: Record<string, Map<string, NodePosition>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a red-black tree element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const rawNodes = (metadata.nodes as unknown as RbNodeData[]) ?? [];
		const nodeSize = (metadata.nodeSize as number) ?? 20;
		const levelGap = (metadata.levelGap as number) ?? 60;
		const nodeGap = (metadata.nodeGap as number) ?? 30;
		const showNil = (metadata.showNil as boolean) ?? false;
		const highlightedNodes = (metadata.highlightedNodes as string[]) ?? [];

		// Filter NIL nodes unless showNil is true
		const visibleNodes = showNil ? rawNodes : rawNodes.filter((n) => !n.isNil);

		if (visibleNodes.length === 0) {
			this.nodeContainers[element.id] = new Map();
			this.nodePositions[element.id] = new Map();
			return container;
		}

		const strokeColor = hexToPixiColor(style.stroke);

		// Compute layout
		const positions = this.computeLayout(visibleNodes, nodeSize, levelGap, nodeGap);
		const nodeMap = new Map<string, PixiContainer>();
		const posMap = new Map<string, NodePosition>();

		// Pass 1: Draw edges
		for (const node of visibleNodes) {
			if (!node.parentId) continue;
			const parentPos = positions.get(node.parentId);
			const childPos = positions.get(node.id);
			if (!parentPos || !childPos) continue;

			const edgeG = new this.pixi.Graphics();
			const edgeSize = node.isNil ? nodeSize * 0.4 : nodeSize;
			edgeG.moveTo(parentPos.x, parentPos.y + nodeSize);
			edgeG.lineTo(childPos.x, childPos.y - edgeSize);
			edgeG.stroke({ width: style.strokeWidth, color: strokeColor, alpha: 0.6 });
			container.addChild(edgeG);
		}

		// Pass 2: Draw nodes
		for (const node of visibleNodes) {
			const pos = positions.get(node.id);
			if (!pos) continue;

			posMap.set(node.id, pos);
			const isHighlighted = highlightedNodes.includes(node.id);

			if (node.isNil) {
				// NIL sentinel — small gray square
				const nilSize = nodeSize * 0.4;
				const g = new this.pixi.Graphics();
				g.rect(pos.x - nilSize, pos.y - nilSize, nilSize * 2, nilSize * 2);
				g.fill({ color: hexToPixiColor(RB_COLORS.nil), alpha: 0.5 });
				g.stroke({ width: 1, color: strokeColor, alpha: 0.3 });
				container.addChild(g);

				const nilStyle = new this.pixi.TextStyle({
					fontSize: 7,
					fontFamily: style.fontFamily,
					fontWeight: '400',
					fill: hexToPixiColor('#9ca3af'),
				});
				const nilText = new this.pixi.Text({ text: 'NIL', style: nilStyle });
				nilText.anchor.set(0.5, 0.5);
				nilText.position.set(pos.x, pos.y);
				container.addChild(nilText);
			} else {
				// Regular node — colored circle
				const nodeColor = node.color === 'red' ? RB_COLORS.red : RB_COLORS.black;
				const nodeStroke = node.color === 'red' ? RB_COLORS.redStroke : RB_COLORS.blackStroke;

				const g = new this.pixi.Graphics();
				g.circle(pos.x, pos.y, nodeSize);
				g.fill({
					color: isHighlighted ? hexToPixiColor('#3b82f6') : hexToPixiColor(nodeColor),
				});
				g.stroke({
					width: isHighlighted ? 3 : style.strokeWidth,
					color: hexToPixiColor(nodeStroke),
				});
				container.addChild(g);

				// Value text
				const textStyle = new this.pixi.TextStyle({
					fontSize: style.fontSize,
					fontFamily: style.fontFamily,
					fontWeight: String(style.fontWeight),
					fill: hexToPixiColor('#ffffff'),
				});
				const valueText = new this.pixi.Text({
					text: String(node.value),
					style: textStyle,
				});
				valueText.anchor.set(0.5, 0.5);
				valueText.position.set(pos.x, pos.y);
				container.addChild(valueText);

				// Role annotation
				if (node.role) {
					const roleColor = ROLE_COLORS[node.role] ?? '#9ca3af';
					const roleStyle = new this.pixi.TextStyle({
						fontSize: 8,
						fontFamily: style.fontFamily,
						fontWeight: '600',
						fill: hexToPixiColor(roleColor),
					});
					const roleText = new this.pixi.Text({
						text: node.role[0].toUpperCase(),
						style: roleStyle,
					});
					roleText.anchor.set(0.5, 0.5);
					roleText.position.set(pos.x + nodeSize + 8, pos.y - nodeSize + 4);
					container.addChild(roleText);
				}
			}

			nodeMap.set(node.id, container);
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
	 * Compute hierarchical tree layout.
	 */
	private computeLayout(
		nodes: RbNodeData[],
		nodeSize: number,
		levelGap: number,
		nodeGap: number,
	): Map<string, NodePosition> {
		const positions = new Map<string, NodePosition>();

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
