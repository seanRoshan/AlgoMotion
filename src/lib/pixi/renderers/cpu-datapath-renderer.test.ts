/**
 * Tests for CpuDatapathRenderer — CPU Datapath composite visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { CpuDatapathRenderer } from './cpu-datapath-renderer';
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
		id: 'datapath-1',
		type: 'register',
		position: { x: 0, y: 0 },
		size: { width: 750, height: 250 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: DEFAULT_ELEMENT_STYLE,
		metadata,
	};
}

describe('CpuDatapathRenderer', () => {
	let renderer: CpuDatapathRenderer;

	beforeEach(() => {
		const pixi = createMockPixi();
		renderer = new CpuDatapathRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container with default components', () => {
			const element = makeElement();
			const container = renderer.render(element);

			// Should create Graphics and Text for each component + bus
			expect(container).toBeDefined();
			expect(container.children.length).toBeGreaterThan(0);
		});

		it('renders all 7 default components', () => {
			const element = makeElement();
			renderer.render(element);

			const containers = renderer.getComponentContainers('datapath-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(7);
			expect(containers?.has('pc')).toBe(true);
			expect(containers?.has('imem')).toBe(true);
			expect(containers?.has('regfile')).toBe(true);
			expect(containers?.has('alu')).toBe(true);
			expect(containers?.has('dmem')).toBe(true);
			expect(containers?.has('ctrl')).toBe(true);
			expect(containers?.has('mux-wb')).toBe(true);
		});

		it('renders bus graphics', () => {
			const element = makeElement();
			renderer.render(element);

			const buses = renderer.getBusGraphics('datapath-1');
			expect(buses).toBeDefined();
			expect(buses?.size).toBeGreaterThan(0);
			expect(buses?.has('bus-pc-imem')).toBe(true);
			expect(buses?.has('bus-reg-alu')).toBe(true);
		});

		it('renders with custom components', () => {
			const element = makeElement({
				components: [
					{ type: 'pc', id: 'my-pc', label: 'PC', x: 0, y: 0, width: 50, height: 40 },
					{ type: 'alu', id: 'my-alu', label: 'ALU', x: 100, y: 0, width: 60, height: 70 },
				],
				buses: [],
			});

			renderer.render(element);
			const containers = renderer.getComponentContainers('datapath-1');
			expect(containers?.size).toBe(2);
			expect(containers?.has('my-pc')).toBe(true);
			expect(containers?.has('my-alu')).toBe(true);
		});

		it('renders clock cycle counter when > 0', () => {
			const pixi = createMockPixi();
			const rend = new CpuDatapathRenderer(pixi as never);
			const element = makeElement({ clockCycle: 5 });

			rend.render(element);

			// Verify Text was called with "Cycle: 5"
			const textCalls = pixi.Text.mock.calls;
			const cycleText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Cycle: 5',
			);
			expect(cycleText).toBeDefined();
		});

		it('does not render clock cycle counter when 0', () => {
			const pixi = createMockPixi();
			const rend = new CpuDatapathRenderer(pixi as never);
			const element = makeElement({ clockCycle: 0 });

			rend.render(element);

			const textCalls = pixi.Text.mock.calls;
			const cycleText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.startsWith('Cycle:'),
			);
			expect(cycleText).toBeUndefined();
		});

		it('shows ALU operation when specified', () => {
			const pixi = createMockPixi();
			const rend = new CpuDatapathRenderer(pixi as never);
			const element = makeElement({ aluOp: 'ADD' });

			rend.render(element);

			const textCalls = pixi.Text.mock.calls;
			const aluText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('ADD'),
			);
			expect(aluText).toBeDefined();
		});

		it('highlights specified components', () => {
			const pixi = createMockPixi();
			const rend = new CpuDatapathRenderer(pixi as never);
			const element = makeElement({
				highlightedComponents: ['pc', 'alu'],
			});

			const container = rend.render(element);
			// Should render without errors — visual highlight is color-based
			expect(container).toBeDefined();
		});

		it('highlights specified buses', () => {
			const pixi = createMockPixi();
			const rend = new CpuDatapathRenderer(pixi as never);
			const element = makeElement({
				highlightedBuses: ['bus-pc-imem', 'bus-reg-alu'],
			});

			const container = rend.render(element);
			expect(container).toBeDefined();
		});
	});

	describe('getComponentContainers', () => {
		it('returns undefined for unknown element', () => {
			expect(renderer.getComponentContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getBusGraphics', () => {
		it('returns undefined for unknown element', () => {
			expect(renderer.getBusGraphics('nonexistent')).toBeUndefined();
		});
	});
});
