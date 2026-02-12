/**
 * Renderer for Cache Hierarchy composite elements.
 *
 * Renders a multi-level cache system with configurable associativity:
 * - L1/L2/L3 cache levels + main memory
 * - Direct-mapped, 2-way, 4-way, 8-way, and fully-associative
 * - Cache line contents with tag/index/offset breakdown
 * - Hit/miss indicators per level
 *
 * Spec reference: Section 6.3.2 (Cache Hierarchy), Section 15.3
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

// ── Cache Types ──

export type Associativity = 1 | 2 | 4 | 8 | 'full';

export type CacheLevel = 'L1' | 'L2' | 'L3' | 'main';

export type WritePolicy = 'write-back' | 'write-through';

export interface CacheLine {
	valid: boolean;
	dirty: boolean;
	tag: string;
	data: string;
	lruCounter: number;
}

export interface CacheSet {
	lines: CacheLine[];
}

export interface CacheLevelConfig {
	level: CacheLevel;
	label: string;
	associativity: Associativity;
	sets: CacheSet[];
	hitLatency: number;
	highlighted: boolean;
	hitIndicator?: 'hit' | 'miss' | null;
}

export interface AddressBreakdown {
	tag: string;
	index: string;
	offset: string;
	tagBits: number;
	indexBits: number;
	offsetBits: number;
}

// ── Level Colors ──

const LEVEL_COLORS: Record<CacheLevel, string> = {
	L1: '#22d3ee',
	L2: '#a78bfa',
	L3: '#fbbf24',
	main: '#6b7280',
};

const HIT_COLOR = '#4ade80';
const MISS_COLOR = '#ef4444';

/**
 * Renderer for Cache Hierarchy composite elements.
 */
