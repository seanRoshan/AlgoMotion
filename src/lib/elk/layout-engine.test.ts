/**
 * Tests for LayoutEngine — ELK.js auto-layout integration.
 *
 * Covers: layout computation, algorithms, presets, pinning, enable/disable,
 * edge bend points, empty graphs, and disposal.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	LAYOUT_PRESETS,
	type LayoutEdge,
	LayoutEngine,
	type LayoutEngineOptions,
	type LayoutNode,
} from './layout-engine';

// ── Mock ELK.js ──

const mockLayout = vi.fn();
const mockTerminateWorker = vi.fn();

vi.mock('elkjs/lib/elk.bundled.js', () => {
	return {
		default: class MockELK {
			layout = mockLayout;
			terminateWorker = mockTerminateWorker;
		},
	};
});

// ── Test Helpers ──

function makeNodes(count: number, size = 40): LayoutNode[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `node-${i}`,
		width: size,
		height: size,
		x: i * 100,
		y: i * 100,
	}));
}

function makeEdges(pairs: [number, number][]): LayoutEdge[] {
	return pairs.map(([from, to], i) => ({
		id: `edge-${i}`,
		sourceId: `node-${from}`,
		targetId: `node-${to}`,
	}));
}

function mockLayoutResult(nodes: LayoutNode[]) {
	return {
		id: 'root',
		children: nodes.map((n, i) => ({
			id: n.id,
			x: (i + 1) * 50,
			y: (i + 1) * 30,
			width: n.width,
			height: n.height,
		})),
		edges: [],
	};
}

// ── Tests ──

describe('LayoutEngine', () => {
	let engine: LayoutEngine;

	beforeEach(() => {
		vi.clearAllMocks();
		engine = new LayoutEngine();
	});

	afterEach(() => {
		engine.dispose();
	});

	// ── Basic Layout ──

	describe('computeLayout', () => {
		it('computes positions for nodes', async () => {
			const nodes = makeNodes(3);
			const edges = makeEdges([
				[0, 1],
				[1, 2],
			]);

			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			const result = await engine.computeLayout(nodes, edges);

			expect(result.nodePositions).toBeDefined();
			expect(Object.keys(result.nodePositions)).toHaveLength(3);
			expect(result.nodePositions['node-0']).toEqual({ x: 50, y: 30 });
			expect(result.nodePositions['node-1']).toEqual({ x: 100, y: 60 });
			expect(result.nodePositions['node-2']).toEqual({ x: 150, y: 90 });
		});

		it('returns empty positions for empty nodes', async () => {
			const result = await engine.computeLayout([], []);

			expect(result.nodePositions).toEqual({});
			expect(mockLayout).not.toHaveBeenCalled();
		});

		it('passes correct ELK graph structure to layout', async () => {
			const nodes = makeNodes(2);
			const edges = makeEdges([[0, 1]]);

			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, edges);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'root',
					children: expect.arrayContaining([
						expect.objectContaining({ id: 'node-0', width: 40, height: 40 }),
						expect.objectContaining({ id: 'node-1', width: 40, height: 40 }),
					]),
					edges: expect.arrayContaining([
						expect.objectContaining({
							id: 'edge-0',
							sources: ['node-0'],
							targets: ['node-1'],
						}),
					]),
				}),
			);
		});

		it('handles nodes without edges', async () => {
			const nodes = makeNodes(2);

			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			const result = await engine.computeLayout(nodes, []);

			expect(Object.keys(result.nodePositions)).toHaveLength(2);
		});
	});

	// ── Layout Algorithms ──

	describe('layout algorithms', () => {
		it('uses layered algorithm by default', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, []);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.layered',
					}),
				}),
			);
		});

		it('uses force algorithm when specified', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], { algorithm: 'force' });

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.force',
					}),
				}),
			);
		});

		it('uses stress algorithm when specified', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], { algorithm: 'stress' });

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.stress',
					}),
				}),
			);
		});

		it('uses radial algorithm when specified', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], { algorithm: 'radial' });

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.radial',
					}),
				}),
			);
		});

		it('uses random algorithm when specified', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], { algorithm: 'random' });

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.random',
					}),
				}),
			);
		});
	});

	// ── Layout Options ──

	describe('layout options', () => {
		it('sets direction for layered layout', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], {
				algorithm: 'layered',
				direction: 'RIGHT',
			});

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.direction': 'RIGHT',
					}),
				}),
			);
		});

		it('sets edge routing', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], {
				edgeRouting: 'ORTHOGONAL',
			});

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.edgeRouting': 'ORTHOGONAL',
					}),
				}),
			);
		});

		it('sets node spacing', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], {
				nodeSpacing: 60,
			});

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.spacing.nodeNode': '60',
					}),
				}),
			);
		});

		it('sets layer spacing', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, [], {
				layerSpacing: 80,
			});

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.layered.spacing.nodeNodeBetweenLayers': '80',
					}),
				}),
			);
		});

		it('combines multiple options', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			const options: LayoutEngineOptions = {
				algorithm: 'layered',
				direction: 'LEFT',
				edgeRouting: 'SPLINES',
				nodeSpacing: 50,
				layerSpacing: 70,
			};

			await engine.computeLayout(nodes, [], options);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.layered',
						'elk.direction': 'LEFT',
						'elk.edgeRouting': 'SPLINES',
						'elk.spacing.nodeNode': '50',
						'elk.layered.spacing.nodeNodeBetweenLayers': '70',
					}),
				}),
			);
		});
	});

	// ── Presets ──

	describe('presets', () => {
		it('applies compact preset', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.applyPreset('compact', nodes, []);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.layered',
						'elk.direction': 'DOWN',
						'elk.spacing.nodeNode': '20',
						'elk.layered.spacing.nodeNodeBetweenLayers': '30',
					}),
				}),
			);
		});

		it('applies forceDirected preset', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.applyPreset('forceDirected', nodes, []);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.force',
						'elk.spacing.nodeNode': '50',
					}),
				}),
			);
		});

		it('applies horizontal preset', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.applyPreset('horizontal', nodes, []);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.direction': 'RIGHT',
					}),
				}),
			);
		});

		it('falls back to default for unknown preset', async () => {
			const nodes = makeNodes(2);
			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.applyPreset('nonexistent', nodes, []);

			expect(mockLayout).toHaveBeenCalledWith(
				expect.objectContaining({
					layoutOptions: expect.objectContaining({
						'elk.algorithm': 'org.eclipse.elk.layered',
					}),
				}),
			);
		});

		it('returns preset names', () => {
			const names = engine.getPresetNames();
			expect(names).toContain('compact');
			expect(names).toContain('spread');
			expect(names).toContain('horizontal');
			expect(names).toContain('forceDirected');
			expect(names).toContain('radial');
		});

		it('all presets have required fields', () => {
			for (const [, preset] of Object.entries(LAYOUT_PRESETS)) {
				expect(preset.name).toBeTruthy();
				expect(preset.algorithm).toBeTruthy();
				expect(preset.options).toBeDefined();
				expect(preset.options.algorithm).toBe(preset.algorithm);
			}
		});
	});

	// ── Node Pinning ──

	describe('node pinning', () => {
		it('pins and unpins nodes', () => {
			engine.pinNode('node-0');
			expect(engine.isNodePinned('node-0')).toBe(true);
			expect(engine.isNodePinned('node-1')).toBe(false);

			engine.unpinNode('node-0');
			expect(engine.isNodePinned('node-0')).toBe(false);
		});

		it('returns pinned nodes list', () => {
			engine.pinNode('node-0');
			engine.pinNode('node-2');
			const pinned = engine.getPinnedNodes();
			expect(pinned).toContain('node-0');
			expect(pinned).toContain('node-2');
			expect(pinned).toHaveLength(2);
		});

		it('unpins all nodes', () => {
			engine.pinNode('node-0');
			engine.pinNode('node-1');
			engine.unpinAll();
			expect(engine.getPinnedNodes()).toHaveLength(0);
		});

		it('passes pinned node positions to ELK', async () => {
			const nodes = makeNodes(2);
			engine.pinNode('node-0');

			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, []);

			const elkGraph = mockLayout.mock.calls[0][0];
			const pinnedChild = elkGraph.children.find((c: { id: string }) => c.id === 'node-0');
			expect(pinnedChild).toBeDefined();
			expect(pinnedChild.x).toBe(0);
			expect(pinnedChild.y).toBe(0);
			expect(pinnedChild.layoutOptions).toBeDefined();
		});

		it('does not pin nodes without position data', async () => {
			const nodes: LayoutNode[] = [{ id: 'node-0', width: 40, height: 40 }];
			engine.pinNode('node-0');

			mockLayout.mockResolvedValueOnce(mockLayoutResult(nodes));

			await engine.computeLayout(nodes, []);

			const elkGraph = mockLayout.mock.calls[0][0];
			const child = elkGraph.children.find((c: { id: string }) => c.id === 'node-0');
			expect(child.layoutOptions).toBeUndefined();
		});
	});

	// ── Enable/Disable ──

	describe('enable/disable', () => {
		it('is enabled by default', () => {
			expect(engine.isEnabled()).toBe(true);
		});

		it('can be disabled and re-enabled', () => {
			engine.setEnabled(false);
			expect(engine.isEnabled()).toBe(false);

			engine.setEnabled(true);
			expect(engine.isEnabled()).toBe(true);
		});
	});

	// ── Edge Bend Points ──

	describe('edge bend points', () => {
		it('extracts edge bend points from ELK result', async () => {
			const nodes = makeNodes(2);

			mockLayout.mockResolvedValueOnce({
				id: 'root',
				children: nodes.map((n) => ({
					id: n.id,
					x: 0,
					y: 0,
					width: n.width,
					height: n.height,
				})),
				edges: [
					{
						id: 'edge-0',
						sources: ['node-0'],
						targets: ['node-1'],
						sections: [
							{
								id: 'section-0',
								startPoint: { x: 0, y: 0 },
								endPoint: { x: 100, y: 100 },
								bendPoints: [
									{ x: 50, y: 0 },
									{ x: 50, y: 100 },
								],
							},
						],
					},
				],
			});

			const result = await engine.computeLayout(nodes, makeEdges([[0, 1]]));

			expect(result.edgeBendPoints).toBeDefined();
			expect(result.edgeBendPoints?.['edge-0']).toHaveLength(4);
			expect(result.edgeBendPoints?.['edge-0']?.[0]).toEqual({ x: 0, y: 0 });
			expect(result.edgeBendPoints?.['edge-0']?.[3]).toEqual({ x: 100, y: 100 });
		});

		it('handles edges without sections', async () => {
			const nodes = makeNodes(2);

			mockLayout.mockResolvedValueOnce({
				id: 'root',
				children: nodes.map((n) => ({
					id: n.id,
					x: 0,
					y: 0,
					width: n.width,
					height: n.height,
				})),
				edges: [
					{
						id: 'edge-0',
						sources: ['node-0'],
						targets: ['node-1'],
					},
				],
			});

			const result = await engine.computeLayout(nodes, makeEdges([[0, 1]]));

			expect(result.edgeBendPoints?.['edge-0']).toBeUndefined();
		});
	});

	// ── Disposal ──

	describe('dispose', () => {
		it('terminates ELK worker on dispose', () => {
			engine.dispose();
			expect(mockTerminateWorker).toHaveBeenCalled();
		});
	});

	// ── Nodes with missing positions ──

	describe('result extraction', () => {
		it('defaults to 0,0 for nodes without position in result', async () => {
			const nodes = makeNodes(1);

			mockLayout.mockResolvedValueOnce({
				id: 'root',
				children: [
					{
						id: 'node-0',
						width: 40,
						height: 40,
						// x and y are undefined
					},
				],
				edges: [],
			});

			const result = await engine.computeLayout(nodes, []);

			expect(result.nodePositions['node-0']).toEqual({ x: 0, y: 0 });
		});

		it('handles result with no children', async () => {
			const nodes = makeNodes(1);

			mockLayout.mockResolvedValueOnce({
				id: 'root',
				edges: [],
			});

			const result = await engine.computeLayout(nodes, []);

			expect(result.nodePositions).toEqual({});
		});
	});
});
