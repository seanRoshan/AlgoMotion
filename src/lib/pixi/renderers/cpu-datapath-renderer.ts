/**
 * Renderer for CPU Datapath composite elements.
 *
 * Renders a simplified single-cycle CPU datapath with:
 * - Register file with read/write ports
 * - ALU unit with operation display
 * - MUX components with select signal
 * - Control unit with signal outputs
 * - Program counter
 * - Instruction memory and data memory blocks
 * - Data/address/control buses connecting components
 *
 * Component containers are stored for GSAP animation targeting.
 *
 * Spec reference: Section 6.3.2 (CPU Datapath)
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

// ── Datapath Component Types ──

export type DatapathComponentType =
	| 'pc'
	| 'instructionMemory'
	| 'registerFile'
	| 'alu'
	| 'dataMemory'
	| 'controlUnit'
	| 'mux';

export interface DatapathComponent {
	type: DatapathComponentType;
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface DatapathBus {
	id: string;
	fromId: string;
	toId: string;
	label?: string;
	type: 'data' | 'address' | 'control';
}

/** Internal layout positions for each component. */
interface ComponentLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

// ── Default component layout ──

const DEFAULT_COMPONENTS: DatapathComponent[] = [
	{ type: 'pc', id: 'pc', label: 'PC', x: 0, y: 120, width: 60, height: 50 },
	{
		type: 'instructionMemory',
		id: 'imem',
		label: 'Instruction\nMemory',
		x: 100,
		y: 100,
		width: 80,
		height: 90,
	},
	{
		type: 'registerFile',
		id: 'regfile',
		label: 'Registers',
		x: 240,
		y: 80,
		width: 90,
		height: 120,
	},
	{ type: 'alu', id: 'alu', label: 'ALU', x: 400, y: 100, width: 70, height: 80 },
	{
		type: 'dataMemory',
		id: 'dmem',
		label: 'Data\nMemory',
		x: 520,
		y: 100,
		width: 80,
		height: 90,
	},
	{
		type: 'controlUnit',
		id: 'ctrl',
		label: 'Control',
		x: 240,
		y: 0,
		width: 90,
		height: 50,
	},
	{ type: 'mux', id: 'mux-wb', label: 'MUX', x: 640, y: 120, width: 40, height: 50 },
];

const DEFAULT_BUSES: DatapathBus[] = [
	{ id: 'bus-pc-imem', fromId: 'pc', toId: 'imem', type: 'address', label: 'addr' },
	{ id: 'bus-imem-ctrl', fromId: 'imem', toId: 'ctrl', type: 'data', label: 'instr' },
	{ id: 'bus-imem-reg', fromId: 'imem', toId: 'regfile', type: 'data' },
	{ id: 'bus-reg-alu', fromId: 'regfile', toId: 'alu', type: 'data' },
	{ id: 'bus-alu-dmem', fromId: 'alu', toId: 'dmem', type: 'address' },
	{ id: 'bus-dmem-mux', fromId: 'dmem', toId: 'mux-wb', type: 'data' },
	{ id: 'bus-alu-mux', fromId: 'alu', toId: 'mux-wb', type: 'data' },
	{ id: 'bus-mux-reg', fromId: 'mux-wb', toId: 'regfile', type: 'data', label: 'WB' },
	{ id: 'bus-ctrl-reg', fromId: 'ctrl', toId: 'regfile', type: 'control' },
	{ id: 'bus-ctrl-alu', fromId: 'ctrl', toId: 'alu', type: 'control' },
	{ id: 'bus-ctrl-dmem', fromId: 'ctrl', toId: 'dmem', type: 'control' },
];

// ── Bus Colors ──

const BUS_COLORS: Record<DatapathBus['type'], string> = {
	data: '#22d3ee',
	address: '#a78bfa',
	control: '#f472b6',
};

/**
 * Renderer for CPU Datapath composite elements.
 */
export class CpuDatapathRenderer {
	private pixi: PixiModule;
	private componentContainers: Record<string, Map<string, PixiContainer>> = {};
	private busGraphics: Record<string, Map<string, PixiGraphics>> = {};

	constructor(pixi: PixiModule) {
		this.pixi = pixi;
	}

