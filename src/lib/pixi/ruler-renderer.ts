/**
 * Canvas rulers along top and left edges of the canvas workspace.
 * Renders tick marks with numeric labels that adapt to zoom level.
 *
 * Uses Canvas 2D (not Pixi.js) since rulers are UI chrome rendered
 * at fixed screen positions with crisp text.
 *
 * Spec reference: Section 6.1 (rulers along top/left edges)
 */

export interface RulerRenderOptions {
	orientation: 'horizontal' | 'vertical';
	length: number;
	rulerSize: number;
	cameraX: number;
	cameraY: number;
	zoom: number;
	cursorPosition: number | null;
	backgroundColor: number;
	tickColor: number;
	labelColor: string;
	cursorColor: number;
}

/** "Nice" multipliers for human-friendly ruler intervals */
const NICE_MULTIPLIERS = [1, 2, 5];

/** Target screen spacing for major ticks (pixels) */
const TARGET_SPACING = 100;

function hexToCSS(hex: number): string {
	return `#${hex.toString(16).padStart(6, '0')}`;
}

export class RulerRenderer {
	/**
	 * Compute a "nice" tick interval in world units for the given zoom level.
	 * Returns values from the sequence 1, 2, 5, 10, 20, 50, 100, ...
	 * such that the screen spacing is close to TARGET_SPACING pixels.
	 */
	getNiceInterval(zoom: number): number {
		const rawInterval = TARGET_SPACING / zoom;
		const magnitude = 10 ** Math.floor(Math.log10(rawInterval));

		let best = magnitude;
		let bestDiff = Math.abs(magnitude * zoom - TARGET_SPACING);

		for (const m of NICE_MULTIPLIERS) {
			const candidate = magnitude * m;
			const diff = Math.abs(candidate * zoom - TARGET_SPACING);
			if (diff < bestDiff) {
				best = candidate;
				bestDiff = diff;
			}
		}

		// Also check the next magnitude up
		for (const m of NICE_MULTIPLIERS) {
			const candidate = magnitude * 10 * m;
			const diff = Math.abs(candidate * zoom - TARGET_SPACING);
			if (diff < bestDiff) {
				best = candidate;
				bestDiff = diff;
			}
		}

		return best;
	}

	render(ctx: CanvasRenderingContext2D, options: RulerRenderOptions): void {
		const { orientation, length, rulerSize } = options;

		const w = orientation === 'horizontal' ? length : rulerSize;
		const h = orientation === 'horizontal' ? rulerSize : length;

		ctx.clearRect(0, 0, w, h);

		// Background
		ctx.fillStyle = hexToCSS(options.backgroundColor);
		ctx.fillRect(0, 0, w, h);

		// Ticks and labels
		const majorInterval = this.getNiceInterval(options.zoom);
		const minorInterval = majorInterval / 5;

		if (orientation === 'horizontal') {
			this.renderHorizontal(ctx, options, majorInterval, minorInterval);
		} else {
			this.renderVertical(ctx, options, majorInterval, minorInterval);
		}

		// Cursor indicator
		if (options.cursorPosition !== null) {
			this.renderCursor(ctx, options);
		}
	}

	private renderHorizontal(
		ctx: CanvasRenderingContext2D,
		options: RulerRenderOptions,
		majorInterval: number,
		minorInterval: number,
	): void {
		const { length, rulerSize, cameraX, zoom, tickColor, labelColor } = options;

		// World range visible in the ruler
		const worldStart = -cameraX / zoom;
		const worldEnd = (length - cameraX) / zoom;

		// Align to minor interval boundaries
		const firstTick = Math.floor(worldStart / minorInterval) * minorInterval;

		ctx.strokeStyle = hexToCSS(tickColor);
		ctx.lineWidth = 1;
		ctx.font = '10px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillStyle = labelColor;

		ctx.beginPath();

		for (let world = firstTick; world <= worldEnd; world += minorInterval) {
			const screen = world * zoom + cameraX;
			if (screen < 0 || screen > length) continue;

			const isMajor = Math.abs(world % majorInterval) < minorInterval * 0.5;
			const tickHeight = isMajor ? rulerSize * 0.5 : rulerSize * 0.25;

			ctx.moveTo(screen, rulerSize);
			ctx.lineTo(screen, rulerSize - tickHeight);

			if (isMajor) {
				ctx.fillText(String(Math.round(world)), screen, 2);
			}
		}

		ctx.stroke();
	}

	private renderVertical(
		ctx: CanvasRenderingContext2D,
		options: RulerRenderOptions,
		majorInterval: number,
		minorInterval: number,
	): void {
		const { length, rulerSize, cameraY, zoom, tickColor, labelColor } = options;

		const worldStart = -cameraY / zoom;
		const worldEnd = (length - cameraY) / zoom;

		const firstTick = Math.floor(worldStart / minorInterval) * minorInterval;

		ctx.strokeStyle = hexToCSS(tickColor);
		ctx.lineWidth = 1;
		ctx.font = '10px sans-serif';
		ctx.fillStyle = labelColor;

		ctx.beginPath();

		for (let world = firstTick; world <= worldEnd; world += minorInterval) {
			const screen = world * zoom + cameraY;
			if (screen < 0 || screen > length) continue;

			const isMajor = Math.abs(world % majorInterval) < minorInterval * 0.5;
			const tickWidth = isMajor ? rulerSize * 0.5 : rulerSize * 0.25;

			ctx.moveTo(rulerSize, screen);
			ctx.lineTo(rulerSize - tickWidth, screen);

			if (isMajor) {
				ctx.save();
				ctx.translate(rulerSize * 0.4, screen);
				ctx.rotate(-Math.PI / 2);
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(String(Math.round(world)), 0, 0);
				ctx.restore();
			}
		}

		ctx.stroke();
	}

	private renderCursor(ctx: CanvasRenderingContext2D, options: RulerRenderOptions): void {
		const { orientation, rulerSize, cursorPosition, cursorColor } = options;
		if (cursorPosition === null) return;

		ctx.strokeStyle = hexToCSS(cursorColor);
		ctx.lineWidth = 1;
		ctx.beginPath();

		if (orientation === 'horizontal') {
			ctx.moveTo(cursorPosition, 0);
			ctx.lineTo(cursorPosition, rulerSize);
		} else {
			ctx.moveTo(0, cursorPosition);
			ctx.lineTo(rulerSize, cursorPosition);
		}

		ctx.stroke();
	}
}
