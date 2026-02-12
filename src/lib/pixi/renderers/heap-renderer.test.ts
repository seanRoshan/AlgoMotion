/**
 * Tests for HeapRenderer — Heap composite with tree + array views.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { type HeapNodeData, HeapRenderer } from './heap-renderer';
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
		id: 'heap-1',
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

const MAX_HEAP: HeapNodeData[] = [
	{ index: 0, value: 90 },
	{ index: 1, value: 70 },
	{ index: 2, value: 80 },
	{ index: 3, value: 30 },
	{ index: 4, value: 50 },
	{ index: 5, value: 60 },
	{ index: 6, value: 40 },
];

const MIN_HEAP: HeapNodeData[] = [
	{ index: 0, value: 10 },
	{ index: 1, value: 20 },
	{ index: 2, value: 15 },
];

describe('HeapRenderer', () => {
	let renderer: HeapRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new HeapRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container for empty heap', () => {
			const element = makeElement({ nodes: [] });
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders max-heap with correct type label', () => {
			const element = makeElement({
				nodes: MAX_HEAP as unknown as JsonValue[],
				heapType: 'max',
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const typeLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Max-Heap',
			);
			expect(typeLabel).toBeDefined();
		});

		it('renders min-heap with correct type label', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
				heapType: 'min',
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const typeLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Min-Heap',
			);
			expect(typeLabel).toBeDefined();
		});

		it('renders node values in tree view', () => {
			const element = makeElement({
				nodes: MAX_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const values = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => t === '90' || t === '70' || t === '80');
			expect(values).toContain('90');
			expect(values).toContain('70');
			expect(values).toContain('80');
		});

		it('draws edges between parent and child nodes', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
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

		it('renders array overlay by default', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const arrayLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Array:',
			);
			expect(arrayLabel).toBeDefined();
		});

		it('hides array when showArray is false', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
				showArray: false,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const arrayLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Array:',
			);
			expect(arrayLabel).toBeUndefined();
		});

		it('renders index labels when showIndices is true', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
				showIndices: true,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			// Index "0", "1", "2" should appear (tree indices + array indices)
			const indexTexts = textCalls.filter(
				(c: unknown[]) => (c[0] as { text: string }).text === '0',
			);
			expect(indexTexts.length).toBeGreaterThan(0);
		});

		it('renders array cells as rectangles', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.rect?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasRect).toBe(true);
		});
	});

	describe('getNodeContainers', () => {
		it('returns containers after render', () => {
			const element = makeElement({
				nodes: MAX_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getNodeContainers('heap-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(7);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getNodeContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getNodePositions', () => {
		it('returns positions after render', () => {
			const element = makeElement({
				nodes: MAX_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('heap-1');
			expect(positions).toBeDefined();
			expect(positions?.size).toBe(7);
		});

		it('root is positioned above children', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const positions = renderer.getNodePositions('heap-1');
			const rootPos = positions?.get(0);
			const leftPos = positions?.get(1);
			const rightPos = positions?.get(2);
			expect(rootPos).toBeDefined();
			expect(leftPos).toBeDefined();
			expect(rightPos).toBeDefined();
			expect(rootPos!.y).toBeLessThan(leftPos!.y);
			expect(rootPos!.y).toBeLessThan(rightPos!.y);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getNodePositions('nonexistent')).toBeUndefined();
		});
	});

	describe('getArrayCellContainers', () => {
		it('returns array containers after render', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
			});
			renderer.render(element);

			const cells = renderer.getArrayCellContainers('heap-1');
			expect(cells).toBeDefined();
			expect(cells?.size).toBe(3);
		});

		it('returns empty map when showArray is false', () => {
			const element = makeElement({
				nodes: MIN_HEAP as unknown as JsonValue[],
				showArray: false,
			});
			renderer.render(element);

			const cells = renderer.getArrayCellContainers('heap-1');
			expect(cells).toBeDefined();
			expect(cells?.size).toBe(0);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getArrayCellContainers('nonexistent')).toBeUndefined();
		});
	});
});
