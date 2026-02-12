/**
 * Auto-Layout Engine — wraps ELK.js to compute graph and tree layouts.
 *
 * Converts AlgoMotion's SceneElement/Connection model to ELK's ElkNode/ElkEdge,
 * runs layout algorithms (layered, force, stress, radial), and returns
 * new positions for each node. Supports pinning nodes to fixed positions,
 * layout presets, and animated transitions via GSAP.
 *
 * Spec reference: Section 4 (Graph Layout), Section 6.3.1 (Auto-layout)
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode, LayoutOptions } from 'elkjs/lib/elk-api';

// ── Layout Types ──

export type LayoutAlgorithm = 'layered' | 'force' | 'stress' | 'radial' | 'random';

export type LayoutDirection = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

export type EdgeRouting = 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';

export interface LayoutPreset {
	name: string;
	algorithm: LayoutAlgorithm;
	options: LayoutEngineOptions;
}

export interface LayoutEngineOptions {
	algorithm?: LayoutAlgorithm;
	direction?: LayoutDirection;
	edgeRouting?: EdgeRouting;
	nodeSpacing?: number;
	layerSpacing?: number;
	animate?: boolean;
	animationDuration?: number;
}

/** Input node for layout computation. */
export interface LayoutNode {
	id: string;
	width: number;
	height: number;
	x?: number;
	y?: number;
}

/** Input edge for layout computation. */
export interface LayoutEdge {
	id: string;
	sourceId: string;
	targetId: string;
}

/** Computed position result from layout. */
export interface LayoutResult {
	nodePositions: Record<string, { x: number; y: number }>;
	edgeBendPoints?: Record<string, Array<{ x: number; y: number }>>;
}

// ── ELK Algorithm IDs ──

const ALGORITHM_MAP: Record<LayoutAlgorithm, string> = {
	layered: 'org.eclipse.elk.layered',
	force: 'org.eclipse.elk.force',
	stress: 'org.eclipse.elk.stress',
	radial: 'org.eclipse.elk.radial',
	random: 'org.eclipse.elk.random',
};

// ── Layout Presets ──

export const LAYOUT_PRESETS: Record<string, LayoutPreset> = {
	compact: {
		name: 'Compact',
		algorithm: 'layered',
		options: {
			algorithm: 'layered',
			direction: 'DOWN',
			nodeSpacing: 20,
			layerSpacing: 30,
		},
	},
	spread: {
		name: 'Spread',
		algorithm: 'layered',
		options: {
			algorithm: 'layered',
			direction: 'DOWN',
			nodeSpacing: 60,
			layerSpacing: 80,
		},
	},
	horizontal: {
		name: 'Horizontal',
		algorithm: 'layered',
		options: {
			algorithm: 'layered',
			direction: 'RIGHT',
			nodeSpacing: 40,
			layerSpacing: 60,
		},
	},
	forceDirected: {
		name: 'Force Directed',
		algorithm: 'force',
		options: {
			algorithm: 'force',
			nodeSpacing: 50,
		},
	},
	radial: {
		name: 'Radial',
		algorithm: 'radial',
		options: {
			algorithm: 'radial',
			nodeSpacing: 40,
		},
	},
};

// ── Layout Engine ──

export class LayoutEngine {
	private elk: InstanceType<typeof ELK>;
	private pinnedNodes: Set<string> = new Set();
	private enabled = true;

	constructor() {
		this.elk = new ELK();
	}

