import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { ArrayRenderer } from './array-renderer';
import { DEFAULT_ELEMENT_STYLE } from './shared';

/**
 * Mock Pixi.js module for testing without actual Pixi.js.
 * Mirrors the PixiModule interface from element-renderer.ts.
 */
function createMockPixi() {
	// Use regular function constructors (not arrow functions) so `new` works in Vitest 4.x
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

function makeArrayElement(overrides?: Partial<SceneElement>): SceneElement {
	return {
		id: 'array-1',
		type: 'arrayCell',
		position: { x: 100, y: 200 },
		size: { width: 260, height: 68 },
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
			fontSize: 16,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: 600,
			textColor: '#e0e0f0',
		},
		metadata: {
			values: [5, 3, 8, 1, 9],
			cellSize: 48,
			gap: 4,
			showIndices: true,
			highlightedIndices: [],
			highlightColor: '#3b82f6',
		},
		...overrides,
	};
}

describe('ArrayRenderer', () => {
	let pixi: ReturnType<typeof createMockPixi>;
	let renderer: ArrayRenderer;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new ArrayRenderer(pixi as never);
	});

	it('creates a container with cell graphics and value texts', () => {
		const element = makeArrayElement();
		const container = renderer.render(element);

		// Should call addChild for: 5 cell graphics + 5 value texts + 5 index texts = 15 children
		expect(container.addChild).toHaveBeenCalled();
		const addChildCalls = (container.addChild as ReturnType<typeof vi.fn>).mock.calls;

		// 5 cells, each gets: Graphics (cell bg) + Text (value) + Text (index) = 3 per cell = 15 total
		expect(addChildCalls.length).toBe(15);
	});

	it('positions cells horizontally with correct gap', () => {
		const element = makeArrayElement();
		renderer.render(element);

		// Check that Graphics objects are created for each cell
		expect(pixi.Graphics).toHaveBeenCalledTimes(5);

		// Each Graphics should have roundRect called with correct positions
		const graphicsCalls = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;
		for (let i = 0; i < 5; i++) {
			const g = graphicsCalls[i].value;
			const expectedX = i * (48 + 4); // cellSize + gap
			expect(g.roundRect).toHaveBeenCalledWith(expectedX, 0, 48, 48, 4);
		}
	});

	it('renders value text inside each cell', () => {
		const element = makeArrayElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;
		const values = [5, 3, 8, 1, 9];

		// First 5 Text calls should be value texts
		for (let i = 0; i < 5; i++) {
			expect(textCalls[i][0].text).toBe(String(values[i]));
		}
	});

	it('renders index labels below cells when showIndices is true', () => {
		const element = makeArrayElement();
		renderer.render(element);

		const textCalls = (pixi.Text as ReturnType<typeof vi.fn>).mock.calls;

		// Last 5 Text calls should be index texts (0, 1, 2, 3, 4)
		for (let i = 0; i < 5; i++) {
			expect(textCalls[5 + i][0].text).toBe(String(i));
		}
	});

	it('does not render index labels when showIndices is false', () => {
		const element = makeArrayElement({
			metadata: {
				values: [5, 3, 8],
				cellSize: 48,
				gap: 4,
				showIndices: false,
				highlightedIndices: [],
				highlightColor: '#3b82f6',
			},
		});
		renderer.render(element);

		// 3 cells: Graphics + value Text = 6 children (no index texts)
		const addChildCalls = (pixi.Container as ReturnType<typeof vi.fn>).mock.results[0].value
			.addChild.mock.calls;
		expect(addChildCalls.length).toBe(6);
	});

	it('handles empty array', () => {
		const element = makeArrayElement({
			metadata: {
				values: [],
				cellSize: 48,
				gap: 4,
				showIndices: true,
				highlightedIndices: [],
				highlightColor: '#3b82f6',
			},
		});
		const container = renderer.render(element);

		// No cells to render
		expect(container.addChild).not.toHaveBeenCalled();
	});

	it('applies highlight fill color to highlighted cells', () => {
		const element = makeArrayElement({
			metadata: {
				values: [5, 3, 8],
				cellSize: 48,
				gap: 4,
				showIndices: true,
				highlightedIndices: [1],
				highlightColor: '#3b82f6',
			},
		});
		renderer.render(element);

		// Graphics for cell at index 1 should use highlight color
		const graphicsCalls = (pixi.Graphics as ReturnType<typeof vi.fn>).mock.results;

		// Cell 0: normal fill
		const g0 = graphicsCalls[0].value;
		expect(g0.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });

		// Cell 1: highlighted fill
		const g1 = graphicsCalls[1].value;
		expect(g1.fill).toHaveBeenCalledWith({ color: 0x3b82f6 });

		// Cell 2: normal fill
		const g2 = graphicsCalls[2].value;
		expect(g2.fill).toHaveBeenCalledWith({ color: 0x2a2a4a });
	});

	it('returns individual cell containers for animation targeting', () => {
		const element = makeArrayElement();
		renderer.render(element);

		const cellContainers = renderer.getCellContainers('array-1');
		expect(cellContainers).toBeDefined();
		expect(cellContainers?.length).toBe(5);
	});

	it('calculates total width from values, cellSize, and gap', () => {
		const element = makeArrayElement();
		renderer.render(element);

		// 5 cells * 48 + 4 gaps * 4 = 240 + 16 = 256
		const totalWidth = ArrayRenderer.calculateWidth(
			(element.metadata.values as number[]).length,
			element.metadata.cellSize as number,
			element.metadata.gap as number,
		);
		expect(totalWidth).toBe(256);
	});
});
