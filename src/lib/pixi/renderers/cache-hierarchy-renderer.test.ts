/**
 * Tests for CacheHierarchyRenderer — Cache Hierarchy composite visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { CacheHierarchyRenderer, type CacheLevelConfig } from './cache-hierarchy-renderer';
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
		id: 'cache-1',
		type: 'register',
		position: { x: 0, y: 0 },
		size: { width: 400, height: 500 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: DEFAULT_ELEMENT_STYLE,
		metadata,
	};
}

const SAMPLE_LEVELS: CacheLevelConfig[] = [
	{
		level: 'L1',
		label: 'L1 Cache',
		associativity: 2,
		hitLatency: 1,
		highlighted: false,
		sets: [
			{
				lines: [
					{ valid: true, dirty: false, tag: '0x1A', data: '...', lruCounter: 0 },
					{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
				],
			},
			{
				lines: [
					{ valid: true, dirty: true, tag: '0x2B', data: '...', lruCounter: 1 },
					{ valid: true, dirty: false, tag: '0x3C', data: '...', lruCounter: 0 },
				],
			},
		],
	},
	{
		level: 'L2',
		label: 'L2 Cache',
		associativity: 4,
		hitLatency: 10,
		highlighted: false,
		sets: [
			{
				lines: [
					{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
					{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
					{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
					{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
				],
			},
		],
	},
];

describe('CacheHierarchyRenderer', () => {
	let renderer: CacheHierarchyRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new CacheHierarchyRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container with default levels', () => {
			const element = makeElement();
			const container = renderer.render(element);
			expect(container).toBeDefined();
			expect(container.children.length).toBeGreaterThan(0);
		});

		it('renders custom cache levels', () => {
			const element = makeElement({
				levels: SAMPLE_LEVELS as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getLevelContainers('cache-1');
			expect(containers).toBeDefined();
			expect(containers?.has('L1')).toBe(true);
			expect(containers?.has('L2')).toBe(true);
		});

		it('renders level labels with associativity', () => {
			const element = makeElement({
				levels: SAMPLE_LEVELS as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const l1Label = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'L1 Cache (2-way)',
			);
			expect(l1Label).toBeDefined();

			const l2Label = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'L2 Cache (4-way)',
			);
			expect(l2Label).toBeDefined();
		});

		it('renders fully-associative label correctly', () => {
			const element = makeElement({
				levels: [
					{
						level: 'L1',
						label: 'L1 Cache',
						associativity: 'full',
						hitLatency: 1,
						highlighted: false,
						sets: [
							{
								lines: [{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 }],
							},
						],
					},
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const faLabel = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'L1 Cache (FA)',
			);
			expect(faLabel).toBeDefined();
		});

		it('renders hit indicator', () => {
			const element = makeElement({
				levels: [
					{
						level: 'L1',
						label: 'L1',
						associativity: 2,
						hitLatency: 1,
						highlighted: true,
						hitIndicator: 'hit',
						sets: [
							{
								lines: [
									{ valid: true, dirty: false, tag: '0x1A', data: '', lruCounter: 0 },
									{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
								],
							},
						],
					},
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const hitText = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'HIT');
			expect(hitText).toBeDefined();
		});

		it('renders miss indicator', () => {
			const element = makeElement({
				levels: [
					{
						level: 'L1',
						label: 'L1',
						associativity: 2,
						hitLatency: 1,
						highlighted: false,
						hitIndicator: 'miss',
						sets: [
							{
								lines: [
									{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
									{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
								],
							},
						],
					},
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const missText = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'MISS');
			expect(missText).toBeDefined();
		});

		it('renders address breakdown', () => {
			const element = makeElement({
				levels: SAMPLE_LEVELS as unknown as JsonValue[],
				addressBreakdown: {
					tag: '0x1A',
					index: '01',
					offset: '00',
					tagBits: 6,
					indexBits: 2,
					offsetBits: 2,
				} as unknown as JsonValue,
				activeAddress: '0x6A00',
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const tagText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('Tag:'),
			);
			expect(tagText).toBeDefined();

			const idxText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('Index:'),
			);
			expect(idxText).toBeDefined();

			const offText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('Offset:'),
			);
			expect(offText).toBeDefined();
		});

		it('renders active address label', () => {
			const element = makeElement({
				addressBreakdown: {
					tag: '0x1A',
					index: '01',
					offset: '00',
					tagBits: 6,
					indexBits: 2,
					offsetBits: 2,
				} as unknown as JsonValue,
				activeAddress: '0x6A00',
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const addrText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Address: 0x6A00',
			);
			expect(addrText).toBeDefined();
		});

		it('renders write policy indicator', () => {
			const element = makeElement({ writePolicy: 'write-through' });
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const policyText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Write Policy: write-through',
			);
			expect(policyText).toBeDefined();
		});

		it('defaults to write-back policy', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const policyText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Write Policy: write-back',
			);
			expect(policyText).toBeDefined();
		});

		it('renders valid cache line tags', () => {
			const element = makeElement({
				levels: SAMPLE_LEVELS as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const tagText = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === '0x1A');
			expect(tagText).toBeDefined();
		});

		it('renders latency labels', () => {
			const element = makeElement({
				levels: SAMPLE_LEVELS as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const l1Latency = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === '1ns');
			expect(l1Latency).toBeDefined();

			const l2Latency = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === '10ns',
			);
			expect(l2Latency).toBeDefined();
		});
	});

	describe('getLevelContainers', () => {
		it('returns undefined for unknown element', () => {
			expect(renderer.getLevelContainers('nonexistent')).toBeUndefined();
		});

		it('returns level containers after render', () => {
			const element = makeElement({
				levels: SAMPLE_LEVELS as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getLevelContainers('cache-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(2);
		});
	});
});