export class CacheHierarchyRenderer {
	private pixi: PixiModule;
	private levelContainers: Record<string, Map<string, PixiContainer>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a cache hierarchy element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const levels = (metadata.levels as unknown as CacheLevelConfig[]) ?? this.getDefaultLevels();
		const addressBreakdown = (metadata.addressBreakdown as unknown as AddressBreakdown) ?? null;
		const activeAddress = (metadata.activeAddress as string) ?? '';
		const writePolicy = (metadata.writePolicy as WritePolicy) ?? 'write-back';

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);

		const levelMap = new Map<string, PixiContainer>();

		let yOffset = 0;

		// Draw address breakdown at top if present
		if (addressBreakdown) {
			yOffset = this.drawAddressBreakdown(container, addressBreakdown, activeAddress, style);
			yOffset += 15;
		}

		// Draw each cache level
		for (const level of levels) {
			const levelContainer = this.drawCacheLevel(
				container,
				level,
				yOffset,
				style,
				fillColor,
				strokeColor,
			);
			levelMap.set(level.level, levelContainer);

			// Calculate height for this level
			const numSets = level.sets.length || 1;
			const levelHeight = Math.max(60, numSets * 22 + 35);
			yOffset += levelHeight + 10;

			// Draw connection arrow to next level
			const arrowG = new this.pixi.Graphics();
			arrowG.moveTo(150, yOffset - 10);
			arrowG.lineTo(150, yOffset);
			arrowG.stroke({ width: 1.5, color: strokeColor, alpha: 0.5 });
			container.addChild(arrowG);
		}

		// Draw write policy indicator
		const policyStyle = new this.pixi.TextStyle({
			fontSize: 9,
			fontFamily: style.fontFamily,
			fontWeight: '400',
			fill: hexToPixiColor('#9ca3af'),
		});
		const policyText = new this.pixi.Text({
			text: `Write Policy: ${writePolicy}`,
			style: policyStyle,
		});
		policyText.anchor.set(0, 0);
		policyText.position.set(0, yOffset + 5);
		container.addChild(policyText);

		this.levelContainers[element.id] = levelMap;
		return container;
	}

	/**
	 * Get level containers for animation targeting.
	 */
	getLevelContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.levelContainers[elementId];
	}

	// ── Drawing helpers ──

	private drawAddressBreakdown(
		container: PixiContainer,
		breakdown: AddressBreakdown,
		activeAddress: string,
		style: SceneElement['style'],
	): number {
		const segmentWidth = 80;
		const segmentHeight = 28;
		let x = 0;

		// Active address label
		if (activeAddress) {
			const addrStyle = new this.pixi.TextStyle({
				fontSize: 10,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor(style.textColor),
			});
			const addrText = new this.pixi.Text({
				text: `Address: ${activeAddress}`,
				style: addrStyle,
			});
			addrText.anchor.set(0, 0.5);
			addrText.position.set(0, segmentHeight / 2);
			container.addChild(addrText);
			x = 140;
		}

		// Tag segment
		const tagG = new this.pixi.Graphics();
		tagG.roundRect(x, 0, segmentWidth, segmentHeight, 3);
		tagG.fill({ color: hexToPixiColor('#22d3ee'), alpha: 0.3 });
		tagG.stroke({ width: 1, color: hexToPixiColor('#22d3ee') });
		container.addChild(tagG);

		const tagStyle = new this.pixi.TextStyle({
			fontSize: 9,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor('#22d3ee'),
		});
		const tagText = new this.pixi.Text({
			text: `Tag: ${breakdown.tag} (${breakdown.tagBits}b)`,
			style: tagStyle,
		});
		tagText.anchor.set(0.5, 0.5);
		tagText.position.set(x + segmentWidth / 2, segmentHeight / 2);
		container.addChild(tagText);

		// Index segment
		x += segmentWidth + 4;
		const idxG = new this.pixi.Graphics();
		idxG.roundRect(x, 0, segmentWidth, segmentHeight, 3);
		idxG.fill({ color: hexToPixiColor('#a78bfa'), alpha: 0.3 });
		idxG.stroke({ width: 1, color: hexToPixiColor('#a78bfa') });
		container.addChild(idxG);

		const idxStyle = new this.pixi.TextStyle({
			fontSize: 9,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor('#a78bfa'),
		});
		const idxText = new this.pixi.Text({
			text: `Index: ${breakdown.index} (${breakdown.indexBits}b)`,
			style: idxStyle,
		});
		idxText.anchor.set(0.5, 0.5);
		idxText.position.set(x + segmentWidth / 2, segmentHeight / 2);
		container.addChild(idxText);

		// Offset segment
		x += segmentWidth + 4;
		const offG = new this.pixi.Graphics();
		offG.roundRect(x, 0, segmentWidth, segmentHeight, 3);
		offG.fill({ color: hexToPixiColor('#fbbf24'), alpha: 0.3 });
		offG.stroke({ width: 1, color: hexToPixiColor('#fbbf24') });
		container.addChild(offG);

		const offStyle = new this.pixi.TextStyle({
			fontSize: 9,
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor('#fbbf24'),
		});
		const offText = new this.pixi.Text({
			text: `Offset: ${breakdown.offset} (${breakdown.offsetBits}b)`,
			style: offStyle,
		});
		offText.anchor.set(0.5, 0.5);
		offText.position.set(x + segmentWidth / 2, segmentHeight / 2);
		container.addChild(offText);

		return segmentHeight;
	}

	private drawCacheLevel(
		container: PixiContainer,
		level: CacheLevelConfig,
		yOffset: number,
		style: SceneElement['style'],
		fillColor: number,
		strokeColor: number,
	): PixiContainer {
		const levelContainer = new this.pixi.Container();
		const levelColor = hexToPixiColor(LEVEL_COLORS[level.level]);

		const ways =
			level.associativity === 'full'
				? (level.sets[0]?.lines.length ?? 1)
				: (level.associativity as number);
		const numSets = level.sets.length || 1;
		const lineWidth = 50;
		const lineHeight = 18;
		const setGap = 4;
		const totalWidth = ways * lineWidth + (ways - 1) * 2 + 20;
		const totalHeight = numSets * (lineHeight + setGap) + 35;

		// Level background
		const bg = new this.pixi.Graphics();
		bg.roundRect(0, yOffset, totalWidth, totalHeight, 6);
		bg.fill({
			color: level.highlighted ? levelColor : fillColor,
			alpha: level.highlighted ? 0.15 : 1,
		});
		bg.stroke({
			width: level.highlighted ? 2 : 1,
			color: level.highlighted ? levelColor : strokeColor,
		});
		container.addChild(bg);
		levelContainer.addChild(bg);

		// Level label
		const labelStyle = new this.pixi.TextStyle({
			fontSize: 11,
			fontFamily: style.fontFamily,
			fontWeight: '700',
			fill: levelColor,
		});
		const labelText = new this.pixi.Text({
			text: `${level.label} (${level.associativity === 'full' ? 'FA' : `${level.associativity}-way`})`,
			style: labelStyle,
		});
		labelText.anchor.set(0, 0);
		labelText.position.set(6, yOffset + 4);
		container.addChild(labelText);
		levelContainer.addChild(labelText);

		// Hit/miss indicator
		if (level.hitIndicator) {
			const indicatorColor = level.hitIndicator === 'hit' ? HIT_COLOR : MISS_COLOR;
			const indicatorStyle = new this.pixi.TextStyle({
				fontSize: 10,
				fontFamily: style.fontFamily,
				fontWeight: '700',
				fill: hexToPixiColor(indicatorColor),
			});
			const indicatorText = new this.pixi.Text({
				text: level.hitIndicator === 'hit' ? 'HIT' : 'MISS',
				style: indicatorStyle,
			});
			indicatorText.anchor.set(1, 0);
			indicatorText.position.set(totalWidth - 6, yOffset + 4);
			container.addChild(indicatorText);
			levelContainer.addChild(indicatorText);
		}

		// Latency label
		const latencyStyle = new this.pixi.TextStyle({
			fontSize: 8,
			fontFamily: style.fontFamily,
			fontWeight: '400',
			fill: hexToPixiColor('#9ca3af'),
		});
		const latencyText = new this.pixi.Text({
			text: `${level.hitLatency}ns`,
			style: latencyStyle,
		});
		latencyText.anchor.set(0.5, 0);
		latencyText.position.set(totalWidth / 2, yOffset + 4);
		container.addChild(latencyText);
		levelContainer.addChild(latencyText);

		// Draw cache lines
		const startY = yOffset + 24;
		for (let setIdx = 0; setIdx < level.sets.length; setIdx++) {
			const set = level.sets[setIdx];
			const setY = startY + setIdx * (lineHeight + setGap);

			for (let wayIdx = 0; wayIdx < set.lines.length; wayIdx++) {
				const line = set.lines[wayIdx];
				const lineX = 10 + wayIdx * (lineWidth + 2);

				const lineG = new this.pixi.Graphics();
				lineG.rect(lineX, setY, lineWidth, lineHeight);

				if (!line.valid) {
					lineG.fill({ color: fillColor, alpha: 0.3 });
				} else if (line.dirty) {
					lineG.fill({
						color: hexToPixiColor('#fbbf24'),
						alpha: 0.3,
					});
				} else {
					lineG.fill({ color: levelColor, alpha: 0.2 });
				}

				lineG.stroke({
					width: 0.5,
					color: strokeColor,
					alpha: 0.5,
				});
				container.addChild(lineG);
				levelContainer.addChild(lineG);

				// Line content text
				if (line.valid) {
					const contentStyle = new this.pixi.TextStyle({
						fontSize: 8,
						fontFamily: 'JetBrains Mono, monospace',
						fontWeight: '400',
						fill: hexToPixiColor(style.textColor),
					});
					const contentText = new this.pixi.Text({
						text: line.tag,
						style: contentStyle,
					});
					contentText.anchor.set(0.5, 0.5);
					contentText.position.set(lineX + lineWidth / 2, setY + lineHeight / 2);
					container.addChild(contentText);
					levelContainer.addChild(contentText);
				}
			}
		}

		return levelContainer;
	}

	private getDefaultLevels(): CacheLevelConfig[] {
		return [
			{
				level: 'L1',
				label: 'L1 Cache',
				associativity: 2,
				hitLatency: 1,
				highlighted: false,
				sets: [
					{
						lines: [
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
						],
					},
					{
						lines: [
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
						],
					},
				],
			},
			{
				level: 'L2',
				label: 'L2 Cache',
				associativity: 4,
				hitLatency: 10,
				highlighted: false,
				sets: [
					{
						lines: [
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
							{ valid: false, dirty: false, tag: '', data: '', lruCounter: 0 },
						],
					},
				],
			},
			{
				level: 'main',
				label: 'Main Memory',
				associativity: 'full',
				hitLatency: 100,
				highlighted: false,
				sets: [
					{
						lines: [{ valid: true, dirty: false, tag: '...', data: '', lruCounter: 0 }],
					},
				],
			},
		];
	}
}
