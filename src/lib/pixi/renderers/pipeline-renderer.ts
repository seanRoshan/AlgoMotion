/**
 * Renderer for CPU Pipeline composite elements.
 *
 * Renders a pipeline timing diagram showing instruction flow through
 * configurable pipeline stages. Supports 3-stage, 5-stage, 7-stage,
 * and superscalar configurations.
 *
 * The diagram is a grid: rows are instructions, columns are clock cycles.
 * Each cell shows the pipeline stage that instruction is in at that cycle.
 * Stalls appear as bubbles, hazards are color-coded.
 *
 * Spec reference: Section 6.3.2 (Pipeline), Section 15.3
 */

import type { SceneElement } from '@/types';
import { hexToPixiColor } from './shared';

// ── Pixi.js DI interfaces ──

interface PixiContainer {
	addChild(...children: unknown[]): void;
	removeChildren(): void;
	destroy(options?: { children: boolean }): void;
	position: { set(x: number, y: number): void; x: number; y: number };
	alpha: number;
	angle: number;
	visible: boolean;
	label: string;
	cullable: boolean;
	children: unknown[];
}

interface PixiGraphics {
	clear(): PixiGraphics;
	rect(x: number, y: number, w: number, h: number): PixiGraphics;
	roundRect(x: number, y: number, w: number, h: number, r: number): PixiGraphics;
	circle(x: number, y: number, r: number): PixiGraphics;
	fill(opts: { color: number; alpha?: number } | number): PixiGraphics;
	stroke(opts: { width: number; color: number; alpha?: number }): PixiGraphics;
	moveTo(x: number, y: number): PixiGraphics;
	lineTo(x: number, y: number): PixiGraphics;
	bezierCurveTo(
		cp1x: number,
		cp1y: number,
		cp2x: number,
		cp2y: number,
		x: number,
		y: number,
	): PixiGraphics;
	poly(points: number[]): PixiGraphics;
	closePath(): PixiGraphics;
	destroy(): void;
}

interface PixiText {
	text: string;
	style: Record<string, unknown>;
	anchor: { set(x: number, y: number): void };
	position: { set(x: number, y: number): void };
	visible: boolean;
	destroy(): void;
}

interface PixiModule {
	Container: new () => PixiContainer;
	Graphics: new () => PixiGraphics;
	Text: new (opts: { text: string; style: unknown }) => PixiText;
	TextStyle: new (opts: Record<string, unknown>) => Record<string, unknown>;
}

// ── Pipeline Types ──

export type PipelineDepth = 3 | 5 | 7;

export type StageType = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'IF1' | 'IF2' | 'EX1' | 'EX2' | 'EX3';

export type HazardType = 'data' | 'control' | 'structural';

export interface PipelineInstruction {
	name: string;
	stages: Array<StageType | 'bubble' | null>;
	hazard?: HazardType;
}

export interface PipelineConfig {
	depth: PipelineDepth;
	stages: StageType[];
}

// ── Stage configurations ──

const PIPELINE_CONFIGS: Record<PipelineDepth, PipelineConfig> = {
	3: {
		depth: 3,
		stages: ['IF', 'EX', 'WB'],
	},
	5: {
		depth: 5,
		stages: ['IF', 'ID', 'EX', 'MEM', 'WB'],
	},
	7: {
		depth: 7,
		stages: ['IF1', 'IF2', 'ID', 'EX1', 'EX2', 'MEM', 'WB'],
	},
};

// ── Stage Colors ──

const STAGE_COLORS: Record<string, string> = {
	IF: '#22d3ee',
	IF1: '#22d3ee',
	IF2: '#06b6d4',
	ID: '#a78bfa',
	EX: '#4ade80',
	EX1: '#4ade80',
	EX2: '#22c55e',
	EX3: '#16a34a',
	MEM: '#fbbf24',
	WB: '#f472b6',
	bubble: '#374151',
};

const HAZARD_COLORS: Record<HazardType, string> = {
	data: '#ef4444',
	control: '#f97316',
	structural: '#eab308',
};

/**
 * Renderer for CPU Pipeline composite elements.
 */
export class PipelineRenderer {
	private pixi: PixiModule;
	private cellContainers: Record<string, PixiContainer[][]> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a pipeline timing diagram.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const depth = (metadata.depth as number as PipelineDepth) ?? 5;
		const config = PIPELINE_CONFIGS[depth] ?? PIPELINE_CONFIGS[5];
		const instructions = (metadata.instructions as unknown as PipelineInstruction[]) ?? [];
		const currentCycle = (metadata.currentCycle as number) ?? -1;
		const cellWidth = (metadata.cellWidth as number) ?? 60;
		const cellHeight = (metadata.cellHeight as number) ?? 30;
		const showForwarding = (metadata.showForwarding as boolean) ?? false;
		const forwardingPaths =
			(metadata.forwardingPaths as unknown as Array<{
				fromRow: number;
				fromCol: number;
				toRow: number;
				toCol: number;
			}>) ?? [];