	/**
	 * Compute layout for a set of nodes and edges.
	 */
	async computeLayout(
		nodes: LayoutNode[],
		edges: LayoutEdge[],
		options: LayoutEngineOptions = {},
	): Promise<LayoutResult> {
		if (nodes.length === 0) {
			return { nodePositions: {} };
		}

		const algorithm = options.algorithm ?? 'layered';
		const layoutOptions = this.buildLayoutOptions(algorithm, options);

		// Build ELK graph
		const elkGraph: ElkNode = {
			id: 'root',
			layoutOptions,
			children: nodes.map((node) => ({
				id: node.id,
				width: node.width,
				height: node.height,
				// Pin nodes that are marked as fixed
				...(this.pinnedNodes.has(node.id) && node.x !== undefined && node.y !== undefined
					? {
							x: node.x,
							y: node.y,
							layoutOptions: {
								'org.eclipse.elk.position': `(${node.x},${node.y})`,
								'elk.position': `(${node.x},${node.y})`,
							},
						}
					: {}),
			})),
			edges: edges.map(
				(edge): ElkExtendedEdge => ({
					id: edge.id,
					sources: [edge.sourceId],
					targets: [edge.targetId],
				}),
			),
		};

		const result = await this.elk.layout(elkGraph);
		return this.extractPositions(result);
	}

	/**
	 * Apply a layout preset by name.
	 */
	async applyPreset(
		presetName: string,
		nodes: LayoutNode[],
		edges: LayoutEdge[],
	): Promise<LayoutResult> {
		const preset = LAYOUT_PRESETS[presetName];
		if (!preset) {
			return this.computeLayout(nodes, edges);
		}
		return this.computeLayout(nodes, edges, preset.options);
	}

	/**
	 * Pin a node so it stays at its current position during layout.
	 */
	pinNode(nodeId: string): void {
		this.pinnedNodes.add(nodeId);
	}

	/**
	 * Unpin a node so it participates in layout computation.
	 */
	unpinNode(nodeId: string): void {
		this.pinnedNodes.delete(nodeId);
	}

	/**
	 * Check if a node is pinned.
	 */
	isNodePinned(nodeId: string): boolean {
		return this.pinnedNodes.has(nodeId);
	}

	/**
	 * Unpin all nodes.
	 */
	unpinAll(): void {
		this.pinnedNodes.clear();
	}

	/**
	 * Get all pinned node IDs.
	 */
	getPinnedNodes(): string[] {
		return [...this.pinnedNodes];
	}

	/**
	 * Enable or disable auto-layout.
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	/**
	 * Check if auto-layout is enabled.
	 */
	isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Get available layout preset names.
	 */
	getPresetNames(): string[] {
		return Object.keys(LAYOUT_PRESETS);
	}

	/**
	 * Terminate the ELK Web Worker.
	 */
	dispose(): void {
		this.elk.terminateWorker();
	}

	// ── Private Helpers ──

	private buildLayoutOptions(
		algorithm: LayoutAlgorithm,
		options: LayoutEngineOptions,
	): LayoutOptions {
		const layoutOptions: LayoutOptions = {
			'elk.algorithm': ALGORITHM_MAP[algorithm],
		};

		if (options.direction) {
			layoutOptions['elk.direction'] = options.direction;
		}

		if (options.edgeRouting) {
			layoutOptions['elk.edgeRouting'] = options.edgeRouting;
		}

		if (options.nodeSpacing !== undefined) {
			layoutOptions['elk.spacing.nodeNode'] = String(options.nodeSpacing);
		}

		if (options.layerSpacing !== undefined) {
			layoutOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = String(options.layerSpacing);
		}

		return layoutOptions;
	}

	private extractPositions(elkResult: ElkNode): LayoutResult {
		const nodePositions: Record<string, { x: number; y: number }> = {};
		const edgeBendPoints: Record<string, Array<{ x: number; y: number }>> = {};

		if (elkResult.children) {
			for (const child of elkResult.children) {
				nodePositions[child.id] = {
					x: child.x ?? 0,
					y: child.y ?? 0,
				};
			}
		}

		if (elkResult.edges) {
			for (const edge of elkResult.edges) {
				const extEdge = edge as ElkExtendedEdge;
				if (extEdge.sections) {
					const points: Array<{ x: number; y: number }> = [];
					for (const section of extEdge.sections) {
						points.push(section.startPoint);
						if (section.bendPoints) {
							points.push(...section.bendPoints);
						}
						points.push(section.endPoint);
					}
					edgeBendPoints[edge.id] = points;
				}
			}
		}

		return { nodePositions, edgeBendPoints };
	}
}
