/**
 * Tests for RbTreeRenderer — Red-Black Tree composite visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { type RbNodeData, RbTreeRenderer } from './rb-tree-renderer';
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
		id: 'rb-1',
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

const SIMPLE_TREE: RbNodeData[] = [
	{ id: 'n1', value: 10, parentId: null, side: null, color: 'black', isNil: false },
	{ id: 'n2', value: 5, parentId: 'n1', side: 'left', color: 'red', isNil: false },
	{ id: 'n3', value: 15, parentId: 'n1', side: 'right', color: 'red', isNil: false },
];

const TREE_WITH_NILS: RbNodeData[] = [
	{ id: 'n1', value: 10, parentId: null, side: null, color: 'black', isNil: false },
	{ id: 'n2', value: 5, parentId: 'n1', side: 'left', color: 'red', isNil: false },
	{ id: 'nil-l', value: 0, parentId: 'n2', side: 'left', color: 'black', isNil: true },
	{ id: 'nil-r', value: 0, parentId: 'n2', side: 'right', color: 'black', isNil: true },
];

const TREE_WITH_ROLES: RbNodeData[] = [
	{
		id: 'n1',
		value: 10,
		parentId: null,
		side: null,
		color: 'black',
		isNil: false,
		role: 'grandparent',
	},
	{
		id: 'n2',
		value: 5,
		parentId: 'n1',
		side: 'left',
		color: 'red',
		isNil: false,
		role: 'parent',
	},
	{
		id: 'n3',
		value: 15,
		parentId: 'n1',
		side: 'right',
		color: 'black',
		isNil: false,
		role: 'uncle',
	},
];

describe('RbTreeRenderer', () => {
	let renderer: RbTreeRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new RbTreeRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container for empty tree', () => {
			const element = makeElement({ nodes: [] });
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders simple tree nodes', () => {
			const element = makeElement({
				nodes: SIMPLE_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getNodeContainers('rb-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(3);
		});

		it('renders node values as text', () => {
			const element = makeElement({
				nodes: SIMPLE_TREE as unknown as JsonValue[],
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

		it('hides NIL nodes by default', () => {
			const element = makeElement({
				nodes: TREE_WITH_NILS as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const nilTexts = textCalls.filter(
				(c: unknown[]) => (c[0] as { text: string }).text === 'NIL',
			);
			expect(nilTexts.length).toBe(0);
		});

		it('shows NIL nodes when showNil is true', () => {
			const element = makeElement({
				nodes: TREE_WITH_NILS as unknown as JsonValue[],
				showNil: true,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const nilTexts = textCalls.filter(
				(c: unknown[]) => (c[0] as { text: string }).text === 'NIL',
			);
			expect(nilTexts.length).toBe(2);
		});

		it('renders NIL nodes as rectangles', () => {
			const element = makeElement({
				nodes: TREE_WITH_NILS as unknown as JsonValue[],
				showNil: true,
			});
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.rect?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasRect).toBe(true);
		});

		it('renders role annotations', () => {
			const element = makeElement({
				nodes: TREE_WITH_ROLES as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const roleTexts = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => ['G', 'P', 'U'].includes(t));
			expect(roleTexts).toContain('G'); // grandparent
			expect(roleTexts).toContain('P'); // parent
			expect(roleTexts).toContain('U'); // uncle
		});

		it('draws edges between parent and child', () => {
			const element = makeElement({
				nodes: SIMPLE_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasLine = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (
					(v?.moveTo?.mock?.calls?.length ?? 0) > 0 && (v?.lineTo?.mock?.calls?.length ?? 0) > 0
				);
			});
			expect(hasLine).toBe(true);
		});

		it('highlights specified nodes', () => {
			const element = makeElement({
				nodes: SIMPLE_TREE as unknown as JsonValue[],
				highlightedNodes: ['n2'],
			});
			renderer.render(element);

			// Should use highlight color for n2
			const graphicsResults = pixi.Graphics.mock.results;
			const fillCalls = graphicsResults.flatMap((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return v?.fill?.mock?.calls ?? [];
			});
			const hasHighlight = fillCalls.some(
				(call: unknown[]) =>
					typeof call[0] === 'object' &&
					call[0] !== null &&
					'color' in (call[0] as Record<string, unknown>),
			);
			expect(hasHighlight).toBe(true);
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
				nodes: SIMPLE_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('rb-1');
			expect(positions).toBeDefined();
			expect(positions?.size).toBe(3);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getNodePositions('nonexistent')).toBeUndefined();
		});

		it('root node is positioned above children', () => {
			const element = makeElement({
				nodes: SIMPLE_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('rb-1');
			const rootPos = positions?.get('n1');
			const leftPos = positions?.get('n2');
			const rightPos = positions?.get('n3');
			expect(rootPos).toBeDefined();
			expect(leftPos).toBeDefined();
			expect(rightPos).toBeDefined();
			expect(rootPos!.y).toBeLessThan(leftPos!.y);
			expect(rootPos!.y).toBeLessThan(rightPos!.y);
		});

		it('left child is positioned left of right child', () => {
			const element = makeElement({
				nodes: SIMPLE_TREE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('rb-1');
			const leftPos = positions?.get('n2');
			const rightPos = positions?.get('n3');
			expect(leftPos!.x).toBeLessThan(rightPos!.x);
		});
	});
});
