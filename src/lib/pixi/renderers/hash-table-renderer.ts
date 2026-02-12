/**
 * Renderer for Hash Table composite elements.
 *
 * Visualizes a hash table with vertical bucket array and horizontal
 * chaining for collision resolution. Shows hash function computation
 * (key → index) and collision indicators.
 *
 * Bucket and chain node containers are stored for GSAP animations.
 *
 * Spec reference: Section 6.3.1 (Hash Table)
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

// ── Hash Table Types ──

export interface HashEntry {
	key: string;
	value: string;
	bucketIndex: number;
	chainPosition: number;
}

export interface HashBucket {
	index: number;
	entries: HashEntry[];
	hasCollision: boolean;
}

interface NodePosition {
	x: number;
	y: number;
}

// ── Constants ──

const BUCKET_WIDTH = 50;
const BUCKET_HEIGHT = 36;
const CHAIN_NODE_SIZE = 32;
const CHAIN_GAP = 12;
const COLLISION_COLOR = '#f97316';
const BUCKET_LABEL_COLOR = '#9ca3af';

/**
 * Renderer for Hash Table composite elements.
 */
export class HashTableRenderer {
	private pixi: PixiModule;
	private bucketContainers: Record<string, Map<number, PixiContainer>> = {};
	private entryContainers: Record<string, Map<string, PixiContainer>> = {};
	private entryPositions: Record<string, Map<string, NodePosition>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a hash table element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const buckets = (metadata.buckets as unknown as HashBucket[]) ?? [];
		const tableSize = (metadata.tableSize as number) ?? buckets.length;
		const hashFunction = (metadata.hashFunction as string) ?? '';
		const highlightedBucket = (metadata.highlightedBucket as number) ?? -1;
		const highlightedKey = (metadata.highlightedKey as string) ?? '';
		const showLoadFactor = (metadata.showLoadFactor as boolean) ?? true;

		const bucketMap = new Map<number, PixiContainer>();
		const entryMap = new Map<string, PixiContainer>();
		const posMap = new Map<string, NodePosition>();

		if (tableSize === 0) {
			this.bucketContainers[element.id] = bucketMap;
			this.entryContainers[element.id] = entryMap;
			this.entryPositions[element.id] = posMap;
			return container;
		}

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightColor = hexToPixiColor('#3b82f6');
		const collisionPixi = hexToPixiColor(COLLISION_COLOR);

		const bucketIndexSet = new Map<number, HashBucket>();
		for (const bucket of buckets) {
			bucketIndexSet.set(bucket.index, bucket);
		}

		// Hash function label
		if (hashFunction) {
			const fnStyle = new this.pixi.TextStyle({
				fontSize: 10,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor('#e5e7eb'),
			});
			const fnText = new this.pixi.Text({
				text: `h(k) = ${hashFunction}`,
				style: fnStyle,
			});
			fnText.anchor.set(0, 1);
			fnText.position.set(0, -8);
			container.addChild(fnText);
		}

