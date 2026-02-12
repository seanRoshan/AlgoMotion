/**
 * Visual regression tests using Playwright screenshot comparison.
 *
 * Captures screenshots of key views and compares against baselines.
 * Snapshots stored in tests/visual/__snapshots__/ for CI comparison.
 *
 * Run with --update-snapshots to generate initial baselines.
 */

import { expect, test } from '@playwright/test';

test.describe('Visual Regression', () => {
	test('dashboard page', async ({ page }) => {
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('dashboard.png', {
			mask: [page.locator('[data-testid="timestamp"]')],
		});
	});

	test('login page', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('login.png');
	});

	test('editor toolbar', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		await expect(toolbar).toHaveScreenshot('editor-toolbar.png');
	});

	test('editor left panel - elements', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
		const leftPanel = page.locator('#left-panel');
		await expect(leftPanel).toHaveScreenshot('left-panel-elements.png');
	});

	test('templates page', async ({ page }) => {
		await page.goto('/templates');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('templates-page.png');
	});

	test('404 page', async ({ page }) => {
		await page.goto('/nonexistent');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('404-page.png');
	});

	test('editor canvas area', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
		// Mask the canvas element since WebGL rendering can vary
		await expect(page).toHaveScreenshot('editor-full.png', {
			mask: [page.locator('canvas')],
			maxDiffPixelRatio: 0.02,
		});
	});
});
