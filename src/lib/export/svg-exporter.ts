/**
 * SVG snapshot exporter.
 *
 * Generates a static SVG representation of the current
 * canvas frame. Produces vector graphics that are crisp
 * at any scale — ideal for print and presentations.
 *
 * Spec reference: Section 6.9 (Export System)
 */

import type { ExportResolution } from './export-types';
import { RESOLUTION_MAP } from './export-types';

export interface SvgElement {
	type: 'rect' | 'circle' | 'text' | 'line' | 'path' | 'group';
	attrs: Record<string, string | number>;
	children?: SvgElement[];
	content?: string;
}

/**
 * Interface for extracting SVG-compatible data from the scene.
 * Injectable for testing without a real Pixi.js renderer.
 */
export interface SvgSource {
	/** Get all visible elements as SVG-compatible descriptions */
	getElements(): SvgElement[];
	/** Get the background color as a CSS color string */
	getBackgroundColor(): string;
}

/**
 * Generate an SVG string from the scene source.
 */
export function exportSvgSnapshot(source: SvgSource, resolution: ExportResolution): string {
	const { width, height } = RESOLUTION_MAP[resolution];
	const elements = source.getElements();
	const bgColor = source.getBackgroundColor();

	const svgContent = elements.map((el) => renderElement(el)).join('\n  ');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}" />
  ${svgContent}
</svg>`;
}

function renderElement(el: SvgElement): string {
	const attrs = Object.entries(el.attrs)
		.map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
		.join(' ');

	if (el.type === 'group') {
		const children = (el.children ?? []).map((c) => renderElement(c)).join('\n    ');
		return `<g ${attrs}>\n    ${children}\n  </g>`;
	}

	if (el.type === 'text') {
		const content = escapeXml(el.content ?? '');
		return `<text ${attrs}>${content}</text>`;
	}

	return `<${el.type} ${attrs} />`;
}

function escapeAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
