/**
 * Tests for HashTableRenderer — Hash Table composite visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { type HashBucket, HashTableRenderer } from './hash-table-renderer';
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
		id: 'ht-1',
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

const SIMPLE_TABLE: HashBucket[] = [
	{
		index: 0,
		entries: [{ key: 'a', value: '1', bucketIndex: 0, chainPosition: 0 }],
		hasCollision: false,
	},
	{ index: 1, entries: [], hasCollision: false },
	{
		index: 2,
		entries: [
			{ key: 'b', value: '2', bucketIndex: 2, chainPosition: 0 },
			{ key: 'c', value: '3', bucketIndex: 2, chainPosition: 1 },
		],
		hasCollision: true,
	},
	{ index: 3, entries: [], hasCollision: false },
];

describe('HashTableRenderer', () => {
	let renderer: HashTableRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new HashTableRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container for empty table', () => {
			const element = makeElement({ tableSize: 0 });
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders bucket indices', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const indices = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => ['0', '1', '2', '3'].includes(t));
			expect(indices).toContain('0');
			expect(indices).toContain('1');
			expect(indices).toContain('2');
			expect(indices).toContain('3');
		});

		it('renders entry keys', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const keys = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => ['a', 'b', 'c'].includes(t));
			expect(keys).toContain('a');
			expect(keys).toContain('b');
			expect(keys).toContain('c');
		});

		it('renders hash function label', () => {
			const element = makeElement({
				buckets: [] as JsonValue[],
				tableSize: 4,
				hashFunction: 'key % 4',
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const fnLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'h(k) = key % 4',
			);
			expect(fnLabel).toBeDefined();
		});

		it('renders collision indicator', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			// Collision indicator is a small filled circle
			const graphicsResults = pixi.Graphics.mock.results;
			const hasSmallCircle = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				const circleCalls = v?.circle?.mock?.calls ?? [];
				return circleCalls.some((call: unknown[]) => (call[2] as number) === 3);
			});
			expect(hasSmallCircle).toBe(true);
		});

		it('renders load factor by default', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const lfText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.startsWith('Load factor:'),
			);
			expect(lfText).toBeDefined();
		});

		it('hides load factor when showLoadFactor is false', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
				showLoadFactor: false,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const lfText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.startsWith('Load factor:'),
			);
			expect(lfText).toBeUndefined();
		});

		it('renders chain nodes as rounded rectangles', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasRoundRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.roundRect?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasRoundRect).toBe(true);
		});
	});

	describe('getBucketContainers', () => {
		it('returns containers after render', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const containers = renderer.getBucketContainers('ht-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(4);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getBucketContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getEntryContainers', () => {
		it('returns entry containers after render', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const entries = renderer.getEntryContainers('ht-1');
			expect(entries).toBeDefined();
			expect(entries?.size).toBe(3); // a, b, c
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getEntryContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getEntryPositions', () => {
		it('returns positions after render', () => {
			const element = makeElement({
				buckets: SIMPLE_TABLE as unknown as JsonValue[],
				tableSize: 4,
			});
			renderer.render(element);

			const positions = renderer.getEntryPositions('ht-1');
			expect(positions).toBeDefined();
			expect(positions?.size).toBe(3);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getEntryPositions('nonexistent')).toBeUndefined();
		});
	});
});
