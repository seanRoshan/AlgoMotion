/**
 * Integration tests for the service worker configuration.
 *
 * Validates that public/sw.js exists and contains
 * expected caching strategies.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SW_PATH = resolve(__dirname, '../../public/sw.js');

describe('Service Worker (public/sw.js)', () => {
	const swContent = readFileSync(SW_PATH, 'utf-8');

	it('exists and is readable', () => {
		expect(swContent.length).toBeGreaterThan(0);
	});

	it('defines a cache name', () => {
		expect(swContent).toContain('CACHE_NAME');
	});

	it('listens for install event', () => {
		expect(swContent).toContain("addEventListener('install'");
	});

	it('listens for activate event', () => {
		expect(swContent).toContain("addEventListener('activate'");
	});

	it('listens for fetch event', () => {
		expect(swContent).toContain("addEventListener('fetch'");
	});

	it('skips non-GET requests', () => {
		expect(swContent).toContain("request.method !== 'GET'");
	});

	it('skips Supabase API calls', () => {
		expect(swContent).toContain('supabase');
	});

	it('caches static assets with cache-first strategy', () => {
		expect(swContent).toContain('isStaticAsset');
		expect(swContent).toContain('caches.match(request)');
	});

	it('handles navigation requests with network-first', () => {
		expect(swContent).toContain("request.mode === 'navigate'");
	});

	it('cleans up old caches on activate', () => {
		expect(swContent).toContain('.keys()');
		expect(swContent).toContain('caches.delete');
	});
});
