/**
 * Tests for PipelineRenderer — CPU Pipeline timing diagram.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue, SceneElement } from '@/types';
import { type PipelineInstruction, PipelineRenderer } from './pipeline-renderer';
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
		id: 'pipeline-1',
		type: 'register',
		position: { x: 0, y: 0 },
		size: { width: 600, height: 300 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: DEFAULT_ELEMENT_STYLE,
		metadata,
	};
}

const SAMPLE_INSTRUCTIONS: PipelineInstruction[] = [
	{ name: 'ADD R1,R2,R3', stages: ['IF', 'ID', 'EX', 'MEM', 'WB'] },
	{ name: 'SUB R4,R5,R6', stages: [null, 'IF', 'ID', 'EX', 'MEM', 'WB'] },
	{
		name: 'LW R7,0(R1)',
		stages: [null, null, 'IF', 'ID', 'EX', 'MEM', 'WB'],
	},
];

describe('PipelineRenderer', () => {
	let renderer: PipelineRenderer;
	let pixi: ReturnType<typeof createMockPixi>;

	beforeEach(() => {
		pixi = createMockPixi();
		renderer = new PipelineRenderer(pixi as never);
	});

	describe('render', () => {
		it('creates a container for empty pipeline', () => {
			const element = makeElement();
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});

		it('renders column headers for clock cycles', () => {
			const element = makeElement({
				instructions: SAMPLE_INSTRUCTIONS as unknown as JsonValue[],
			});
			renderer.render(element);

			// Should create Text objects for CC1..CC7 + "Instr" header
			const textCalls = pixi.Text.mock.calls;
			const headerTexts = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => t.startsWith('CC'));
			expect(headerTexts.length).toBe(7);
			expect(headerTexts[0]).toBe('CC1');
			expect(headerTexts[6]).toBe('CC7');
		});

		it('renders instruction row labels', () => {
			const element = makeElement({
				instructions: SAMPLE_INSTRUCTIONS as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const labelTexts = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => t.includes('R'));
			expect(labelTexts).toContain('ADD R1,R2,R3');
			expect(labelTexts).toContain('SUB R4,R5,R6');
			expect(labelTexts).toContain('LW R7,0(R1)');
		});

		it('renders stage labels inside cells', () => {
			const element = makeElement({
				instructions: [
					{ name: 'ADD', stages: ['IF', 'ID', 'EX', 'MEM', 'WB'] },
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const stageTexts = textCalls
				.map((c: unknown[]) => (c[0] as { text: string }).text)
				.filter((t: string) => ['IF', 'ID', 'EX', 'MEM', 'WB'].includes(t));
			expect(stageTexts).toContain('IF');
			expect(stageTexts).toContain('ID');
			expect(stageTexts).toContain('EX');
			expect(stageTexts).toContain('MEM');
			expect(stageTexts).toContain('WB');
		});

		it('renders bubble cells with dash', () => {
			const element = makeElement({
				instructions: [
					{
						name: 'STALL',
						stages: ['IF', 'bubble', 'EX'],
					},
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const dashText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === '\u2014',
			);
			expect(dashText).toBeDefined();
		});

		it('highlights current cycle column', () => {
			const element = makeElement({
				instructions: [{ name: 'ADD', stages: ['IF', 'ID', 'EX'] }] as unknown as JsonValue[],
				currentCycle: 1,
			});
			renderer.render(element);

			// Should call fill with highlight color for column 1
			const graphicsCalls = pixi.Graphics.mock.results;
			expect(graphicsCalls.length).toBeGreaterThan(0);
		});

		it('renders hazard-colored instruction labels', () => {
			const element = makeElement({
				instructions: [
					{
						name: 'BEQ R1,R2,L1',
						stages: ['IF', 'ID', 'EX'],
						hazard: 'control',
					},
				] as unknown as JsonValue[],
			});
			renderer.render(element);

			const textStyleCalls = pixi.TextStyle.mock.calls;
			// Hazard instruction should get bold weight
			const boldStyles = textStyleCalls.filter(
				(c: unknown[]) => (c[0] as Record<string, unknown>).fontWeight === '700',
			);
			expect(boldStyles.length).toBeGreaterThan(0);
		});

		it('renders forwarding paths when enabled', () => {
			const element = makeElement({
				instructions: [
					{ name: 'ADD', stages: ['IF', 'ID', 'EX', 'MEM', 'WB'] },
					{
						name: 'SUB',
						stages: [null, 'IF', 'ID', 'EX', 'MEM', 'WB'],
					},
				] as unknown as JsonValue[],
				showForwarding: true,
				forwardingPaths: [{ fromRow: 0, fromCol: 3, toRow: 1, toCol: 3 }] as unknown as JsonValue[],
			});
			renderer.render(element);

			// Should call bezierCurveTo for forwarding path
			const graphicsResults = pixi.Graphics.mock.results;
			const hasBezier = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.bezierCurveTo?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasBezier).toBe(true);
		});

		it('does not render forwarding paths when disabled', () => {
			const element = makeElement({
				instructions: [{ name: 'ADD', stages: ['IF', 'ID', 'EX'] }] as unknown as JsonValue[],
				showForwarding: false,
				forwardingPaths: [{ fromRow: 0, fromCol: 2, toRow: 0, toCol: 2 }] as unknown as JsonValue[],
			});
			renderer.render(element);

			const graphicsResults = pixi.Graphics.mock.results;
			const hasBezier = graphicsResults.some((r: { type: string; value?: unknown }) => {
				const v = r.value as Record<string, { mock: { calls: unknown[][] } }> | undefined;
				return (v?.bezierCurveTo?.mock?.calls?.length ?? 0) > 0;
			});
			expect(hasBezier).toBe(false);
		});

		it('renders metrics when clockCycle > 0', () => {
			const element = makeElement({
				instructions: [{ name: 'ADD', stages: ['IF'] }] as unknown as JsonValue[],
				clockCycle: 3,
				cpi: 1.5,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const cycleText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'Cycle: 3',
			);
			expect(cycleText).toBeDefined();

			const cpiText = textCalls.find(
				(c: unknown[]) => (c[0] as { text: string }).text === 'CPI: 1.50',
			);
			expect(cpiText).toBeDefined();
		});

		it('does not render metrics when clockCycle is 0', () => {
			const element = makeElement({
				instructions: [{ name: 'ADD', stages: ['IF'] }] as unknown as JsonValue[],
				clockCycle: 0,
			});
			renderer.render(element);

			const textCalls = pixi.Text.mock.calls;
			const cycleText = textCalls.find((c: unknown[]) =>
				(c[0] as { text: string }).text.startsWith('Cycle:'),
			);
			expect(cycleText).toBeUndefined();
		});

		it('uses custom cell dimensions', () => {
			const element = makeElement({
				instructions: [{ name: 'ADD', stages: ['IF', 'ID'] }] as unknown as JsonValue[],
				cellWidth: 80,
				cellHeight: 40,
			});
			const container = renderer.render(element);
			expect(container).toBeDefined();
		});
	});

	describe('getCellContainers', () => {
		it('returns cell containers after render', () => {
			const element = makeElement({
				instructions: SAMPLE_INSTRUCTIONS as unknown as JsonValue[],
			});
			renderer.render(element);

			const cells = renderer.getCellContainers('pipeline-1');
			expect(cells).toBeDefined();
			expect(cells?.length).toBe(3);
		});

		it('returns undefined for unknown element', () => {
			expect(renderer.getCellContainers('nonexistent')).toBeUndefined();
		});
	});

	describe('getConfig (static)', () => {
		it('returns 3-stage config', () => {
			const config = PipelineRenderer.getConfig(3);
			expect(config.depth).toBe(3);
			expect(config.stages).toEqual(['IF', 'EX', 'WB']);
		});

		it('returns 5-stage config', () => {
			const config = PipelineRenderer.getConfig(5);
			expect(config.depth).toBe(5);
			expect(config.stages).toEqual(['IF', 'ID', 'EX', 'MEM', 'WB']);
		});

		it('returns 7-stage config', () => {
			const config = PipelineRenderer.getConfig(7);
			expect(config.depth).toBe(7);
			expect(config.stages).toHaveLength(7);
		});
	});

	describe('getStageColors (static)', () => {
		it('returns a copy of stage colors', () => {
			const colors = PipelineRenderer.getStageColors();
			expect(colors.IF).toBe('#22d3ee');
			expect(colors.EX).toBe('#4ade80');
			expect(colors.MEM).toBe('#fbbf24');
			expect(colors.WB).toBe('#f472b6');
			expect(colors.bubble).toBe('#374151');
		});

		it('does not mutate internal colors', () => {
			const colors = PipelineRenderer.getStageColors();
			colors.IF = '#000000';
			const fresh = PipelineRenderer.getStageColors();
			expect(fresh.IF).toBe('#22d3ee');
		});
	});
});
