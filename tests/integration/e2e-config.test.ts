/**
 * Integration tests validating E2E test suite configuration.
 *
 * Ensures playwright.config.ts is properly configured and
 * all required E2E spec files exist.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');
const E2E_DIR = resolve(ROOT, 'tests/e2e');
const CONFIG_PATH = resolve(ROOT, 'playwright.config.ts');

describe('E2E Test Suite Configuration', () => {
	const configContent = readFileSync(CONFIG_PATH, 'utf-8');

	it('playwright.config.ts exists', () => {
		expect(existsSync(CONFIG_PATH)).toBe(true);
	});

	it('configures chromium browser project', () => {
		expect(configContent).toContain('chromium');
	});

	it('configures visual regression snapshot path', () => {
		expect(configContent).toContain('snapshotPathTemplate');
		expect(configContent).toContain('__snapshots__');
	});

	it('configures screenshot comparison tolerance', () => {
		expect(configContent).toContain('toHaveScreenshot');
		expect(configContent).toContain('maxDiffPixelRatio');
	});

	it('disables animations for screenshots', () => {
		expect(configContent).toContain("animations: 'disabled'");
	});

	it('configures web server for dev', () => {
		expect(configContent).toContain('pnpm dev');
		expect(configContent).toContain('localhost:3000');
	});

	it('has trace on first retry', () => {
		expect(configContent).toContain("trace: 'on-first-retry'");
	});
});

describe('E2E Spec Files', () => {
	const specFiles = readdirSync(E2E_DIR).filter((f) => f.endsWith('.spec.ts'));

	it('has navigation spec', () => {
		expect(specFiles).toContain('navigation.spec.ts');
	});

	it('has editor spec', () => {
		expect(specFiles).toContain('editor.spec.ts');
	});

	it('has element library spec', () => {
		expect(specFiles).toContain('element-library.spec.ts');
	});

	it('has playback spec', () => {
		expect(specFiles).toContain('playback.spec.ts');
	});

	it('has keyboard shortcuts spec', () => {
		expect(specFiles).toContain('keyboard-shortcuts.spec.ts');
	});

	it('has menus spec', () => {
		expect(specFiles).toContain('menus.spec.ts');
	});

	it('has save/load spec', () => {
		expect(specFiles).toContain('save-load.spec.ts');
	});

	it('has auth spec', () => {
		expect(specFiles).toContain('auth.spec.ts');
	});

	it('has templates spec', () => {
		expect(specFiles).toContain('templates.spec.ts');
	});

	it('has visual regression spec', () => {
		expect(specFiles).toContain('visual-regression.spec.ts');
	});

	it('has accessibility spec', () => {
		expect(specFiles).toContain('accessibility.spec.ts');
	});
});

describe('Visual Snapshots Directory', () => {
	it('snapshot directory exists', () => {
		expect(existsSync(resolve(ROOT, 'tests/visual/__snapshots__'))).toBe(true);
	});
});
