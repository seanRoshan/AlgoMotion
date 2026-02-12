/**
 * Tests for Math composite renderers: Coordinate Plane, Matrix, Number Line.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { CoordinatePlaneRenderer } from './coordinate-plane-renderer';
import { MatrixRenderer } from './matrix-renderer';
import { NumberLineRenderer } from './number-line-renderer';
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

function makeElement(id: string, metadata: Record<string, JsonValue> = {}): SceneElement {
	return {
		id,
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

describe('CoordinatePlaneRenderer', () => {
	let renderer: CoordinatePlaneRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new CoordinatePlaneRenderer(pixi as never);
	});

	it('renders with default range', () => {
		const element = makeElement('cp-1');
		const container = renderer.render(element);
		expect(container).toBeDefined();
	});

	it('draws grid lines by default', () => {
		const element = makeElement('cp-1');
		renderer.render(element);

		const graphicsResults = pixi.Graphics.mock.results;
		const hasLine = graphicsResults.some((r: { type: string; value?: unknown }) => {
			const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
			return (v?.moveTo?.mock?.calls?.length ?? 0) > 0;
		});
		expect(hasLine).toBe(true);
	});

	it('renders axis labels', () => {
		const element = makeElement('cp-1', { xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
		expect(labels).toContain('1');
		expect(labels).toContain('-1');
	});

	it('plots points', () => {
		const element = makeElement('cp-1', {
			points: [
				{ x: 1, y: 2, label: 'A' },
				{ x: -1, y: -2 },
			] as unknown as JsonValue[],
		});
		renderer.render(element);

		const containers = renderer.getPointContainers('cp-1');
		expect(containers).toBeDefined();
		expect(containers?.size).toBe(2);
	});

	it('renders point labels', () => {
		const element = makeElement('cp-1', {
			points: [{ x: 1, y: 2, label: 'P1' }] as unknown as JsonValue[],
		});
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const ptLabel = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'P1');
		expect(ptLabel).toBeDefined();
	});

	it('renders title', () => {
		const element = makeElement('cp-1', { title: 'y = x²' });
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const title = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'y = x²');
		expect(title).toBeDefined();
	});

	it('renders lines', () => {
		const element = makeElement('cp-1', {
			lines: [
				{
					points: [
						{ x: -2, y: -2 },
						{ x: 2, y: 2 },
					],
				},
			] as unknown as JsonValue[],
		});
		renderer.render(element);

		const graphicsResults = pixi.Graphics.mock.results;
		const hasLine = graphicsResults.some((r: { type: string; value?: unknown }) => {
			const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
			return (v?.moveTo?.mock?.calls?.length ?? 0) > 0 && (v?.lineTo?.mock?.calls?.length ?? 0) > 0;
		});
		expect(hasLine).toBe(true);
	});
});

describe('MatrixRenderer', () => {
	let renderer: MatrixRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new MatrixRenderer(pixi as never);
	});

	it('renders empty matrix', () => {
		const element = makeElement('m-1', { data: [] });
		const container = renderer.render(element);
		expect(container).toBeDefined();
	});

	it('renders 2x2 matrix cells', () => {
		const element = makeElement('m-1', {
			data: [
				[1, 2],
				[3, 4],
			],
		});
		renderer.render(element);

		const cells = renderer.getCellContainers('m-1');
		expect(cells).toBeDefined();
		expect(cells?.size).toBe(4);
	});

	it('renders cell values', () => {
		const element = makeElement('m-1', {
			data: [
				[1, 2],
				[3, 4],
			],
		});
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const values = textCalls
			.map((c: unknown[]) => (c[0] as { text: string }).text)
			.filter((t: string) => ['1', '2', '3', '4'].includes(t));
		expect(values).toContain('1');
		expect(values).toContain('4');
	});

	it('renders brackets', () => {
		const element = makeElement('m-1', {
			data: [[1]],
		});
		renderer.render(element);

		// Brackets are drawn with moveTo + lineTo (3 segments each)
		const graphicsResults = pixi.Graphics.mock.results;
		const bracketGraphics = graphicsResults.filter((r: { type: string; value?: unknown }) => {
			const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
			const moveCount = v?.moveTo?.mock?.calls?.length ?? 0;
			const lineCount = v?.lineTo?.mock?.calls?.length ?? 0;
			return moveCount === 1 && lineCount === 3;
		});
		expect(bracketGraphics.length).toBe(2); // Left + right brackets
	});

	it('renders label', () => {
		const element = makeElement('m-1', {
			data: [[1]],
			label: 'A',
		});
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const label = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'A');
		expect(label).toBeDefined();
	});

	it('returns undefined for unknown element', () => {
		expect(renderer.getCellContainers('nonexistent')).toBeUndefined();
	});
});

describe('NumberLineRenderer', () => {
	let renderer: NumberLineRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new NumberLineRenderer(pixi as never);
	});

	it('renders with default range', () => {
		const element = makeElement('nl-1');
		const container = renderer.render(element);
		expect(container).toBeDefined();
	});

	it('renders tick labels', () => {
		const element = makeElement('nl-1', { min: 0, max: 3, interval: 1 });
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
		expect(labels).toContain('0');
		expect(labels).toContain('1');
		expect(labels).toContain('2');
		expect(labels).toContain('3');
	});

	it('renders markers', () => {
		const element = makeElement('nl-1', {
			min: 0,
			max: 10,
			markers: [{ value: 3, label: 'x' }, { value: 7 }] as unknown as JsonValue[],
		});
		renderer.render(element);

		const containers = renderer.getMarkerContainers('nl-1');
		expect(containers).toBeDefined();
		expect(containers?.size).toBe(2);
	});

	it('renders marker labels', () => {
		const element = makeElement('nl-1', {
			min: 0,
			max: 10,
			markers: [{ value: 5, label: 'mid' }] as unknown as JsonValue[],
		});
		renderer.render(element);

		const textCalls = pixi.Text.mock.calls;
		const label = textCalls.find((c: unknown[]) => (c[0] as { text: string }).text === 'mid');
		expect(label).toBeDefined();
	});

	it('renders range highlights', () => {
		const element = makeElement('nl-1', {
			min: 0,
			max: 10,
			ranges: [{ from: 2, to: 6 }] as unknown as JsonValue[],
		});
		renderer.render(element);

		const graphicsResults = pixi.Graphics.mock.results;
		const hasRect = graphicsResults.some((r: { type: string; value?: unknown }) => {
			const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
			return (v?.rect?.mock?.calls?.length ?? 0) > 0;
		});
		expect(hasRect).toBe(true);
	});

	it('returns undefined for unknown element', () => {
		expect(renderer.getMarkerContainers('nonexistent')).toBeUndefined();
	});
});