		// Draw buckets
		for (let i = 0; i < tableSize; i++) {
			const y = i * (BUCKET_HEIGHT + 4);
			const isHighlighted = i === highlightedBucket;
			const bucket = bucketIndexSet.get(i);

			// Bucket rectangle
			const bucketG = new this.pixi.Graphics();
			bucketG.rect(0, y, BUCKET_WIDTH, BUCKET_HEIGHT);
			const bucketColor = isHighlighted ? highlightColor : fillColor;
			bucketG.fill({ color: bucketColor, alpha: 0.8 });
			bucketG.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(bucketG);

			// Bucket index label
			const idxStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor(BUCKET_LABEL_COLOR),
			});
			const idxText = new this.pixi.Text({
				text: String(i),
				style: idxStyle,
			});
			idxText.anchor.set(1, 0.5);
			idxText.position.set(-6, y + BUCKET_HEIGHT / 2);
			container.addChild(idxText);

			// Collision indicator
			if (bucket?.hasCollision) {
				const collG = new this.pixi.Graphics();
				collG.circle(BUCKET_WIDTH - 6, y + 6, 3);
				collG.fill({ color: collisionPixi });
				container.addChild(collG);
			}

			bucketMap.set(i, container);

			// Chain entries
			if (bucket) {
				for (let j = 0; j < bucket.entries.length; j++) {
					const entry = bucket.entries[j];
					const chainX = BUCKET_WIDTH + CHAIN_GAP + j * (CHAIN_NODE_SIZE + CHAIN_GAP);
					const chainY = y + (BUCKET_HEIGHT - CHAIN_NODE_SIZE) / 2;
					const isKeyHighlighted = entry.key === highlightedKey;

					// Arrow from bucket/previous node
					if (j === 0) {
						const arrowG = new this.pixi.Graphics();
						arrowG.moveTo(BUCKET_WIDTH, y + BUCKET_HEIGHT / 2);
						arrowG.lineTo(chainX, y + BUCKET_HEIGHT / 2);
						arrowG.stroke({ width: 1, color: strokeColor, alpha: 0.5 });
						container.addChild(arrowG);
					}

					// Chain node
					const nodeG = new this.pixi.Graphics();
					nodeG.roundRect(chainX, chainY, CHAIN_NODE_SIZE, CHAIN_NODE_SIZE, 4);
					const nodeColor = isKeyHighlighted ? highlightColor : fillColor;
					nodeG.fill({ color: nodeColor });
					nodeG.stroke({ width: 1, color: strokeColor });
					container.addChild(nodeG);

					// Key text
					const keyStyle = new this.pixi.TextStyle({
						fontSize: 8,
						fontFamily: style.fontFamily,
						fontWeight: '700',
						fill: hexToPixiColor(style.textColor),
					});
					const keyText = new this.pixi.Text({
						text: entry.key,
						style: keyStyle,
					});
					keyText.anchor.set(0.5, 0.5);
					keyText.position.set(chainX + CHAIN_NODE_SIZE / 2, chainY + CHAIN_NODE_SIZE / 2 - 4);
					container.addChild(keyText);

					// Value text (below key)
					const valStyle = new this.pixi.TextStyle({
						fontSize: 7,
						fontFamily: style.fontFamily,
						fontWeight: '400',
						fill: hexToPixiColor('#9ca3af'),
					});
					const valText = new this.pixi.Text({
						text: entry.value,
						style: valStyle,
					});
					valText.anchor.set(0.5, 0.5);
					valText.position.set(chainX + CHAIN_NODE_SIZE / 2, chainY + CHAIN_NODE_SIZE / 2 + 6);
					container.addChild(valText);

					// Chain link arrow
					if (j < bucket.entries.length - 1) {
						const linkG = new this.pixi.Graphics();
						linkG.moveTo(chainX + CHAIN_NODE_SIZE, y + BUCKET_HEIGHT / 2);
						linkG.lineTo(chainX + CHAIN_NODE_SIZE + CHAIN_GAP, y + BUCKET_HEIGHT / 2);
						linkG.stroke({ width: 1, color: strokeColor, alpha: 0.5 });
						container.addChild(linkG);
					}

					const entryPos: NodePosition = {
						x: chainX + CHAIN_NODE_SIZE / 2,
						y: chainY + CHAIN_NODE_SIZE / 2,
					};
					posMap.set(entry.key, entryPos);
					entryMap.set(entry.key, container);
				}
			}
		}

		// Load factor
		if (showLoadFactor) {
			const totalEntries = buckets.reduce((sum, b) => sum + b.entries.length, 0);
			const loadFactor = tableSize > 0 ? (totalEntries / tableSize).toFixed(2) : '0.00';
			const lfStyle = new this.pixi.TextStyle({
				fontSize: 9,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: hexToPixiColor('#6b7280'),
			});
			const lfText = new this.pixi.Text({
				text: `Load factor: ${loadFactor}`,
				style: lfStyle,
			});
			lfText.anchor.set(0, 0);
			lfText.position.set(0, tableSize * (BUCKET_HEIGHT + 4) + 8);
			container.addChild(lfText);
		}

		this.bucketContainers[element.id] = bucketMap;
		this.entryContainers[element.id] = entryMap;
		this.entryPositions[element.id] = posMap;
		return container;
	}

	/**
	 * Get bucket containers for animation targeting.
	 */
	getBucketContainers(elementId: string): Map<number, PixiContainer> | undefined {
		return this.bucketContainers[elementId];
	}

	/**
	 * Get entry containers for animation targeting.
	 */
	getEntryContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.entryContainers[elementId];
	}

	/**
	 * Get entry positions for animation targeting.
	 */
	getEntryPositions(elementId: string): Map<string, NodePosition> | undefined {
		return this.entryPositions[elementId];
	}
}
