/**
 * Tests for RaceOverlayRenderer — countdown & winner display.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RaceOverlayRenderer } from './race-overlay-renderer';

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
		this.alpha = 1;
		this.scale = { set: vi.fn(), x: 1, y: 1 };
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

describe('RaceOverlayRenderer', () => {
	let renderer: RaceOverlayRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new RaceOverlayRenderer(pixi as never);
	});

	describe('renderCountdown', () => {
		it('creates a container', () => {
			const container = renderer.renderCountdown(3, 800, 600);
			expect(container).toBeDefined();
		});

		it('renders countdown number text', () => {
			renderer.renderCountdown(3, 800, 600);

			const textCalls = pixi.Text.mock.calls;
			const countText = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === '3');
			expect(countText).toBeDefined();
		});

		it('renders "GO!" for zero value', () => {
			renderer.renderCountdown(0, 800, 600);

			const textCalls = pixi.Text.mock.calls;
			const goText = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'GO!');
			expect(goText).toBeDefined();
		});

		it('renders backdrop', () => {
			renderer.renderCountdown(3, 800, 600);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.rect?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasRect).toBe(true);
		});
	});

	describe('renderWinner', () => {
		it('creates a container', () => {
			const container = renderer.renderWinner('Quick Sort', 800, 600);
			expect(container).toBeDefined();
		});

		it('renders winner title', () => {
			renderer.renderWinner('Quick Sort', 800, 600);

			const textCalls = pixi.Text.mock.calls;
			const title = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'Winner!');
			expect(title).toBeDefined();
		});

		it('renders algorithm name', () => {
			renderer.renderWinner('Quick Sort', 800, 600);

			const textCalls = pixi.Text.mock.calls;
			const name = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Quick Sort',
			);
			expect(name).toBeDefined();
		});

		it('renders trophy background circle', () => {
			renderer.renderWinner('Merge Sort', 800, 600);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasCircle = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.circle?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasCircle).toBe(true);
		});
	});

	describe('renderLaneLabel', () => {
		it('creates a container with algorithm name', () => {
			const container = renderer.renderLaneLabel('Bubble Sort', 400);
			expect(container).toBeDefined();
		});

		it('renders the algorithm name text', () => {
			renderer.renderLaneLabel('Heap Sort', 400);

			const textCalls = pixi.Text.mock.calls;
			const label = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Heap Sort',
			);
			expect(label).toBeDefined();
		});

		it('renders background bar', () => {
			renderer.renderLaneLabel('Selection Sort', 400);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasRoundRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.roundRect?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasRoundRect).toBe(true);
		});
	});

	describe('renderDivider', () => {
		it('creates a divider line', () => {
			const container = renderer.renderDivider(600);
			expect(container).toBeDefined();
		});

		it('draws a vertical line', () => {
			renderer.renderDivider(600);

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

	describe('getCountdownText', () => {
		it('returns text object after render', () => {
			renderer.renderCountdown(3, 800, 600);
			const text = renderer.getCountdownText();
			expect(text).toBeDefined();
		});

		it('returns undefined before render', () => {
			expect(renderer.getCountdownText()).toBeUndefined();
		});
	});

	describe('getWinnerTexts', () => {
		it('returns text objects after render', () => {
			renderer.renderWinner('Quick Sort', 800, 600);
			const texts = renderer.getWinnerTexts();
			expect(texts).toBeDefined();
			expect(texts?.title).toBeDefined();
			expect(texts?.name).toBeDefined();
		});

		it('returns undefined before render', () => {
			expect(renderer.getWinnerTexts()).toBeUndefined();
		});
	});
});
