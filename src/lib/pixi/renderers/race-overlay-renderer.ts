/**
 * Renderer for Race Mode overlays — countdown, winner announcement,
 * lane labels, and pane dividers.
 *
 * These are rendered on top of the split canvas panes during
 * countdown and winner phases of Algorithm Race Mode.
 *
 * Spec reference: Section 16.2 (Algorithm Race Mode)
 */

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
	alpha: number;
	scale: { set(x: number, y: number): void; x: number; y: number };
	destroy(): void;
}

interface PixiModule {
	Container: new () => PixiContainer;
	Graphics: new () => PixiGraphics;
	Text: new (opts: { text: string; style: unknown }) => PixiText;
	TextStyle: new (opts: Record<string, unknown>) => Record<string, unknown>;
}

// ── Constants ──

const COUNTDOWN_FONT_SIZE = 72;
const WINNER_TITLE_FONT_SIZE = 32;
const WINNER_NAME_FONT_SIZE = 24;
const LABEL_FONT_SIZE = 12;
const LABEL_HEIGHT = 28;
const DIVIDER_COLOR = '#374151';

/**
 * Renderer for race mode overlays.
 */
export class RaceOverlayRenderer {
	private pixi: PixiModule;
	private countdownText: PixiText | undefined;
	private winnerTitle: PixiText | undefined;
	private winnerName: PixiText | undefined;

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render the countdown overlay (3, 2, 1, GO!).
	 */
	renderCountdown(value: number, width: number, height: number): PixiContainer {
		const container = new this.pixi.Container();

		// Semi-transparent backdrop
		const bg = new this.pixi.Graphics();
		bg.rect(0, 0, width, height);
		bg.fill({ color: hexToPixiColor('#000000'), alpha: 0.6 });
		container.addChild(bg);

		// Countdown text
		const displayText = value === 0 ? 'GO!' : String(value);
		const style = new this.pixi.TextStyle({
			fontSize: COUNTDOWN_FONT_SIZE,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: '900',
			fill: hexToPixiColor(value === 0 ? '#4ade80' : '#ffffff'),
		});

		const text = new this.pixi.Text({ text: displayText, style });
		text.anchor.set(0.5, 0.5);
		text.position.set(width / 2, height / 2);
		container.addChild(text);

		this.countdownText = text;
		return container;
	}

	/**
	 * Render the winner announcement overlay.
	 */
	renderWinner(algorithmName: string, width: number, height: number): PixiContainer {
		const container = new this.pixi.Container();

		// Semi-transparent backdrop
		const bg = new this.pixi.Graphics();
		bg.rect(0, 0, width, height);
		bg.fill({ color: hexToPixiColor('#000000'), alpha: 0.7 });
		container.addChild(bg);

		// Trophy circle
		const trophy = new this.pixi.Graphics();
		trophy.circle(width / 2, height / 2 - 20, 40);
		trophy.fill({ color: hexToPixiColor('#fbbf24'), alpha: 0.3 });
		container.addChild(trophy);

		// Winner title
		const titleStyle = new this.pixi.TextStyle({
			fontSize: WINNER_TITLE_FONT_SIZE,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: '900',
			fill: hexToPixiColor('#fbbf24'),
		});
		const title = new this.pixi.Text({ text: 'Winner!', style: titleStyle });
		title.anchor.set(0.5, 0.5);
		title.position.set(width / 2, height / 2 - 40);
		container.addChild(title);

		// Algorithm name
		const nameStyle = new this.pixi.TextStyle({
			fontSize: WINNER_NAME_FONT_SIZE,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: '700',
			fill: hexToPixiColor('#ffffff'),
		});
		const name = new this.pixi.Text({ text: algorithmName, style: nameStyle });
		name.anchor.set(0.5, 0.5);
		name.position.set(width / 2, height / 2 + 20);
		container.addChild(name);

		this.winnerTitle = title;
		this.winnerName = name;
		return container;
	}

	/**
	 * Render a lane label bar at the top of a pane.
	 */
	renderLaneLabel(algorithmName: string, paneWidth: number): PixiContainer {
		const container = new this.pixi.Container();

		// Background bar
		const bg = new this.pixi.Graphics();
		bg.roundRect(0, 0, paneWidth, LABEL_HEIGHT, 4);
		bg.fill({ color: hexToPixiColor('#1f2937'), alpha: 0.9 });
		container.addChild(bg);

		// Label text
		const style = new this.pixi.TextStyle({
			fontSize: LABEL_FONT_SIZE,
			fontFamily: 'JetBrains Mono, monospace',
			fontWeight: '700',
			fill: hexToPixiColor('#e5e7eb'),
		});
		const text = new this.pixi.Text({ text: algorithmName, style });
		text.anchor.set(0.5, 0.5);
		text.position.set(paneWidth / 2, LABEL_HEIGHT / 2);
		container.addChild(text);

		return container;
	}

	/**
	 * Render a vertical divider line between panes.
	 */
	renderDivider(height: number): PixiContainer {
		const container = new this.pixi.Container();

		const line = new this.pixi.Graphics();
		line.moveTo(0, 0);
		line.lineTo(0, height);
		line.stroke({ width: 2, color: hexToPixiColor(DIVIDER_COLOR), alpha: 0.8 });
		container.addChild(line);

		return container;
	}

	/**
	 * Get countdown text for animation.
	 */
	getCountdownText(): PixiText | undefined {
		return this.countdownText;
	}

	/**
	 * Get winner text objects for animation.
	 */
	getWinnerTexts(): { title: PixiText; name: PixiText } | undefined {
		if (!this.winnerTitle || !this.winnerName) return undefined;
		return { title: this.winnerTitle, name: this.winnerName };
	}
}