	/**
	 * Render a CPU datapath element.
	 */
	render(element: SceneElement): PixiContainer {
		const container = new this.pixi.Container();
		const { style, metadata } = element;

		const components =
			(metadata.components as unknown as DatapathComponent[]) ?? DEFAULT_COMPONENTS;
		const buses = (metadata.buses as unknown as DatapathBus[]) ?? DEFAULT_BUSES;
		const highlightedComponents = (metadata.highlightedComponents as string[]) ?? [];
		const highlightedBuses = (metadata.highlightedBuses as string[]) ?? [];
		const highlightColor = (metadata.highlightColor as string) ?? '#3b82f6';
		const clockCycle = (metadata.clockCycle as number) ?? 0;
		const aluOp = (metadata.aluOp as string) ?? '';

		const fillColor = hexToPixiColor(style.fill);
		const strokeColor = hexToPixiColor(style.stroke);
		const highlightPixi = hexToPixiColor(highlightColor);

		// Build component position lookup
		const componentMap = new Map<string, ComponentLayout>();
		for (const comp of components) {
			componentMap.set(comp.id, {
				x: comp.x,
				y: comp.y,
				w: comp.width,
				h: comp.height,
			});
		}

		const compContainers = new Map<string, PixiContainer>();
		const busGfx = new Map<string, PixiGraphics>();

		// Pass 1: Draw buses (behind components)
		for (const bus of buses) {
			const fromLayout = componentMap.get(bus.fromId);
			const toLayout = componentMap.get(bus.toId);
			if (!fromLayout || !toLayout) continue;

			const isHighlighted = highlightedBuses.includes(bus.id);
			const busColor = hexToPixiColor(BUS_COLORS[bus.type]);

			const g = new this.pixi.Graphics();
			const fromX = fromLayout.x + fromLayout.w;
			const fromY = fromLayout.y + fromLayout.h / 2;
			const toX = toLayout.x;
			const toY = toLayout.y + toLayout.h / 2;

			g.moveTo(fromX, fromY);
			g.lineTo(toX, toY);
			g.stroke({
				width: isHighlighted ? 3 : 1.5,
				color: isHighlighted ? highlightPixi : busColor,
				alpha: isHighlighted ? 1 : 0.6,
			});
			container.addChild(g);

			// Bus label
			if (bus.label) {
				const midX = (fromX + toX) / 2;
				const midY = (fromY + toY) / 2;
				const labelStyle = new this.pixi.TextStyle({
					fontSize: 9,
					fontFamily: style.fontFamily,
					fontWeight: '400',
					fill: busColor,
				});
				const labelText = new this.pixi.Text({ text: bus.label, style: labelStyle });
				labelText.anchor.set(0.5, 1);
				labelText.position.set(midX, midY - 3);
				container.addChild(labelText);
			}

			busGfx.set(bus.id, g);
		}

		// Pass 2: Draw components
		for (const comp of components) {
			const isHighlighted = highlightedComponents.includes(comp.id);

			const g = new this.pixi.Graphics();

			if (comp.type === 'alu') {
				// ALU gets a trapezoid shape
				this.drawAluShape(
					g,
					comp,
					isHighlighted ? highlightPixi : fillColor,
					strokeColor,
					style.strokeWidth,
				);
			} else if (comp.type === 'mux') {
				// MUX gets a narrower shape
				this.drawMuxShape(
					g,
					comp,
					isHighlighted ? highlightPixi : fillColor,
					strokeColor,
					style.strokeWidth,
				);
			} else {
				// Standard rectangular component
				g.roundRect(comp.x, comp.y, comp.width, comp.height, 4);
				g.fill({ color: isHighlighted ? highlightPixi : fillColor });
				g.stroke({ width: style.strokeWidth, color: strokeColor });
			}
			container.addChild(g);

			// Component label
			const labelStyle = new this.pixi.TextStyle({
				fontSize: comp.type === 'pc' || comp.type === 'mux' ? 10 : 11,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor(style.textColor),
			});
			const labelText = new this.pixi.Text({
				text: comp.type === 'alu' && aluOp ? `ALU\n${aluOp}` : comp.label,
				style: labelStyle,
			});
			labelText.anchor.set(0.5, 0.5);
			labelText.position.set(comp.x + comp.width / 2, comp.y + comp.height / 2);
			container.addChild(labelText);

			compContainers.set(comp.id, container);
		}

		// Pass 3: Clock cycle counter
		if (clockCycle > 0) {
			const clockStyle = new this.pixi.TextStyle({
				fontSize: 11,
				fontFamily: style.fontFamily,
				fontWeight: '600',
				fill: hexToPixiColor('#fbbf24'),
			});
			const clockText = new this.pixi.Text({
				text: `Cycle: ${clockCycle}`,
				style: clockStyle,
			});
			clockText.anchor.set(0, 0);
			clockText.position.set(0, -20);
			container.addChild(clockText);
		}

		this.componentContainers[element.id] = compContainers;
		this.busGraphics[element.id] = busGfx;
		return container;
	}

	/**
	 * Get component containers for animation targeting.
	 */
	getComponentContainers(elementId: string): Map<string, PixiContainer> | undefined {
		return this.componentContainers[elementId];
	}

	/**
	 * Get bus graphics for animation targeting.
	 */
	getBusGraphics(elementId: string): Map<string, PixiGraphics> | undefined {
		return this.busGraphics[elementId];
	}

	// ── Shape drawing helpers ──

	private drawAluShape(
		g: PixiGraphics,
		comp: DatapathComponent,
		fillColor: number,
		strokeColor: number,
		strokeWidth: number,
	): void {
		const { x, y, width: w, height: h } = comp;
		// Trapezoid: wider at top, narrower at bottom
		const inset = w * 0.2;
		g.moveTo(x, y);
		g.lineTo(x + w, y);
		g.lineTo(x + w - inset, y + h);
		g.lineTo(x + inset, y + h);
		g.closePath();
		g.fill({ color: fillColor });
		g.stroke({ width: strokeWidth, color: strokeColor });
	}

	private drawMuxShape(
		g: PixiGraphics,
		comp: DatapathComponent,
		fillColor: number,
		strokeColor: number,
		strokeWidth: number,
	): void {
		const { x, y, width: w, height: h } = comp;
		// Trapezoid: narrower at top, wider at bottom
		const inset = w * 0.15;
		g.moveTo(x + inset, y);
		g.lineTo(x + w - inset, y);
		g.lineTo(x + w, y + h);
		g.lineTo(x, y + h);
		g.closePath();
		g.fill({ color: fillColor });
		g.stroke({ width: strokeWidth, color: strokeColor });
	}
}
