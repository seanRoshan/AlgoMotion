import type { ArrowShape, SceneElement } from '@/types';
import { ArrayRenderer } from './array-renderer';
import { calculateArrowheadPoints, hexToPixiColor } from './shared';

/**
 * Minimal Pixi.js type interfaces for dependency injection.
 * Allows testing with mock objects without importing pixi.js.
 */
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
 * Manages Pixi.js display objects for SceneElements.
 * Creates, updates, and destroys Pixi.js containers based on element data.
 *
 * Receives Pixi.js classes via constructor injection (from dynamic import)
 * to avoid SSR issues and enable testing with mocks.
 *
 * Spec reference: Section 6.2
 */
export class ElementRenderer {
	private pixi: PixiModule;
	private displayObjects: Record<string, PixiContainer> = {};
	private arrayRenderer: ArrayRenderer;

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
		this.arrayRenderer = new ArrayRenderer(pixi as never);
	}

	/**
	 * Get the display object for an element by ID.
	 */
	getDisplayObject(id: string): PixiContainer | null {
		return this.displayObjects[id] ?? null;
	}

	/**
	 * Get array cell containers for animation targeting.
	 */
	getArrayCellContainers(elementId: string): unknown[] | undefined {
		return this.arrayRenderer.getCellContainers(elementId);
	}

	/**
	 * Get all currently tracked element IDs.
	 */
	getTrackedIds(): string[] {
		return Object.keys(this.displayObjects);
	}

	/**
	 * Create a Pixi.js display object for a SceneElement.
	 */
	createElement(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		container.label = `element-${element.id}`;
		container.cullable = true;

		// Apply common properties
		this.applyCommonProps(container, element);

		// Create type-specific children
		switch (element.type) {
			case 'node':
				this.renderNode(container, element);
				break;
			case 'edge':
				this.renderEdge(container, element);
				break;
			case 'rect':
				this.renderRect(container, element);
				break;
			case 'text':
				this.renderText(container, element);
				break;
			case 'arrow':
				this.renderArrow(container, element);
				break;
			case 'arrayCell': {
				const arrayContainer = this.arrayRenderer.render(element);
				container.addChild(arrayContainer);
				break;
			}
			default:
				// For unsupported types, render as a rect fallback
				this.renderRect(container, element);
				break;
		}

		this.displayObjects[element.id] = container;
		return container;
	}

	/**
	 * Update an existing display object with new element data.
	 */
	updateElement(element: SceneElement): void {
		const container = this.displayObjects[element.id];
		if (!container) return;

		this.applyCommonProps(container, element);

		// Rebuild type-specific children — properly remove and destroy
		container.removeChildren();

		switch (element.type) {
			case 'node':
				this.renderNode(container, element);
				break;
			case 'edge':
				this.renderEdge(container, element);
				break;
			case 'rect':
				this.renderRect(container, element);
				break;
			case 'text':
				this.renderText(container, element);
				break;
			case 'arrow':
				this.renderArrow(container, element);
				break;
			case 'arrayCell': {
				const arrayContainer = this.arrayRenderer.render(element);
				container.addChild(arrayContainer);
				break;
			}
			default:
				this.renderRect(container, element);
				break;
		}
	}

	/**
	 * Destroy a display object and remove from registry.
	 */
	destroyElement(id: string): void {
		const container = this.displayObjects[id];
		if (!container) return;

		container.destroy({ children: true });
		delete this.displayObjects[id];
	}

	/**
	 * Destroy all display objects.
	 */
	destroyAll(): void {
		for (const id of Object.keys(this.displayObjects)) {
			this.destroyElement(id);
		}
	}

	// ── Private: Common Properties ──

	private applyCommonProps(container: PixiContainer, element: SceneElement): void {
		container.position.set(element.position.x, element.position.y);
		container.angle = element.rotation;
		container.alpha = element.opacity;
		container.visible = element.visible;
	}

	// ── Private: Node Rendering ──

	private renderNode(container: PixiContainer, element: SceneElement): void {
		const g = new this.pixi.Graphics();
		const { size, style } = element;
		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const isCircle = size.width === size.height;

		if (isCircle) {
			const radius = size.width / 2;
			g.circle(radius, radius, radius);
		} else {
			g.roundRect(0, 0, size.width, size.height, style.cornerRadius);
		}

		g.fill({ color: fillColor });
		g.stroke({ width: style.strokeWidth, color: strokeColor });
		container.addChild(g);

		// Label
		if (element.label) {
			const textStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: String(style.fontWeight),
				fill: hexToPixiColor(style.textColor),
			});
			const text = new this.pixi.Text({ text: element.label, style: textStyle });
			text.anchor.set(0.5, 0.5);
			if (isCircle) {
				text.position.set(size.width / 2, size.height / 2);
			} else {
				text.position.set(size.width / 2, size.height / 2);
			}
			container.addChild(text);
		}
	}

	// ── Private: Edge Rendering ──

	private renderEdge(container: PixiContainer, element: SceneElement): void {
		const g = new this.pixi.Graphics();
		const { style, metadata } = element;
		const strokeColor = hexToPixiColor(style.stroke);

		const endX = (metadata.endX as number) ?? element.position.x + 100;
		const endY = (metadata.endY as number) ?? element.position.y;
		const connectionType = (metadata.connectionType as string) ?? 'straight';

		// Draw from origin (0,0) since container is at element.position
		const startX = 0;
		const startY = 0;
		const relEndX = endX - element.position.x;
		const relEndY = endY - element.position.y;

		g.moveTo(startX, startY);

		if (connectionType === 'bezier') {
			const cp1x = (metadata.cp1x as number) ?? relEndX / 3;
			const cp1y = (metadata.cp1y as number) ?? 0;
			const cp2x = (metadata.cp2x as number) ?? (relEndX * 2) / 3;
			const cp2y = (metadata.cp2y as number) ?? relEndY;
			g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, relEndX, relEndY);
		} else {
			// Straight line (default)
			g.lineTo(relEndX, relEndY);
		}

		g.stroke({ width: style.strokeWidth, color: strokeColor });

		// Arrowheads
		const arrowHead = (metadata.arrowHead as ArrowShape) ?? 'none';
		if (arrowHead !== 'none') {
			const angle = Math.atan2(relEndY - startY, relEndX - startX);
			const points = calculateArrowheadPoints(
				relEndX,
				relEndY,
				angle,
				arrowHead,
				style.strokeWidth,
			);
			if (points.length > 0) {
				g.poly(points);
				g.fill({ color: strokeColor });
			}
		}

		container.addChild(g);

		// Label at midpoint
		if (element.label) {
			const textStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: String(style.fontWeight),
				fill: hexToPixiColor(style.textColor),
			});
			const text = new this.pixi.Text({ text: element.label, style: textStyle });
			text.anchor.set(0.5, 0.5);
			text.position.set(relEndX / 2, relEndY / 2 - 12);
			container.addChild(text);
		}
	}

	// ── Private: Rect Rendering ──

	private renderRect(container: PixiContainer, element: SceneElement): void {
		const g = new this.pixi.Graphics();
		const { size, style } = element;
		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);

		if (style.cornerRadius > 0) {
			g.roundRect(0, 0, size.width, size.height, style.cornerRadius);
		} else {
			g.rect(0, 0, size.width, size.height);
		}

		g.fill({ color: fillColor });
		g.stroke({ width: style.strokeWidth, color: strokeColor });
		container.addChild(g);

		// Label
		if (element.label) {
			const textStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: String(style.fontWeight),
				fill: hexToPixiColor(style.textColor),
			});
			const text = new this.pixi.Text({ text: element.label, style: textStyle });
			text.anchor.set(0.5, 0);
			text.position.set(size.width / 2, 8);
			container.addChild(text);
		}
	}

	// ── Private: Text Rendering ──

	private renderText(container: PixiContainer, element: SceneElement): void {
		const { style, metadata } = element;
		const textAlign = (metadata.textAlign as string) ?? 'left';
		const wordWrap = metadata.wordWrap !== false;
		const lineHeight = ((metadata.lineHeight as number) ?? 1.3) * style.fontSize;

		const textStyle = new this.pixi.TextStyle({
			fontSize: style.fontSize,
			fontFamily: style.fontFamily,
			fontWeight: String(style.fontWeight),
			fill: hexToPixiColor(style.textColor),
			align: textAlign,
			wordWrap,
			wordWrapWidth: element.size.width,
			lineHeight,
		});

		const text = new this.pixi.Text({
			text: element.label ?? '',
			style: textStyle,
		});

		container.addChild(text);
	}

	// ── Private: Arrow Rendering ──

	private renderArrow(container: PixiContainer, element: SceneElement): void {
		const g = new this.pixi.Graphics();
		const { style, metadata } = element;
		const strokeColor = hexToPixiColor(style.stroke);

		const endX = (metadata.endX as number) ?? element.position.x + 100;
		const endY = (metadata.endY as number) ?? element.position.y;
		const relEndX = endX - element.position.x;
		const relEndY = endY - element.position.y;
		const curved = metadata.curved === true;

		const angle = Math.atan2(relEndY, relEndX);
		const arrowHead = (metadata.arrowHead as ArrowShape) ?? 'triangle';
		const headHeight = style.strokeWidth * 4;

		// Shorten line by arrowhead height so tip sits at endpoint
		const shortenedEndX = relEndX - headHeight * Math.cos(angle);
		const shortenedEndY = relEndY - headHeight * Math.sin(angle);

		g.moveTo(0, 0);

		if (curved) {
			const controlX = (metadata.controlX as number) ?? relEndX / 2;
			const controlY = (metadata.controlY as number) ?? relEndY / 2 - relEndX * 0.3;
			// Use bezier with control point duplicated for quadratic-like behavior
			g.bezierCurveTo(controlX, controlY, controlX, controlY, shortenedEndX, shortenedEndY);
		} else {
			g.lineTo(shortenedEndX, shortenedEndY);
		}

		g.stroke({ width: style.strokeWidth, color: strokeColor });

		// Arrowhead
		const points = calculateArrowheadPoints(relEndX, relEndY, angle, arrowHead, style.strokeWidth);
		if (points.length > 0) {
			g.poly(points);
			g.fill({ color: strokeColor });
		}

		container.addChild(g);

		// Label at midpoint
		if (element.label) {
			const textStyle = new this.pixi.TextStyle({
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: String(style.fontWeight),
				fill: hexToPixiColor(style.textColor),
			});
			const text = new this.pixi.Text({ text: element.label, style: textStyle });
			text.anchor.set(0.5, 0.5);
			text.position.set(relEndX / 2, relEndY / 2 - 12);
			container.addChild(text);
		}
	}
}
