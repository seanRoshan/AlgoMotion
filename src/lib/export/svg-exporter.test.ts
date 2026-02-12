/**
 * Tests for SVG snapshot exporter.
 */

import { describe, expect, it } from 'vitest';
import type { SvgElement, SvgSource } from './svg-exporter';
import { exportSvgSnapshot } from './svg-exporter';

function createMockSource(elements: SvgSource['getElements'] = () => []): SvgSource {
	return {
		getElements: elements,
		getBackgroundColor: () => '#1a1a2e',
	};
}

describe('exportSvgSnapshot', () => {
	it('generates valid SVG with correct dimensions', () => {
		const source = createMockSource();
		const svg = exportSvgSnapshot(source, '1080p');

		expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(svg).toContain('width="1920"');
		expect(svg).toContain('height="1080"');
		expect(svg).toContain('viewBox="0 0 1920 1080"');
	});

	it('includes background rect with correct color', () => {
		const source = createMockSource();
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('fill="#1a1a2e"');
	});

	it('renders rect elements', () => {
		const source = createMockSource(() => [
			{ type: 'rect', attrs: { x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' } },
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('<rect');
		expect(svg).toContain('x="10"');
		expect(svg).toContain('fill="#ff0000"');
	});

	it('renders circle elements', () => {
		const source = createMockSource(() => [
			{ type: 'circle', attrs: { cx: 50, cy: 50, r: 25, fill: '#00ff00' } },
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('<circle');
		expect(svg).toContain('cx="50"');
		expect(svg).toContain('r="25"');
	});

	it('renders text elements with content', () => {
		const source = createMockSource(() => [
			{ type: 'text', attrs: { x: 100, y: 200 }, content: 'Hello World' },
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('<text');
		expect(svg).toContain('Hello World</text>');
	});

	it('renders line elements', () => {
		const source = createMockSource(() => [
			{ type: 'line', attrs: { x1: 0, y1: 0, x2: 100, y2: 100, stroke: '#fff' } },
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('<line');
		expect(svg).toContain('x2="100"');
	});

	it('renders group elements with children', () => {
		const source = createMockSource(() => [
			{
				type: 'group',
				attrs: { transform: 'translate(10, 20)' },
				children: [{ type: 'rect', attrs: { width: 50, height: 30 } }],
			},
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('<g');
		expect(svg).toContain('translate(10, 20)');
		expect(svg).toContain('<rect');
	});

	it('escapes special characters in attributes', () => {
		const source = createMockSource(() => [
			{ type: 'rect', attrs: { 'data-label': 'a < b & c > d "quoted"' } },
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('&lt;');
		expect(svg).toContain('&amp;');
		expect(svg).toContain('&gt;');
		expect(svg).toContain('&quot;');
	});

	it('escapes special characters in text content', () => {
		const source = createMockSource(() => [
			{ type: 'text', attrs: { x: 0, y: 0 }, content: '1 < 2 & 3 > 0' },
		]);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('1 &lt; 2 &amp; 3 &gt; 0</text>');
	});

	it('uses correct dimensions for each resolution', () => {
		const source = createMockSource();

		const svg720 = exportSvgSnapshot(source, '720p');
		expect(svg720).toContain('width="1280"');

		const svg4k = exportSvgSnapshot(source, '4k');
		expect(svg4k).toContain('width="3840"');
	});

	it('renders multiple elements', () => {
		const elements: SvgElement[] = [
			{ type: 'rect', attrs: { id: 'bg', width: 100, height: 100 } },
			{ type: 'circle', attrs: { id: 'c1', cx: 50, cy: 50, r: 10 } },
			{ type: 'text', attrs: { id: 't1', x: 50, y: 50 }, content: 'Label' },
		];
		const source = createMockSource(() => elements);
		const svg = exportSvgSnapshot(source, '720p');

		expect(svg).toContain('id="bg"');
		expect(svg).toContain('id="c1"');
		expect(svg).toContain('id="t1"');
	});
});
