/**
 * Renderer for Trie composite elements.
 *
 * Visualizes a prefix tree with character labels on edges
 * and end-of-word markers on terminal nodes. Supports hierarchical
 * layout with variable-width subtrees.
 *
 * Node containers are stored for GSAP character-by-character animations.
 *
 * Spec reference: Section 6.3.1 (Trie)
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

// ── Trie Types ──

export interface TrieNodeData {
	id: string;
	parentId: string | null;
	character: string;
	isEndOfWord: boolean;
	depth: number;
}

interface NodePosition {
	x: number;
	y: number;
}

// ── Constants ──

const END_OF_WORD_COLOR = '#4ade80';
const EDGE_LABEL_COLOR = '#e5e7eb';

/**
 * Renderer for Trie composite elements.
 */
export class TrieRenderer {
	private pixi: PixiModule;
	private nodeContainers: Record<string, Map<string, PixiContainer>> = {};
	private nodePositions: Record<string, Map<string, NodePosition>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a trie element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const nodes = (metadata.nodes as unknown as TrieNodeData[]) ?? [];
		const nodeSize = (metadata.nodeSize as number) ?? 16;
		const levelGap = (metadata.levelGap as number) ?? 55;
		const nodeGap = (metadata.nodeGap as number) ?? 25;
		const highlightedNodes = (metadata.highlightedNodes as string[]) ?? [];
		const highlightedPath = (metadata.highlightedPath as string[]) ?? [];

		const nodeMap = new Map<string, PixiContainer>();
		const posMap = new Map<string, NodePosition>();

		if (nodes.length === 0) {
			this.nodeContainers[element.id] = nodeMap;
			this.nodePositions[element.id] = posMap;
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightColor = hexToPixiColor('#3b82f6');
		const pathColor = hexToPixiColor('#f97316');
		const endColor = hexToPixiColor(END_OF_WORD_COLOR);

		// Compute layout
		const positions = this.computeLayout(nodes, nodeSize, levelGap, nodeGap);

		// Build path set for edge highlighting
		const pathSet = new Set(highlightedPath);

		// Pass 1: Draw edges with character labels
		for (const node of nodes) {
			if (!node.parentId) continue;
			const parentPos = positions.get(node.parentId);
			const childPos = positions.get(node.id);
			if (!parentPos || !childPos) continue;

			const isPathEdge = pathSet.has(node.parentId) && pathSet.has(node.id);
			const edgeColor = isPathEdge ? pathColor : strokeColor;

			const edgeG = new this.pixi.Graphics();
			edgeG.moveTo(parentPos.x, parentPos.y + nodeSize);
			edgeG.lineTo(childPos.x, childPos.y - nodeSize);
			edgeG.stroke({
				width: isPathEdge ? style.strokeWidth + 1 : style.strokeWidth,
				color: edgeColor,
				alpha: isPathEdge ? 1 : 0.5,
			});
			container.addChild(edgeG);

			// Character label on edge
			const midX = (parentPos.x + childPos.x) / 2;
			const midY = (parentPos.y + childPos.y) / 2;
			const charStyle = new this.pixi.TextStyle({
				fontSize: 11,
				fontFamily: style.fontFamily,
				fontWeight: '700',
				fill: isPathEdge ? pathColor : hexToPixiColor(EDGE_LABEL_COLOR),
			});
			const charText = new this.pixi.Text({
				text: node.character,
				style: charStyle,
			});
			charText.anchor.set(0.5, 0.5);
			charText.position.set(midX + 8, midY);
			container.addChild(charText);
		}

		// Pass 2: Draw nodes
		for (const node of nodes) {
			const pos = positions.get(node.id);
			if (!pos) continue;

			posMap.set(node.id, pos);
			const isHighlighted = highlightedNodes.includes(node.id);
			const isOnPath = pathSet.has(node.id);

			let nodeColor = fillColor;
			if (isHighlighted) nodeColor = highlightColor;
			else if (isOnPath) nodeColor = pathColor;

			const g = new this.pixi.Graphics();
			g.circle(pos.x, pos.y, nodeSize);
			g.fill({ color: nodeColor });
			g.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(g);

			// End-of-word marker — inner ring
			if (node.isEndOfWord) {
				const markerG = new this.pixi.Graphics();
				markerG.circle(pos.x, pos.y, nodeSize * 0.6);
				markerG.stroke({ width: 2, color: endColor });
				container.addChild(markerG);
			}

			// Root label
			if (!node.parentId) {
				const rootStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: style.fontFamily,
					fontWeight: '600',
					fill: hexToPixiColor('#9ca3af'),
				});
				const rootText = new this.pixi.Text({
					text: 'root',
					style: rootStyle,
				});
				rootText.anchor.set(0.5, 1);
				rootText.position.set(pos.x, pos.y - nodeSize - 2);
				container.addChild(rootText);
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
	 * Compute trie layout using subtree width calculation.
	 * Each node's x position is centered over its children.
	 */
	private computeLayout(
		nodes: TrieNodeData[],
		nodeSize: number,
		levelGap: number,
		nodeGap: number,
	): Map<string, NodePosition> {
		const positions = new Map<string, NodePosition>();

		// Build children map
		const childrenMap = new Map<string, string[]>();
		let rootId: string | null = null;

		for (const node of nodes) {
			if (!node.parentId) {
				rootId = node.id;
			} else {
				const children = childrenMap.get(node.parentId) ?? [];
				children.push(node.id);
				childrenMap.set(node.parentId, children);
			}
		}

		if (!rootId) return positions;

		// Calculate subtree widths
		const spacing = nodeSize * 2 + nodeGap;
		const widths = new Map<string, number>();

		const calcWidth = (nodeId: string): number => {
			const children = childrenMap.get(nodeId);
			if (!children || children.length === 0) {
				widths.set(nodeId, spacing);
				return spacing;
			}
			const total = children.reduce((sum, cid) => sum + calcWidth(cid), 0);
			widths.set(nodeId, total);
			return total;
		};

		calcWidth(rootId);

		// Assign positions using widths
		const assign = (nodeId: string, x: number, level: number): void => {
			positions.set(nodeId, {
				x,
				y: level * levelGap + nodeSize,
			});

			const children = childrenMap.get(nodeId);
			if (!children) return;

			const totalWidth = widths.get(nodeId) ?? spacing;
			let currentX = x - totalWidth / 2;

			for (const childId of children) {
				const childWidth = widths.get(childId) ?? spacing;
				assign(childId, currentX + childWidth / 2, level + 1);
				currentX += childWidth;
			}
		};

		assign(rootId, 0, 0);

		return positions;
	}
}
