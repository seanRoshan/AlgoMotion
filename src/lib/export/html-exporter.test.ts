/**
 * Tests for HTML embed exporter.
 */

import { describe, expect, it } from 'vitest';
import type { HtmlEmbedOptions } from './html-exporter';
import { exportHtmlEmbed } from './html-exporter';

function createOptions(overrides: Partial<HtmlEmbedOptions> = {}): HtmlEmbedOptions {
	return {
		sceneData: { elements: {}, elementIds: [] },
		title: 'Test Animation',
		width: 1920,
		height: 1080,
		duration: 10,
		autoplay: false,
		loop: false,
		showControls: true,
		backgroundColor: '#1a1a2e',
		...overrides,
	};
}

describe('exportHtmlEmbed', () => {
	it('generates valid HTML document', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('<html lang="en">');
		expect(html).toContain('</html>');
	});

	it('includes correct title', () => {
		const html = exportHtmlEmbed(createOptions({ title: 'Bubble Sort Demo' }));
		expect(html).toContain('<title>Bubble Sort Demo — AlgoMotion</title>');
	});

	it('sets correct canvas dimensions', () => {
		const html = exportHtmlEmbed(createOptions({ width: 1280, height: 720 }));
		expect(html).toContain('width="1280"');
		expect(html).toContain('height="720"');
	});

	it('embeds scene data as JSON', () => {
		const data = { elements: { node1: { type: 'rect' } } };
		const html = exportHtmlEmbed(createOptions({ sceneData: data }));
		expect(html).toContain(JSON.stringify(data));
	});

	it('sets autoplay flag', () => {
		const html = exportHtmlEmbed(createOptions({ autoplay: true }));
		expect(html).toContain('var AUTOPLAY=true');
	});

	it('sets loop flag', () => {
		const html = exportHtmlEmbed(createOptions({ loop: true }));
		expect(html).toContain('var LOOP=true');
	});

	it('hides controls when showControls is false', () => {
		const html = exportHtmlEmbed(createOptions({ showControls: false }));
		expect(html).toContain('display:none');
	});

	it('shows controls when showControls is true', () => {
		const html = exportHtmlEmbed(createOptions({ showControls: true }));
		expect(html).toContain('display:flex');
	});

	it('includes animation duration', () => {
		const html = exportHtmlEmbed(createOptions({ duration: 15.5 }));
		expect(html).toContain('var DURATION=15.5');
	});

	it('includes play/pause button', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('id="am-play"');
		expect(html).toContain('Play');
	});

	it('includes progress bar', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('id="am-progress"');
		expect(html).toContain('id="am-fill"');
	});

	it('includes speed control', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('id="am-speed"');
		expect(html).toContain('1x');
	});

	it('includes time display', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('id="am-time"');
	});

	it('sets background color', () => {
		const html = exportHtmlEmbed(createOptions({ backgroundColor: '#222233' }));
		expect(html).toContain('#222233');
	});

	it('escapes HTML in title', () => {
		const html = exportHtmlEmbed(createOptions({ title: '<script>alert("xss")</script>' }));
		expect(html).not.toContain('<script>alert("xss")</script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('is self-contained (no external URLs)', () => {
		const html = exportHtmlEmbed(createOptions());
		// Should not reference any external CDN or URL
		expect(html).not.toContain('https://');
		expect(html).not.toContain('http://');
	});

	it('includes responsive viewport meta tag', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('name="viewport"');
		expect(html).toContain('width=device-width');
	});

	it('includes player styling', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('.am-player');
		expect(html).toContain('.am-controls');
		expect(html).toContain('.am-btn');
	});

	it('includes requestAnimationFrame loop', () => {
		const html = exportHtmlEmbed(createOptions());
		expect(html).toContain('requestAnimationFrame');
	});
});
