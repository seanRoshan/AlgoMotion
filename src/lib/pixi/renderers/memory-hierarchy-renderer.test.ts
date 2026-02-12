/**
 * Tests for MemoryHierarchyRenderer — Memory Hierarchy pyramid visualization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { MemoryHierarchyRenderer, type MemoryLevel } from './memory-hierarchy-renderer';
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
		id: 'memhier-1',
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

describe('MemoryHierarchyRenderer', () => {
	let renderer: MemoryHierarchyRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new MemoryHierarchyRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container with default hierarchy', () => {
			const element = makeElement();
			const container = renderer.render(element);
			expect(container).toBeDefined();
			expect(container.children.length).toBeGreaterThan(0);
		});

		it('renders all 6 default memory levels', () => {
			const element = makeElement();
			renderer.render(element);

			const containers = renderer.getLevelContainers('memhier-1');
			expect(containers).toBeDefined();
			expect(containers?.size).toBe(6);
			expect(containers?.has('registers')).toBe(true);
			expect(containers?.has('l1')).toBe(true);
			expect(containers?.has('l2')).toBe(true);
			expect(containers?.has('l3')).toBe(true);
			expect(containers?.has('ram')).toBe(true);
			expect(containers?.has('disk')).toBe(true);
		});

		it('renders level labels', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
			expect(labels).toContain('Registers');
			expect(labels).toContain('L1 Cache');
			expect(labels).toContain('Main Memory (RAM)');
			expect(labels).toContain('Disk / SSD');
		});

		it('renders latency labels', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
			expect(labels).toContain('< 1 ns');
			expect(labels).toContain('5-10 ms');
		});

		it('renders size labels', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
			expect(labels).toContain('< 1 KB');
			expect(labels).toContain('4-64 GB');
		});

		it('renders axis labels', () => {
			const element = makeElement();
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labels = textCalls.map((c: unknown[]) => (c[0] as { text: string }).text);
			expect(labels).toContain('Faster');
			expect(labels).toContain('Slower');
		});

		it('renders with custom levels', () => {
			const customLevels: MemoryLevel[] = [
				{
					type: 'registers',
					label: 'Regs',
					size: '1 KB',
					latency: '0.5 ns',
					color: '#ff0000',
					highlighted: false,
				},
				{
					type: 'ram',
					label: 'DDR5',
					size: '32 GB',
					latency: '50 ns',
					color: '#00ff00',
					highlighted: true,
				},
			];

			const element = makeElement({
				levels: customLevels as unknown as JsonValue[],
			});
			renderer.render(element);

			const containers = renderer.getLevelContainers('memhier-1');
			expect(containers?.size).toBe(2);
			expect(containers?.has('registers')).toBe(true);
			expect(containers?.has('ram')).toBe(true);
		});

		it('renders active access indicator', () => {
			const levels: MemoryLevel[] = [
				{
					type: 'l1',
					label: 'L1',
					size: '32 KB',
					latency: '1 ns',
					color: '#f97316',
					highlighted: true,
					activeAccess: true,
				},
			];

			const element = makeElement({
				levels: levels as unknown as JsonValue[],
			});
			renderer.render(element);

			// Should draw a circle for access indicator
			const graphicsResults = pixi.Graphics.mock.results;
			const hasCircle = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.circle?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasCircle).toBe(true);
		});

		it('renders TLB when enabled', () => {
			const element = makeElement({
				showTlb: true,
				tlbEntries: [
					{ virtualPage: '0x04', physicalFrame: '0x1A', valid: true },
					{ virtualPage: '0x08', physicalFrame: '0x2B', valid: false },
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const tlbHeader = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('TLB'),
			);
			expect(tlbHeader).toBeDefined();

			const mapping = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('VP: 0x04'),
			);
			expect(mapping).toBeDefined();
		});

		it('does not render TLB when disabled', () => {
			const element = makeElement({
				showTlb: false,
				tlbEntries: [
					{ virtualPage: '0x04', physicalFrame: '0x1A', valid: true },
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const tlbHeader = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.includes('TLB'),
			);
			expect(tlbHeader).toBeUndefined();
		});
	});

	describe('getLevelContainers', () => {
		it('returns undefined for unknown element', () => {
			expect(renderer.getLevelContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getDefaultLevels (static)', () => {
		it('returns 6 default levels', () => {
			const levels = MemoryHierarchyRenderer.getDefaultLevels();
			expect(levels).toHaveLength(6);
		});

		it('returns a copy', () => {
			const levels = MemoryHierarchyRenderer.getDefaultLevels();
			levels.pop();
			const fresh = MemoryHierarchyRenderer.getDefaultLevels();
			expect(fresh).toHaveLength(6);
		});

		it('levels are in correct order', () => {
			const levels = MemoryHierarchyRenderer.getDefaultLevels();
			expect(levels[0].type).toBe('registers');
			expect(levels[5].type).toBe('disk');
		});
	});
});
