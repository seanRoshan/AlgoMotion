import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { GraphRenderer } from './graph-renderer';
import { DEFAULT_ELEMENT_STYLE } from './shared';

/**
 * Mock Pixi.js module using regular function constructors for Vitest 4.x.
 */
function createMockPixi() {
	function MockContainer(this: Record<string, unknown>) {
		const children: unknown[] = [];
		this.addChild = vi.fn((...args: unknown[]) => children.push(...args));
		this.removeChildren = vi.fn();
		this.destroy = vi.fn();
		this.position = { set: vi.fn(), x: 0, y: 0 };
		this.alpha = 1;
		this.angle = 0;
		this.visible = true;
		this.label = '';
		this.cullable = false;
		this.children = children;
	}

	function MockGraphics(this: Record<string, unknown>) {
		this.clear = vi.fn().mockReturnThis();
		this.rect = vi.fn().mockReturnThis();
		this.roundRect = vi.fn().mockReturnThis();
		this.circle = vi.fn().mockReturnThis();
		this.fill = vi.fn().mockReturnThis();
		this.stroke = vi.fn().mockReturnThis();
		this.moveTo = vi.fn().mockReturnThis();
		this.lineTo = vi.fn().mockReturnThis();
		this.bezierCurveTo = vi.fn().mockReturnThis();
		this.poly = vi.fn().mockReturnThis();
		this.closePath = vi.fn().mockReturnThis();
		this.destroy = vi.fn();
	}

	function MockText(this: Record<string, unknown>, opts: { text: string; style: unknown }) {
		this.text = opts.text;
		this.style = opts.style;
		this.anchor = { set: vi.fn() };
		this.position = { set: vi.fn() };
		this.visible = true;
		this.destroy = vi.fn();
	}

	function MockTextStyle(_opts: Record<string, unknown>) {
		return { ..._opts };
	}

	return {
		Container: vi.fn().mockImplementation(MockContainer),
		Graphics: vi.fn().mockImplementation(MockGraphics),
		Text: vi.fn().mockImplementation(MockText),
		TextStyle: vi.fn().mockImplementation(MockTextStyle),
	};
}

/**
 * Graph metadata format:
 * - nodes: array of { id, value, x, y } objects (pre-computed positions)
 * - edges: array of { from, to, weight?, directed? } objects
 * - nodeSize: radius of each node circle
 */
function makeGraphElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'graph-1',
		type: 'graphNode',
		position: { x: 0, y: 0 },
		size: { width: 400, height: 300 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label: '',
		style: {
			...DEFAULT_ELEMENT_STYLE,
			fill: '#2a2a4a',
			stroke: '#6366f1',
			fontSize: 14,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: 600,
			textColor: '#e0e0f0',
		},
		metadata: {
			nodes: [
				{ id: 'A', value: 'A', x: 50, y: 50 },
				{ id: 'B', value: 'B', x: 150, y: 50 },
				{ id: 'C', value: 'C', x: 100, y: 150 },
				{ id: 'D', value: 'D', x: 200, y: 150 },
			],
			edges: [
				{ from: 'A', to: 'B', weight: 4 },
				{ from: 'A', to: 'C', weight: 2 },
				{ from: 'B', to: 'D', weight: 3 },
				{ from: 'C', to: 'D', weight: 1 },
			],
			nodeSize: 20,
			directed: false,
			highlightedNodes: [],
			highlightedEdges: [],
			highlightColor: '#3b82f6',
		},
		...overrides,
	};
}

describe('GraphRenderer', () => {
	let pixi: ReturnType<typeof createMockPixi>;
	let renderer: GraphRenderer;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new GraphRenderer(pixi as never);
	});

	it('creates a container with node circles, value texts, and edges', () => {
		const element = makeGraphElement();
		const container = renderer.render(element);

		expect(container.addChild).toHaveBeenCalled();
		// 4 nodes: each gets Graphics (circle) + Text (label) = 8
		// 4 edges: each gets Graphics (line) = 4
		// Total: 12 children
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(12);
	});

	it('renders node circles at specified positions', () => {
		const element = makeGraphElement();
		renderer.render(element);

		// 4 node circles + 4 edge lines = 8 Graphics total
		expect(pixi.Graphics).toHaveBeenCalledTimes(8);

		const graphicsCalls = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// First 4 are node circles
		for (let i = 0; i < 4; i++) {
			const g = graphicsCalls[i].value;
			expect(g.circle).toHaveBeenCalled();
		}
	});

	it('renders value text inside each node', () => {
		const element = makeGraphElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		const values = ['A', 'B', 'C', 'D'];

		expect(textCalls.length).toBe(4);
		for (let i = 0; i < 4; i++) {
			expect(textCalls[i][0].text).toBe(values[i]);
		}
	});

	it('draws edges between connected nodes', () => {
		const element = makeGraphElement();
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// Edges are indices 4-7 (after 4 node circles)
		for (let i = 4; i < 8; i++) {
			const edgeG = graphicsResults[i].value;
			expect(edgeG.moveTo).toHaveBeenCalled();
			expect(edgeG.lineTo).toHaveBeenCalled();
		}
	});

	it('handles empty graph', () => {
		const element = makeGraphElement({
			metadata: {
				nodes: [],
				edges: [],
				nodeSize: 20,
				directed: false,
				highlightedNodes: [],
				highlightedEdges: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);

		expect(container.addChild).not.toHaveBeenCalled();
	});

	it('applies highlight color to highlighted nodes', () => {
		const element = makeGraphElement({
			metadata: {
				nodes: [
					{ id: 'A', value: 'A', x: 50, y: 50 },
					{ id: 'B', value: 'B', x: 150, y: 50 },
				],
				edges: [{ from: 'A', to: 'B' }],
				nodeSize: 20,
				directed: false,
				highlightedNodes: ['B'],
				highlightedEdges: [],
				highlightColor: '#10b981',
			},
		});
		renderer.render(element);

		const graphicsCalls = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;

		// Node A: normal fill
		expect(graphicsCalls[0].value.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });
		// Node B: highlighted
		expect(graphicsCalls[1].value.fill).toHaveBeenCalledWith({ color: 0x10b981 });
	});

	it('returns node containers for animation targeting', () => {
		const element = makeGraphElement();
		renderer.render(element);

		const nodeContainers = renderer.getNodeContainers('graph-1');
		expect(nodeContainers).toBeDefined();
		expect(nodeContainers?.size).toBe(4);
		expect(nodeContainers?.has('A')).toBe(true);
	});

	it('returns edge graphics for animation targeting', () => {
		const element = makeGraphElement();
		renderer.render(element);

		const edgeGraphics = renderer.getEdgeGraphics('graph-1');
		expect(edgeGraphics).toBeDefined();
		expect(edgeGraphics?.size).toBe(4);
		expect(edgeGraphics?.has('A->B')).toBe(true);
	});

	it('handles single node with no edges', () => {
		const element = makeGraphElement({
			metadata: {
				nodes: [{ id: 'A', value: 'A', x: 100, y: 100 }],
				edges: [],
				nodeSize: 20,
				directed: false,
				highlightedNodes: [],
				highlightedEdges: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);

		// 1 node circle + 1 value text = 2 children
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(2);
	});
});
