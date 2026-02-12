/**
 * Renderer for Metrics Overlay — real-time algorithm performance display.
 *
 * Shows step counter, comparisons, swaps, memory accesses,
 * time complexity, and space complexity in a semi-transparent
 * overlay panel. Designed to be positioned in the top-right
 * corner of the canvas viewport.
 *
 * Spec reference: Section 16.1 (Metrics Overlay)
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

// ── Types ──

export interface MetricsData {
	currentStep: number;
	totalSteps: number;
	comparisons: number;
	swaps: number;
	memoryReads: number;
	memoryWrites: number;
	timeComplexity: string;
	spaceComplexity: string;
}

// ── Colors ──

const METRIC_COLORS: Record<string, string> = {
	steps: '#e5e7eb',
	comparisons: '#fbbf24',
	swaps: '#a78bfa',
	memory: '#22d3ee',
	time: '#4ade80',
	space: '#f97316',
};

// ── Constants ──

const PANEL_WIDTH = 180;
const ROW_HEIGHT = 18;
const PADDING = 10;

/**
 * Renderer for Metrics Overlay.
 */
export class MetricsOverlayRenderer {
	private pixi: PixiModule;
	private metricTexts: Record<string, Map<string, PixiText>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a metrics overlay element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const metrics: MetricsData = {
			currentStep: (metadata.currentStep as number) ?? 0,
			totalSteps: (metadata.totalSteps as number) ?? 0,
			comparisons: (metadata.comparisons as number) ?? 0,
			swaps: (metadata.swaps as number) ?? 0,
			memoryReads: (metadata.memoryReads as number) ?? 0,
			memoryWrites: (metadata.memoryWrites as number) ?? 0,
			timeComplexity: (metadata.timeComplexity as string) ?? '',
			spaceComplexity: (metadata.spaceComplexity as string) ?? '',
		};

		const showMemory = (metadata.showMemory as boolean) ?? true;
		const showComplexity = (metadata.showComplexity as boolean) ?? true;

		const textMap = new Map<string, PixiText>();

		// Build rows
		const rows: Array<{ key: string; label: string; value: string; color: string }> = [
			{
				key: 'steps',
				label: 'Step',
				value: `${metrics.currentStep} / ${metrics.totalSteps}`,
				color: METRIC_COLORS.steps,
			},
			{
				key: 'comparisons',
				label: 'Comparisons',
				value: String(metrics.comparisons),
				color: METRIC_COLORS.comparisons,
			},
			{
				key: 'swaps',
				label: 'Swaps',
				value: String(metrics.swaps),
				color: METRIC_COLORS.swaps,
			},
		];

		if (showMemory) {
			rows.push({
				key: 'memory',
				label: 'Memory',
				value: `R:${metrics.memoryReads} W:${metrics.memoryWrites}`,
				color: METRIC_COLORS.memory,
			});
		}

		if (showComplexity && metrics.timeComplexity) {
			rows.push({
				key: 'time',
				label: 'Time',
				value: metrics.timeComplexity,
				color: METRIC_COLORS.time,
			});
		}

		if (showComplexity && metrics.spaceComplexity) {
			rows.push({
				key: 'space',
				label: 'Space',
				value: metrics.spaceComplexity,
				color: METRIC_COLORS.space,
			});
		}

		const panelHeight = PADDING * 2 + rows.length * ROW_HEIGHT + 16;

		// Background panel
		const bg = new this.pixi.Graphics();
		bg.roundRect(0, 0, PANEL_WIDTH, panelHeight, 6);
		bg.fill({ color: hexToPixiColor('#111827'), alpha: 0.85 });
		bg.stroke({ width: 1, color: hexToPixiColor('#374151'), alpha: 0.6 });
		container.addChild(bg);

		// Title
		const titleStyle = new this.pixi.TextStyle({
			fontSize: 9,
			fontFamily: style.fontFamily,
			fontWeight: '700',
			fill: hexToPixiColor('#e5e7eb'),
		});
		const titleText = new this.pixi.Text({ text: 'Metrics', style: titleStyle });
		titleText.anchor.set(0, 0);
		titleText.position.set(PADDING, PADDING);
		container.addChild(titleText);

		// Metric rows
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const y = PADDING + 16 + i * ROW_HEIGHT;

			// Color dot
			const dotG = new this.pixi.Graphics();
			dotG.circle(PADDING + 4, y + 5, 3);
			dotG.fill({ color: hexToPixiColor(row.color) });
			container.addChild(dotG);

			// Label
			const labelStyle = new this.pixi.TextStyle({
				fontSize: 8,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: hexToPixiColor('#9ca3af'),
			});
			const labelText = new this.pixi.Text({ text: row.label, style: labelStyle });
			labelText.anchor.set(0, 0);
			labelText.position.set(PADDING + 12, y);
			container.addChild(labelText);

			// Value
			const valueStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '700',
				fill: hexToPixiColor(row.color),
			});
			const valueText = new this.pixi.Text({ text: row.value, style: valueStyle });
			valueText.anchor.set(1, 0);
			valueText.position.set(PANEL_WIDTH - PADDING, y);
			container.addChild(valueText);

			textMap.set(row.key, valueText as unknown as PixiText);
		}

		this.metricTexts[element.id] = textMap;
		return container;
	}

	/**
	 * Get metric text objects for animation (flash on increment).
	 */
	getMetricTexts(elementId: string): Map<string, PixiText> | undefined {
		return this.metricTexts[elementId];
	}
}
