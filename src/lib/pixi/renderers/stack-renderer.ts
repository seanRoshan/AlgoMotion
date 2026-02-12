import type { SceneElement } from '@/types';
import { hexToPixiColor } from './shared';

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

/**
 * Renderer for Stack composite elements.
 * Creates a vertical LIFO structure with frames stacked top-to-bottom.
 * Frame[0] is the top of the stack (most recently pushed).
 *
 * Rendering order:
 * Pass 1: Frame rects (Graphics) + value texts (Text)
 * Pass 2: TOP indicator text
 *
 * Frame containers are stored for GSAP animation targeting.
 */
export class StackRenderer {
	private pixi: PixiModule;
	private frameContainers: Record<string, PixiContainer[]> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const frames = (metadata.frames as unknown as (string | number)[]) ?? [];
		const frameWidth = (metadata.frameWidth as number) ?? 80;
		const frameHeight = (metadata.frameHeight as number) ?? 36;
		const gap = (metadata.gap as number) ?? 4;
		const highlightedIndex = (metadata.highlightedIndex as number) ?? -1;
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);
		const cornerRadius = style.cornerRadius;
		const stride = frameHeight + gap;

		const frameList: PixiContainer[] = [];

		if (frames.length === 0) {
			// Empty stack indicator
			const emptyStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize - 2,
				fontFamily: style.fontFamily,
				fontWeight: '400',
				fill: hexToPixiColor(style.textColor),
			});
			const emptyText = new this.pixi.Text({ text: 'EMPTY', style: emptyStyle });
			emptyText.anchor.set(0.5, 0.5);
			emptyText.position.set(frameWidth / 2, frameHeight / 2);
			container.addChild(emptyText);

			this.frameContainers[element.id] = frameList;
			return container;
		}

		// Pass 1: Frame rects and value texts
		for (let i = 0; i < frames.length; i++) {
			const y = i * stride;
			const isHighlighted = i === highlightedIndex;

			const g = new this.pixi.Graphics();
			g.roundRect(0, y, frameWidth, frameHeight, cornerRadius);
			g.fill({ color: isHighlighted ? highlightPixi : fillColor });
			g.stroke({ width: style.strokeWidth, color: strokeColor });
			container.addChild(g);

			const textStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: String(style.fontWeight),
				fill: hexToPixiColor(style.textColor),
			});
			const valueText = new this.pixi.Text({
				text: String(frames[i]),
				style: textStyle,
			});
			valueText.anchor.set(0.5, 0.5);
			valueText.position.set(frameWidth / 2, y + frameHeight / 2);
			container.addChild(valueText);

			frameList.push(container);
		}

		// Pass 2: TOP indicator — positioned to the left of frame[0]
		const topStyle = new this.pixi.TextStyle({
			fontSize: Math.max(10, style.fontSize - 4),
			fontFamily: style.fontFamily,
			fontWeight: '600',
			fill: hexToPixiColor(highlightColor),
		});
		const topText = new this.pixi.Text({ text: 'TOP', style: topStyle });
		topText.anchor.set(1, 0.5);
		topText.position.set(-8, frameHeight / 2);
		container.addChild(topText);

		this.frameContainers[element.id] = frameList;
		return container;
	}

	/**
	 * Get frame containers for animation targeting.
	 */
	getFrameContainers(elementId: string): PixiContainer[] | undefined {
		return this.frameContainers[elementId];
	}
}
