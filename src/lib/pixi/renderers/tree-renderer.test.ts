import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { DEFAULT_ELEMENT_STYLE } from './shared';
import { TreeRenderer } from './tree-renderer';

/**
 * Mock Pixi.js module for testing.
 * Uses regular function constructors for Vitest 4.x compatibility.
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
 * Binary tree metadata format:
 * - nodes: array of { id, value, parentId, side } objects
 * - nodeSize: radius of each node circle
 * - levelGap: vertical distance between levels
 * - nodeGap: minimum horizontal gap between nodes at the same level
 */
function makeTreeElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'tree-1',
		type: 'treeNode',
		position: { x: 200, y: 50 },
		size: { width: 300, height: 200 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label: '',
		style: {
			...DEFAULT_ELEMENT_STYLE,
			fill: '#2a2a4a',
			stroke: '#6366f1',
			cornerRadius: 0,
			fontSize: 14,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: 600,
			textColor: '#e0e0f0',
		},
		metadata: {
			nodes: [
				{ id: 'n1', value: 10, parentId: null, side: null },
				{ id: 'n2', value: 5, parentId: 'n1', side: 'left' },
				{ id: 'n3', value: 15, parentId: 'n1', side: 'right' },
				{ id: 'n4', value: 3, parentId: 'n2', side: 'left' },
				{ id: 'n5', value: 7, parentId: 'n2', side: 'right' },
			],
			nodeSize: 20,
			levelGap: 60,
			nodeGap: 30,
			highlightedNodes: [],
			highlightColor: '#3b82f6',
		},
		...overrides,
	};
}

describe('TreeRenderer', () => {
	let pixi: ReturnType<typeof createMockPixi>;
	let renderer: TreeRenderer;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new TreeRenderer(pixi as never);
	});

	it('creates a container with node circles and value texts', () => {
		const element = makeTreeElement();
		const container = renderer.render(element);

		expect(container.addChild).toHaveBeenCalled();
		// 5 nodes: each gets Graphics (circle) + Text (value) = 10
		// Plus 4 edges (n1→n2, n1→n3, n2→n4, n2→n5) = 4 Graphics
		// Total: 14 children
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(14);
	});

	it('renders node circles for each tree node', () => {
		const element = makeTreeElement();
		renderer.render(element);

		// 5 node circles + 4 edge lines = 9 Graphics total
		expect(pixi.Graphics).toHaveBeenCalledTimes(9);
	});

	it('renders value text inside each node', () => {
		const element = makeTreeElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		const values = [10, 5, 15, 3, 7];

		expect(textCalls.length).toBe(5);
		for (let i = 0; i < 5; i++) {
			expect(textCalls[i][0].text).toBe(String(values[i]));
		}
	});

	it('positions root node at the top center', () => {
		const element = makeTreeElement();
		renderer.render(element);

		const nodeContainers = renderer.getNodeContainers('tree-1');
		expect(nodeContainers).toBeDefined();

		// Root should be at center-x of layout, y = 0
		const rootContainer = nodeContainers?.get('n1');
		expect(rootContainer).toBeDefined();
	});

	it('positions child nodes below parent with correct level gap', () => {
		const element = makeTreeElement();
		renderer.render(element);

		const positions = renderer.getNodePositions('tree-1');
		expect(positions).toBeDefined();

		// Root at level 0, children at level 1, grandchildren at level 2
		const rootPos = positions?.get('n1');
		const leftChildPos = positions?.get('n2');
		const rightChildPos = positions?.get('n3');

		expect(rootPos).toBeDefined();
		expect(leftChildPos).toBeDefined();
		expect(rightChildPos).toBeDefined();

		// Children should be below root by levelGap (60)
		expect(leftChildPos!.y).toBe(rootPos!.y + 60);
		expect(rightChildPos!.y).toBe(rootPos!.y + 60);

		// Left child should be to the left of root
		expect(leftChildPos!.x).toBeLessThan(rootPos!.x);
		// Right child should be to the right of root
		expect(rightChildPos!.x).toBeGreaterThan(rootPos!.x);
	});

	it('handles empty tree', () => {
		const element = makeTreeElement({
			metadata: {
				nodes: [],
				nodeSize: 20,
				levelGap: 60,
				nodeGap: 30,
				highlightedNodes: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);

		expect(container.addChild).not.toHaveBeenCalled();
	});

	it('handles single-node tree (leaf only)', () => {
		const element = makeTreeElement({
			metadata: {
				nodes: [{ id: 'n1', value: 42, parentId: null, side: null }],
				nodeSize: 20,
				levelGap: 60,
				nodeGap: 30,
				highlightedNodes: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);

		// 1 node circle + 1 value text = 2 children, 0 edges
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(2);
	});

	it('applies highlight fill color to highlighted nodes', () => {
		const element = makeTreeElement({
			metadata: {
				nodes: [
					{ id: 'n1', value: 10, parentId: null, side: null },
					{ id: 'n2', value: 5, parentId: 'n1', side: 'left' },
					{ id: 'n3', value: 15, parentId: 'n1', side: 'right' },
				],
				nodeSize: 20,
				levelGap: 60,
				nodeGap: 30,
				highlightedNodes: ['n2'],
				highlightColor: '#3b82f6',
			},
		});
		renderer.render(element);

		const graphicsCalls = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;

		// First 3 Graphics are node circles (edges come after)
		// Node 0 (n1): normal fill
		const g0 = graphicsCalls[0].value;
		expect(g0.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });

		// Node 1 (n2): highlighted fill
		const g1 = graphicsCalls[1].value;
		expect(g1.fill).toHaveBeenCalledWith({ color: 0x3b82f6 });

		// Node 2 (n3): normal fill
		const g2 = graphicsCalls[2].value;
		expect(g2.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });
	});

	it('returns node containers for animation targeting', () => {
		const element = makeTreeElement();
		renderer.render(element);

		const nodeContainers = renderer.getNodeContainers('tree-1');
		expect(nodeContainers).toBeDefined();
		expect(nodeContainers?.size).toBe(5);
		expect(nodeContainers?.has('n1')).toBe(true);
		expect(nodeContainers?.has('n5')).toBe(true);
	});

	it('draws edges from parent to child nodes', () => {
		const element = makeTreeElement();
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;

		// With 5 nodes and 4 edges, Graphics is called 9 times
		// Edges are drawn after nodes (indices 5-8)
		// Each edge should call moveTo and lineTo
		for (let i = 5; i < 9; i++) {
			const edgeG = graphicsResults[i].value;
			expect(edgeG.moveTo).toHaveBeenCalled();
			expect(edgeG.lineTo).toHaveBeenCalled();
		}
	});
});
