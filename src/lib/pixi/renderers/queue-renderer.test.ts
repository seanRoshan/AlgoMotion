import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { QueueRenderer } from './queue-renderer';
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

function makeQueueElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'queue-1',
		type: 'queueCell',
		position: { x: 50, y: 100 },
		size: { width: 400, height: 60 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label: '',
		style: {
			...DEFAULT_ELEMENT_STYLE,
			fill: '#2a2a4a',
			stroke: '#6366f1',
			cornerRadius: 4,
			fontSize: 14,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: 600,
			textColor: '#e0e0f0',
		},
		metadata: {
			values: [10, 20, 30],
			cellSize: 48,
			gap: 4,
			front: 0,
			rear: 2,
			highlightedIndex: -1,
			highlightColor: '#3b82f6',
		},
		...overrides,
	};
}

describe('QueueRenderer', () => {
	let pixi: ReturnType<typeof createMockPixi>;
	let renderer: QueueRenderer;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new QueueRenderer(pixi as never);
	});

	it('renders cell rectangles with value text', () => {
		const element = makeQueueElement();
		const container = renderer.render(element);

		expect(container.addChild).toHaveBeenCalled();
		// 3 cells: each gets Graphics (rect) + Text (value) = 6
		// 2 marker texts (FRONT + REAR) = 2
		// Total: 8
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(8);
	});

	it('renders value text for each cell', () => {
		const element = makeQueueElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		// 3 value texts + 2 markers (FRONT, REAR) = 5
		expect(textCalls.length).toBe(5);
		expect(textCalls[0][0].text).toBe('10');
		expect(textCalls[1][0].text).toBe('20');
		expect(textCalls[2][0].text).toBe('30');
	});

	it('positions cells horizontally', () => {
		const element = makeQueueElement();
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		const stride = 48 + 4; // cellSize + gap
		for (let i = 0; i < 3; i++) {
			const g = graphicsResults[i].value;
			expect(g.roundRect).toHaveBeenCalledWith(i * stride, 0, 48, 48, 4);
		}
	});

	it('handles empty queue', () => {
		const element = makeQueueElement({
			metadata: {
				values: [],
				cellSize: 48,
				gap: 4,
				front: 0,
				rear: -1,
				highlightedIndex: -1,
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);
		// Empty queue: only "EMPTY" text
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(1);
	});

	it('renders FRONT and REAR marker texts', () => {
		const element = makeQueueElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		const markers = textCalls.filter(
			(c: unknown[]) =>
				(c[0] as { text: string }).text === 'FRONT' || (c[0] as { text: string }).text === 'REAR',
		);
		expect(markers.length).toBe(2);
	});

	it('applies highlight fill color to highlighted cell', () => {
		const element = makeQueueElement({
			metadata: {
				values: [10, 20, 30],
				cellSize: 48,
				gap: 4,
				front: 0,
				rear: 2,
				highlightedIndex: 1,
				highlightColor: '#3b82f6',
			},
		});
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// Cell 0: normal
		expect(graphicsResults[0].value.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });
		// Cell 1: highlighted
		expect(graphicsResults[1].value.fill).toHaveBeenCalledWith({ color: 0x3b82f6 });
	});

	it('returns cell containers for animation targeting', () => {
		const element = makeQueueElement();
		renderer.render(element);

		const cellContainers = renderer.getCellContainers('queue-1');
		expect(cellContainers).toBeDefined();
		expect(cellContainers?.length).toBe(3);
	});
});
