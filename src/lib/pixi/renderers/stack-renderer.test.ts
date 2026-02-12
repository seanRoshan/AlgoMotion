import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { DEFAULT_ELEMENT_STYLE } from './shared';
import { StackRenderer } from './stack-renderer';

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

function makeStackElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'stack-1',
		type: 'stackFrame',
		position: { x: 50, y: 100 },
		size: { width: 120, height: 200 },
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
			frames: ['A', 'B', 'C'],
			frameWidth: 80,
			frameHeight: 36,
			gap: 4,
			highlightedIndex: -1,
			highlightColor: '#3b82f6',
			capacity: 0,
		},
		...overrides,
	};
}

describe('StackRenderer', () => {
	let pixi: ReturnType<typeof createMockPixi>;
	let renderer: StackRenderer;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new StackRenderer(pixi as never);
	});

	it('renders frame rectangles with value text', () => {
		const element = makeStackElement();
		const container = renderer.render(element);

		expect(container.addChild).toHaveBeenCalled();
		// 3 frames: each gets Graphics (rect) + Text (value) = 6
		// 1 "TOP" indicator text = 1
		// Total: 7
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(7);
	});

	it('renders value text for each frame', () => {
		const element = makeStackElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		// 3 value texts + 1 "TOP" label = 4
		expect(textCalls.length).toBe(4);
		// Frames are rendered top-to-bottom (top of stack = index 0)
		expect(textCalls[0][0].text).toBe('A');
		expect(textCalls[1][0].text).toBe('B');
		expect(textCalls[2][0].text).toBe('C');
	});

	it('positions frames vertically', () => {
		const element = makeStackElement();
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// Frames rendered top-down: frame[0] at y=0, frame[1] at y=40, frame[2] at y=80
		const stride = 36 + 4; // frameHeight + gap
		for (let i = 0; i < 3; i++) {
			const g = graphicsResults[i].value;
			expect(g.roundRect).toHaveBeenCalledWith(0, i * stride, 80, 36, 4);
		}
	});

	it('handles empty stack', () => {
		const element = makeStackElement({
			metadata: {
				frames: [],
				frameWidth: 80,
				frameHeight: 36,
				gap: 4,
				highlightedIndex: -1,
				highlightColor: '#3b82f6',
				capacity: 0,
			},
		});
		const container = renderer.render(element);
		// Empty stack: only "EMPTY" text
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(1);
	});

	it('handles single-frame stack', () => {
		const element = makeStackElement({
			metadata: {
				frames: ['X'],
				frameWidth: 80,
				frameHeight: 36,
				gap: 4,
				highlightedIndex: -1,
				highlightColor: '#3b82f6',
				capacity: 0,
			},
		});
		const container = renderer.render(element);
		// 1 frame rect + 1 value text + 1 TOP indicator = 3
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;
		expect(addChildCalls.length).toBe(3);
	});

	it('applies highlight fill color to highlighted frame', () => {
		const element = makeStackElement({
			metadata: {
				frames: ['A', 'B', 'C'],
				frameWidth: 80,
				frameHeight: 36,
				gap: 4,
				highlightedIndex: 0,
				highlightColor: '#3b82f6',
				capacity: 0,
			},
		});
		renderer.render(element);

		const graphicsResults = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		// Frame 0: highlighted
		expect(graphicsResults[0].value.fill).toHaveBeenCalledWith({ color: 0x3b82f6 });
		// Frame 1: normal
		expect(graphicsResults[1].value.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });
	});

	it('returns frame containers for animation targeting', () => {
		const element = makeStackElement();
		renderer.render(element);

		const frameContainers = renderer.getFrameContainers('stack-1');
		expect(frameContainers).toBeDefined();
		expect(frameContainers?.length).toBe(3);
	});

	it('renders TOP indicator arrow on first frame', () => {
		const element = makeStackElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		// Last text should be the TOP indicator
		const topText = textCalls[textCalls.length - 1];
		expect(topText[0].text).toBe('TOP');
	});
});
