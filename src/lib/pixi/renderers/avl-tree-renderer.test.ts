/**
 * Tests for AvlTreeRenderer — AVL Tree composite visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { type AvlNodeData, AvlTreeRenderer } from './avl-tree-renderer';
import { DEFAULT_ELEMENT_STYLE } from './shared';

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

function makeElement(metadata: Record<string, JsonValue> = {}): SceneElement {
	return {
		id: 'avl-1',
		type: 'register',
		position: { x: 0, y: 0 },
		size: { width: 400, height: 300 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: DEFAULT_ELEMENT_STYLE,
		metadata,
	};
}

const BALANCED_TREE: AvlNodeData[] = [
	{ id: 'n1', value: 10, parentId: null, side: null, height: 2, balanceFactor: 0 },
	{ id: 'n2', value: 5, parentId: 'n1', side: 'left', height: 1, balanceFactor: 0 },
	{ id: 'n3', value: 15, parentId: 'n1', side: 'right', height: 1, balanceFactor: 0 },
	{ id: 'n4', value: 3, parentId: 'n2', side: 'left', height: 0, balanceFactor: 0 },
	{ id: 'n5', value: 7, parentId: 'n2', side: 'right', height: 0, balanceFactor: 0 },
];

const UNBALANCED_TREE: AvlNodeData[] = [
	{ id: 'n1', value: 10, parentId: null, side: null, height: 3, balanceFactor: -2 },
	{ id: 'n2', value: 5, parentId: 'n1', side: 'left', height: 0, balanceFactor: 0 },
	{ id: 'n3', value: 20, parentId: 'n1', side: 'right', height: 2, balanceFactor: -1 },
	{ id: 'n4', value: 15, parentId: 'n3', side: 'left', height: 0, balanceFactor: 0 },
	{ id: 'n5', value: 25, parentId: 'n3', side: 'right', height: 1, balanceFactor: -1 },
	{ id: 'n6', value: 30, parentId: 'n5', side: 'right', height: 0, balanceFactor: 0 },
];

describe('AvlTreeRenderer', () => {
	let renderer: AvlTreeRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new AvlTreeRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container for empty tree', () => {
			const element = makeElement({ nodes: [] });
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders balanced tree nodes', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getNodeContainers('avl-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(5);
		});

		it('renders node values', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const values = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => !Number.isNaN(Number(t)));
			expect(values).toContain('10');
			expect(values).toContain('5');
			expect(values).toContain('15');
		});

		it('renders balance factor badges by default', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			// Balance factor "0" should appear for balanced nodes
			const bfTexts = textCalls.filter((c: unknown[]) => (c[0] as { text: string }).text === '0');
			expect(bfTexts.length).toBeGreaterThan(0);
		});

		it('renders unbalanced factor badges with correct values', () => {
			const element = makeElement({
				nodes: UNBALANCED_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const bfValues = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => t === '-2' || t === '-1');
			expect(bfValues).toContain('-2');
			expect(bfValues).toContain('-1');
		});

		it('hides balance factor when showBalanceFactor is false', () => {
			const element = makeElement({
				nodes: [
					{ id: 'n1', value: 10, parentId: null, side: null, height: 0, balanceFactor: 0 },
				] as unknown as JsonValue[],
				showBalanceFactor: false,
			});
			renderer.render(element);

			// Only value text + no badge = just "10"
			const graphicsCalls = pixi.Graphics.mock.results;
			// Node circle only — no badge circle
			const circleCount = graphicsCalls.reduce(
				(count: number, r: { type: string; value?: unknown }) => {
					const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
					return count + (v?.circle?.mock?.calls?.length ?? 0);
				},
				0,
			);
			expect(circleCount).toBe(1); // Just the node, no badge
		});

		it('renders height labels when showHeight is true', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
				showHeight: true,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const heightTexts = textCalls.filter((c: unknown[]) =>
				(c[0] as { text: string }).text.startsWith('h='),
			);
			expect(heightTexts.length).toBe(5);
		});

		it('does not render height labels by default', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const heightTexts = textCalls.filter((c: unknown[]) =>
				(c[0] as { text: string }).text.startsWith('h='),
			);
			expect(heightTexts.length).toBe(0);
		});

		it('renders rotation indicator', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
				rotationIndicator: 'Left Rotation',
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const rotText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Left Rotation',
			);
			expect(rotText).toBeDefined();
		});

		it('draws edges between parent and child', () => {
			const element = makeElement({
				nodes: [
					{ id: 'n1', value: 10, parentId: null, side: null, height: 1, balanceFactor: 0 },
					{ id: 'n2', value: 5, parentId: 'n1', side: 'left', height: 0, balanceFactor: 0 },
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			// Should call moveTo + lineTo for the edge
			const graphicsResults = pixi.Graphics.mock.results;
			const hasLine = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (
					(v?.moveTo?.mock?.calls?.length ?? 0) > 0 && (v?.lineTo?.mock?.calls?.length ?? 0) > 0
				);
			});
			expect(hasLine).toBe(true);
		});
	});

	describe('getNodeContainers', () => {
		it('returns undefined for unknown element', () => {
			expect(renderer.getNodeContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getNodePositions', () => {
		it('returns positions after render', () => {
			const element = makeElement({
				nodes: BALANCED_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('avl-1');
			expect(positions).toBeDefined();
			expect(positions?.size).toBe(5);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getNodePositions('nonexistent')).toBeUndefined();
		});
	});
});
