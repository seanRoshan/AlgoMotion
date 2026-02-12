/**
 * Tests for MetricsOverlayRenderer — algorithm performance display.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { MetricsOverlayRenderer } from './metrics-overlay-renderer';
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
		id: 'metrics-1',
		type: 'register',
		position: { x: 0, y: 0 },
		size: { width: 200, height: 200 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: DEFAULT_ELEMENT_STYLE,
		metadata,
	};
}

describe('MetricsOverlayRenderer', () => {
	let renderer: MetricsOverlayRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new MetricsOverlayRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container with defaults', () => {
			const element = makeElement();
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders title text', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const title = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'Metrics');
			expect(title).toBeDefined();
		});

		it('renders step counter', () => {
			const element = makeElement({
				currentStep: 5,
				totalSteps: 20,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const stepValue = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === '5 / 20',
			);
			expect(stepValue).toBeDefined();
		});

		it('renders comparison count', () => {
			const element = makeElement({ comparisons: 42 });
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const compValue = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === '42');
			expect(compValue).toBeDefined();
		});

		it('renders swap count', () => {
			const element = makeElement({ swaps: 12 });
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const swapValue = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === '12');
			expect(swapValue).toBeDefined();
		});

		it('renders memory access counts', () => {
			const element = makeElement({ memoryReads: 100, memoryWrites: 50 });
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const memValue = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'R:100 W:50',
			);
			expect(memValue).toBeDefined();
		});

		it('hides memory when showMemory is false', () => {
			const element = makeElement({
				memoryReads: 100,
				memoryWrites: 50,
				showMemory: false,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const memValue = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'R:100 W:50',
			);
			expect(memValue).toBeUndefined();
		});

		it('renders time complexity', () => {
			const element = makeElement({ timeComplexity: 'O(n log n)' });
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const tcValue = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'O(n log n)',
			);
			expect(tcValue).toBeDefined();
		});

		it('renders space complexity', () => {
			const element = makeElement({ spaceComplexity: 'O(n)' });
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const scValue = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'O(n)');
			expect(scValue).toBeDefined();
		});

		it('hides complexity when showComplexity is false', () => {
			const element = makeElement({
				timeComplexity: 'O(n)',
				spaceComplexity: 'O(1)',
				showComplexity: false,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
			expect(labels).not.toContain('O(n)');
			expect(labels).not.toContain('O(1)');
		});

		it('renders background panel with rounded rect', () => {
			const element = makeElement();
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasRoundRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.roundRect?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasRoundRect).toBe(true);
		});

		it('renders metric labels', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
			expect(labels).toContain('Step');
			expect(labels).toContain('Comparisons');
			expect(labels).toContain('Swaps');
		});

		it('renders color dots for each metric', () => {
			const element = makeElement();
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const smallCircles = graphicsResults.filter((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				const circleCalls = v?.circle?.mock?.calls ?? [];
				return circleCalls.some((call: unknown[]) => (call[2] as number) === 3);
			});
			// At least 3 dots (steps, comparisons, swaps) + memory
			expect(smallCircles.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('getMetricTexts', () => {
		it('returns text objects after render', () => {
			const element = makeElement();
			renderer.render(element);

			const texts = renderer.getMetricTexts('metrics-1');
			expect(texts).toBeDefined();
			expect(texts?.size).toBeGreaterThanOrEqual(3);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getMetricTexts('nonexistent')).toBeUndefined();
		});
	});
});
