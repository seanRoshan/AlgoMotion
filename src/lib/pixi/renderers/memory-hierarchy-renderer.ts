/**
 * Renderer for Memory Hierarchy composite elements.
 *
 * Renders the complete memory hierarchy pyramid:
 * - Registers (top — smallest, fastest)
 * - L1/L2/L3 Cache
 * - Main memory (RAM)
 * - Secondary storage (Disk/SSD) (bottom — largest, slowest)
 *
 * Each level is drawn as a trapezoid whose width indicates relative
 * capacity. Speed and size labels are shown alongside each level.
 *
 * Spec reference: Section 6.3.2 (Memory Hierarchy), Virtual Memory
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

// ── Memory Hierarchy Types ──

export type MemoryLevelType = 'registers' | 'l1' | 'l2' | 'l3' | 'ram' | 'disk';

export interface MemoryLevel {
	type: MemoryLevelType;
	label: string;
	size: string;
	latency: string;
	color: string;
	highlighted: boolean;
	activeAccess?: boolean;
}

export interface TlbEntry {
	virtualPage: string;
	physicalFrame: string;
	valid: boolean;
}

// ── Default hierarchy ──

const DEFAULT_LEVELS: MemoryLevel[] = [
	{
		type: 'registers',
		label: 'Registers',
		size: '< 1 KB',
		latency: '< 1 ns',
		color: '#ef4444',
		highlighted: false,
	},
	{
		type: 'l1',
		label: 'L1 Cache',
		size: '32-64 KB',
		latency: '1-2 ns',
		color: '#f97316',
		highlighted: false,
	},
	{
		type: 'l2',
		label: 'L2 Cache',
		size: '256 KB - 1 MB',
		latency: '3-10 ns',
		color: '#fbbf24',
		highlighted: false,
	},
	{
		type: 'l3',
		label: 'L3 Cache',
		size: '4-32 MB',
		latency: '10-30 ns',
		color: '#4ade80',
		highlighted: false,
	},
	{
		type: 'ram',
		label: 'Main Memory (RAM)',
		size: '4-64 GB',
		latency: '50-100 ns',
		color: '#22d3ee',
		highlighted: false,
	},
	{
		type: 'disk',
		label: 'Disk / SSD',
		size: '256 GB - 4 TB',
		latency: '5-10 ms',
		color: '#a78bfa',
		highlighted: false,
	},
];

/**
 * Renderer for Memory Hierarchy composite elements.
 */
