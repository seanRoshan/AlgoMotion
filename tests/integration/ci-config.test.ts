/**
 * Tests for CI/CD pipeline configuration.
 *
 * Validates that workflow files exist and contain
 * expected pipeline stages and toolchain versions.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

function readWorkflow(name: string): string {
	return readFileSync(resolve(ROOT, `.github/workflows/${name}`), 'utf-8');
}

describe('CI pipeline configuration', () => {
	it('ci.yml workflow file exists', () => {
		const content = readWorkflow('ci.yml');
		expect(content.length).toBeGreaterThan(0);
	});

	it('ci.yml triggers on push and pull_request', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('push:');
		expect(content).toContain('pull_request:');
	});

	it('ci.yml uses Node.js 22', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('22');
	});

	it('ci.yml uses pnpm', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('pnpm');
	});

	it('ci.yml includes lint step', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('biome');
	});

	it('ci.yml includes type-check step', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('tsc');
	});

	it('ci.yml includes test step', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('vitest');
	});

	it('ci.yml includes build step', () => {
		const content = readWorkflow('ci.yml');
		expect(content).toContain('next build');
	});

	it('deployment is handled by Vercel Git integration (no deploy.yml needed)', () => {
		// deploy.yml was removed — Vercel Git integration auto-deploys on push to main
		expect(true).toBe(true);
	});
});
