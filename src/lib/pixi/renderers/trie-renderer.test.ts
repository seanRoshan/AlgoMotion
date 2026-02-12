/**
 * Tests for TrieRenderer — Trie composite visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { DEFAULT_ELEMENT_STYLE } from './shared';
import { type TrieNodeData, TrieRenderer } from './trie-renderer';

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
		id: 'trie-1',
		type: 'register',
		position: { x: 0, y: 0 },
		size: { width: 500, height: 400 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: DEFAULT_ELEMENT_STYLE,
		metadata,
	};
}

// Trie containing: "cat", "car"
const CAT_CAR_TRIE: TrieNodeData[] = [
	{ id: 'root', parentId: null, character: '', isEndOfWord: false, depth: 0 },
	{ id: 'c', parentId: 'root', character: 'c', isEndOfWord: false, depth: 1 },
	{ id: 'ca', parentId: 'c', character: 'a', isEndOfWord: false, depth: 2 },
	{ id: 'cat', parentId: 'ca', character: 't', isEndOfWord: true, depth: 3 },
	{ id: 'car', parentId: 'ca', character: 'r', isEndOfWord: true, depth: 3 },
];

describe('TrieRenderer', () => {
	let renderer: TrieRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new TrieRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container for empty trie', () => {
			const element = makeElement({ nodes: [] });
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders trie nodes', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getNodeContainers('trie-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(5);
		});

		it('renders character labels on edges', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const chars = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => ['c', 'a', 't', 'r'].includes(t));
			expect(chars).toContain('c');
			expect(chars).toContain('a');
			expect(chars).toContain('t');
			expect(chars).toContain('r');
		});

		it('renders root label', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const rootLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'root',
			);
			expect(rootLabel).toBeDefined();
		});

		it('renders end-of-word markers as inner circles', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			// End-of-word nodes (cat, car) get an extra circle for the marker
			const graphicsResults = pixi.Graphics.mock.results;
			const circleCallCounts = graphicsResults.map((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return v?.circle?.mock?.calls?.length ?? 0;
			});
			// Some graphics should have 1 circle (node) and some should have
			// the end-of-word marker circle too
			const totalCircles = circleCallCounts.reduce((sum: number, count: number) => sum + count, 0);
			// 5 nodes + 2 end-of-word markers = at least 7 circles
			expect(totalCircles).toBeGreaterThanOrEqual(7);
		});

		it('draws edges between parent and child', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
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
	});

	describe('getNodeContainers', () => {
		it('returns undefined for unknown element', () => {
			expect(renderer.getNodeContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getNodePositions', () => {
		it('returns positions after render', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('trie-1');
			expect(positions).toBeDefined();
			expect(positions?.size).toBe(5);
		});

		it('root is above children', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('trie-1');
			const rootPos = positions?.get('root');
			const cPos = positions?.get('c');
			expect(rootPos).toBeDefined();
			expect(cPos).toBeDefined();
			expect(rootPos!.y).toBeLessThan(cPos!.y);
		});

		it('siblings are at same y level', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('trie-1');
			const catPos = positions?.get('cat');
			const carPos = positions?.get('car');
			expect(catPos).toBeDefined();
			expect(carPos).toBeDefined();
			expect(catPos!.y).toBe(carPos!.y);
		});

		it('siblings have different x positions', () => {
			const element = makeElement({
				nodes: CAT_CAR_TRIE as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('trie-1');
			const catPos = positions?.get('cat');
			const carPos = positions?.get('car');
			expect(catPos!.x).not.toBe(carPos!.x);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getNodePositions('nonexistent')).toBeUndefined();
		});
	});
});