export class MemoryHierarchyRenderer {
	private pixi: PixiModule;
	private levelContainers: Record<string, Map<string, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a memory hierarchy pyramid.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const levels = (metadata.levels as unknown as MemoryLevel[]) ?? DEFAULT_LEVELS;
		const tlbEntries = (metadata.tlbEntries as unknown as TlbEntry[]) ?? [];
		const showTlb = (metadata.showTlb as boolean) ?? false;
		const totalWidth = element.size.width;
		const levelHeight = 35;
		const gap = 3;
		const minWidth = totalWidth * 0.2;
		const maxWidth = totalWidth * 0.9;

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);

		const levelMap = new Map<string, PixiContainer>();

		// Draw pyramid levels
		for (let i = 0; i < levels.length; i++) {
			const level = levels[i];
			const fraction = (i + 1) / levels.length;
			const levelWidth = minWidth + (maxWidth - minWidth) * fraction;
			const x = (totalWidth - levelWidth) / 2;
			const y = i * (levelHeight + gap);
			const levelColor = hexToPixiColor(level.color);

			const levelContainer = new this.pixi.Container();

			// Level trapezoid
			const g = new this.pixi.Graphics();
			if (i === 0) {
				// Top level — narrower trapezoid
				const nextWidth =
					i + 1 < levels.length
						? minWidth + (maxWidth - minWidth) * ((i + 2) / levels.length)
						: levelWidth;
				g.moveTo(x, y);
				g.lineTo(x + levelWidth, y);
				g.lineTo((totalWidth - nextWidth) / 2 + nextWidth, y + levelHeight);
				g.lineTo((totalWidth - nextWidth) / 2, y + levelHeight);
				g.closePath();
			} else {
				g.rect(x, y, levelWidth, levelHeight);
			}

			g.fill({
				color: level.highlighted ? levelColor : fillColor,
				alpha: level.highlighted ? 0.4 : 1,
			});
			g.stroke({
				width: level.highlighted ? 2 : 1,
				color: level.highlighted ? levelColor : strokeColor,
				alpha: level.highlighted ? 1 : 0.6,
			});
			container.addChild(g);
			levelContainer.addChild(g);

			// Access indicator
			if (level.activeAccess) {
				const accessG = new this.pixi.Graphics();
				accessG.circle(x + levelWidth - 12, y + levelHeight / 2, 4);
				accessG.fill({ color: levelColor, alpha: 0.9 });
				container.addChild(accessG);
				levelContainer.addChild(accessG);
			}

			// Level label (centered)
			const labelStyle = new this.pixi.TextStyle({
				fontSize: 11,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor(style.textColor),
			});
			const labelText = new this.pixi.Text({
				text: level.label,
				style: labelStyle,
			});
			labelText.anchor.set(0.5, 0.5);
			labelText.position.set(totalWidth / 2, y + levelHeight / 2);
			container.addChild(labelText);
			levelContainer.addChild(labelText);

			// Speed label (left side)
			const speedStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: levelColor,
			});
			const speedText = new this.pixi.Text({
				text: level.latency,
				style: speedStyle,
			});
			speedText.anchor.set(1, 0.5);
			speedText.position.set(x - 8, y + levelHeight / 2);
			container.addChild(speedText);
			levelContainer.addChild(speedText);

			// Size label (right side)
			const sizeStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: hexToPixiColor('#9ca3af'),
			});
			const sizeText = new this.pixi.Text({
				text: level.size,
				style: sizeStyle,
			});
			sizeText.anchor.set(0, 0.5);
			sizeText.position.set(x + levelWidth + 8, y + levelHeight / 2);
			container.addChild(sizeText);
			levelContainer.addChild(sizeText);

			levelMap.set(level.type, levelContainer);
		}

		// Draw TLB if enabled
		if (showTlb && tlbEntries.length > 0) {
			const tlbY = levels.length * (levelHeight + gap) + 15;
			this.drawTlb(container, tlbEntries, tlbY, totalWidth, style);
		}

		// Speed/Size axis labels
		const axisY = levels.length * (levelHeight + gap) + 5;
		const fastStyle = new this.pixi.TextStyle({
			fontSize: 8,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor('#ef4444'),
		});
		const fastText = new this.pixi.Text({
			text: 'Faster',
			style: fastStyle,
		});
		fastText.anchor.set(1, 0);
		fastText.position.set(minWidth / 2, -12);
		container.addChild(fastText);

		const slowStyle = new this.pixi.TextStyle({
			fontSize: 8,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor('#a78bfa'),
		});
		const slowText = new this.pixi.Text({
			text: 'Slower',
			style: slowStyle,
		});
		slowText.anchor.set(1, 0);
		slowText.position.set(minWidth / 2, axisY);
		container.addChild(slowText);

		this.levelContainers[element.id] = levelMap;
		return container;
	}

	/**
	 * Get level containers for animation targeting.
	 */
	getLevelContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.levelContainers[elementId];
	}

	// ── TLB drawing ──

	private drawTlb(
		container: PixiContainer,
		entries: TlbEntry[],
		yOffset: number,
		totalWidth: number,
		style: SceneElement['style'],
	): void {
		const tlbWidth = Math.min(300, totalWidth * 0.6);
		const tlbX = (totalWidth - tlbWidth) / 2;
		const entryHeight = 16;

		// TLB header
		const headerStyle = new this.pixi.TextStyle({
			fontSize: 10,
			fontFamily: style.fontFamily,
			fontWeight: '700',
			fill: hexToPixiColor('#22d3ee'),
		});
		const headerText = new this.pixi.Text({
			text: 'TLB (Translation Lookaside Buffer)',
			style: headerStyle,
		});
		headerText.anchor.set(0.5, 0);
		headerText.position.set(totalWidth / 2, yOffset);
		container.addChild(headerText);

		const tableY = yOffset + 18;

		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			const y = tableY + i * (entryHeight + 2);

			const entryG = new this.pixi.Graphics();
			entryG.rect(tlbX, y, tlbWidth, entryHeight);
			entryG.fill({
				color: entry.valid ? hexToPixiColor('#22d3ee') : hexToPixiColor('#374151'),
				alpha: entry.valid ? 0.15 : 0.3,
			});
			entryG.stroke({
				width: 0.5,
				color: hexToPixiColor('#4a4a6a'),
				alpha: 0.5,
			});
			container.addChild(entryG);

			if (entry.valid) {
				const entryStyle = new this.pixi.TextStyle({
					fontSize: 8,
					fontFamily: 'JetBrains Mono, monospace',
					fontWeight: '400',
					fill: hexToPixiColor(style.textColor),
				});
				const entryText = new this.pixi.Text({
					text: `VP: ${entry.virtualPage} → PF: ${entry.physicalFrame}`,
					style: entryStyle,
				});
				entryText.anchor.set(0.5, 0.5);
				entryText.position.set(totalWidth / 2, y + entryHeight / 2);
				container.addChild(entryText);
			}
		}
	}

	/**
	 * Get default memory hierarchy levels.
	 */
	static getDefaultLevels(): MemoryLevel[] {
		return [...DEFAULT_LEVELS];
	}
}
