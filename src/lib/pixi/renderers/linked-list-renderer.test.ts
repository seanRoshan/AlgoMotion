import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { LinkedListRenderer } from './linked-list-renderer';
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

function makeLinkedListElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'list-1',
		type: 'linkedListNode',
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
			nodes: [
				{ id: 'n1', value: 10 },
				{ id: 'n2', value: 20 },
				{ id: 'n3', value: 30 },
			],
			nodeWidth: 60,
			nodeHeight: 40,
			arrowGap: 30,
			highlightedNodes: [],
			highlightColor: '#3b82f6',
		},
		...overrides,
	};
}

describe('LinkedListRenderer', () => {
	let pixi: ReturnType<typeof createMockPixi>;
	let renderer: LinkedListRenderer;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new LinkedListRenderer(pixi as never);
	});

	it('renders node rectangles with value text and arrows', () => {
		const element = makeLinkedListElement();
		const container = renderer.render(element);

		expect(container.addChild).toHaveBeenCalled();
		// 3 nodes: each gets Graphics (rect) + Text (value) = 6
		// 2 arrows between nodes = 2 Graphics
		// 1 null terminator graphic = 1 Graphics
		// Total: 9
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(9);
	});

	it('renders value text inside each node', () => {
		const element = makeLinkedListElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		expect(textCalls.length).toBe(3);
		expect(textCalls[0][0].text).toBe('10');
		expect(textCalls[1][0].text).toBe('20');
		expect(textCalls[2][0].text).toBe('30');
	});

	it('positions nodes horizontally with arrow gaps', () => {
		const element = makeLinkedListElement();
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// First 3 Graphics are node rects
		for (let i = 0; i < 3; i++) {
			const g = graphicsResults[i].value;
			const expectedX = i * (60 + 30); // nodeWidth + arrowGap
			expect(g.roundRect).toHaveBeenCalledWith(expectedX, 0, 60, 40, 4);
		}
	});

	it('handles empty list', () => {
		const element = makeLinkedListElement({
			metadata: {
				nodes: [],
				nodeWidth: 60,
				nodeHeight: 40,
				arrowGap: 30,
				highlightedNodes: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);
		expect(container.addChild).not.toHaveBeenCalled();
	});

	it('handles single-node list (no arrows)', () => {
		const element = makeLinkedListElement({
			metadata: {
				nodes: [{ id: 'n1', value: 42 }],
				nodeWidth: 60,
				nodeHeight: 40,
				arrowGap: 30,
				highlightedNodes: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);
		// 1 node rect + 1 value text + 1 null terminator = 3
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(3);
	});

	it('applies highlight fill color to highlighted nodes', () => {
		const element = makeLinkedListElement({
			metadata: {
				nodes: [
					{ id: 'n1', value: 10 },
					{ id: 'n2', value: 20 },
				],
				nodeWidth: 60,
				nodeHeight: 40,
				arrowGap: 30,
				highlightedNodes: ['n2'],
				highlightColor: '#3b82f6',
			},
		});
		renderer.render(element);

		const graphicsCalls = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// Node 0: normal
		expect(graphicsCalls[0].value.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });
		// Node 1: highlighted
		expect(graphicsCalls[1].value.fill).toHaveBeenCalledWith({ color: 0x3b82f6 });
	});

	it('returns node containers for animation targeting', () => {
		const element = makeLinkedListElement();
		renderer.render(element);

		const nodeContainers = renderer.getNodeContainers('list-1');
		expect(nodeContainers).toBeDefined();
		expect(nodeContainers?.size).toBe(3);
	});
});