		const clockCycle = (metadata.clockCycle as number) ?? 0;
		const cpi = (metadata.cpi as number) ?? 0;

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);

		// Calculate grid dimensions
		const maxCycles = instructions.reduce((max, inst) => Math.max(max, inst.stages.length), 0);
		const headerHeight = cellHeight;
		const labelWidth = 80;

		const cells: PixiContainer[][] = [];

		// Draw column headers (cycle numbers)
		for (let col = 0; col < maxCycles; col++) {
			const x = labelWidth + col * cellWidth;
			const isCurrentCycle = col === currentCycle;

			const headerG = new this.pixi.Graphics();
			headerG.rect(x, 0, cellWidth, headerHeight);
			headerG.fill({
				color: isCurrentCycle ? hexToPixiColor('#3b82f6') : fillColor,
				alpha: isCurrentCycle ? 0.3 : 1,
			});
			headerG.stroke({ width: 0.5, color: strokeColor, alpha: 0.3 });
			container.addChild(headerG);

			const headerStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor(style.textColor),
			});
			const headerText = new this.pixi.Text({ text: `CC${col + 1}`, style: headerStyle });
			headerText.anchor.set(0.5, 0.5);
			headerText.position.set(x + cellWidth / 2, headerHeight / 2);
			container.addChild(headerText);
		}

		// Draw row headers (stage names as column at top)
		const stageHeaderStyle = new this.pixi.TextStyle({
			fontSize: 9,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor(style.textColor),
		});
		const stageHeaderText = new this.pixi.Text({ text: 'Instr', style: stageHeaderStyle });
		stageHeaderText.anchor.set(0.5, 0.5);
		stageHeaderText.position.set(labelWidth / 2, headerHeight / 2);
		container.addChild(stageHeaderText);

		// Draw instruction rows
		for (let row = 0; row < instructions.length; row++) {
			const inst = instructions[row];
			const y = headerHeight + row * cellHeight;
			const rowCells: PixiContainer[] = [];

			// Instruction label
			const labelG = new this.pixi.Graphics();
			labelG.rect(0, y, labelWidth, cellHeight);
			labelG.fill({ color: fillColor });
			labelG.stroke({ width: 0.5, color: strokeColor, alpha: 0.3 });
			container.addChild(labelG);

			const labelStyle = new this.pixi.TextStyle({
				fontSize: 10,
				fontFamily: style.fontFamily,
				fontWeight: inst.hazard ? '700' : '400',
				fill: inst.hazard
					? hexToPixiColor(HAZARD_COLORS[inst.hazard])
					: hexToPixiColor(style.textColor),
			});
			const labelText = new this.pixi.Text({ text: inst.name, style: labelStyle });
			labelText.anchor.set(0, 0.5);
			labelText.position.set(4, y + cellHeight / 2);
			container.addChild(labelText);

			// Stage cells
			for (let col = 0; col < inst.stages.length; col++) {
				const stage = inst.stages[col];
				const x = labelWidth + col * cellWidth;

				const cellG = new this.pixi.Graphics();
				cellG.rect(x, y, cellWidth, cellHeight);

				if (stage && stage !== 'bubble') {
					const stageColor = hexToPixiColor(STAGE_COLORS[stage] ?? '#6366f1');
					cellG.fill({ color: stageColor, alpha: 0.8 });
				} else if (stage === 'bubble') {
					cellG.fill({
						color: hexToPixiColor(STAGE_COLORS.bubble),
						alpha: 0.4,
					});
				} else {
					cellG.fill({ color: fillColor, alpha: 0.1 });
				}

				cellG.stroke({ width: 0.5, color: strokeColor, alpha: 0.3 });
				container.addChild(cellG);

				// Stage label inside cell
				if (stage) {
					const stageTextStyle = new this.pixi.TextStyle({
						fontSize: 10,
						fontFamily: style.fontFamily,
						fontWeight: '600',
						fill: hexToPixiColor('#ffffff'),
					});
					const stageText = new this.pixi.Text({
						text: stage === 'bubble' ? '—' : stage,
						style: stageTextStyle,
					});
					stageText.anchor.set(0.5, 0.5);
					stageText.position.set(x + cellWidth / 2, y + cellHeight / 2);
					container.addChild(stageText);
				}

				rowCells.push(container);
			}

			cells.push(rowCells);
		}

		// Draw forwarding paths
		if (showForwarding) {
			for (const path of forwardingPaths) {
				const fromX = labelWidth + path.fromCol * cellWidth + cellWidth / 2;
				const fromY = headerHeight + path.fromRow * cellHeight + cellHeight;
				const toX = labelWidth + path.toCol * cellWidth + cellWidth / 2;
				const toY = headerHeight + path.toRow * cellHeight;

				const fwdG = new this.pixi.Graphics();
				fwdG.moveTo(fromX, fromY);
				fwdG.bezierCurveTo(fromX, fromY + 15, toX, toY - 15, toX, toY);
				fwdG.stroke({
					width: 2,
					color: hexToPixiColor('#f97316'),
					alpha: 0.8,
				});
				container.addChild(fwdG);
			}
		}

		// Metrics display
		const metricsY = headerHeight + instructions.length * cellHeight + 10;

		if (clockCycle > 0) {
			const metricsStyle = new this.pixi.TextStyle({
				fontSize: 10,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor('#fbbf24'),
			});
			const cycleText = new this.pixi.Text({
				text: `Cycle: ${clockCycle}`,
				style: metricsStyle,
			});
			cycleText.anchor.set(0, 0);
			cycleText.position.set(0, metricsY);
			container.addChild(cycleText);

			if (cpi > 0) {
				const cpiText = new this.pixi.Text({
					text: `CPI: ${cpi.toFixed(2)}`,
					style: metricsStyle,
				});
				cpiText.anchor.set(0, 0);
				cpiText.position.set(100, metricsY);
				container.addChild(cpiText);
			}
		}

		this.cellContainers[element.id] = cells;
		return container;
	}

	/**
	 * Get cell containers for animation targeting.
	 */
	getCellContainers(elementId: string): PixiContainer[][] | undefined {
		return this.cellContainers[elementId];
	}

	/**
	 * Get the pipeline configuration for a given depth.
	 */
	static getConfig(depth: PipelineDepth): PipelineConfig {
		return PIPELINE_CONFIGS[depth] ?? PIPELINE_CONFIGS[5];
	}

	/**
	 * Get available stage colors.
	 */
	static getStageColors(): Record<string, string> {
		return { ...STAGE_COLORS };
	}
}
