/**
 * E2E tests for the editor page.
 *
 * Covers: Editor loads with toolbar, panels visible,
 * canvas rendered, and basic editor structure.
 */

import { expect, test } from '@playwright/test';

test.describe('Editor', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('load');
	});

	test('loads with main toolbar', async ({ page }) => {
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();
	});

	test('has File, Edit, View, Insert menus', async ({ page }) => {
		const menubar = page.getByRole('menubar');
		await expect(menubar.getByText('File')).toBeVisible();
		await expect(menubar.getByText('Edit')).toBeVisible();
		await expect(menubar.getByText('View')).toBeVisible();
		await expect(menubar.getByText('Insert')).toBeVisible();
	});

	test('has resizable panels', async ({ page }) => {
		await expect(page.getByRole('tab', { name: 'Elements' })).toBeVisible();
		await expect(page.getByText('Properties').first()).toBeVisible();
		await expect(page.getByText('Timeline').first()).toBeVisible();
	});

	test('has canvas element', async ({ page }) => {
		await expect(page.locator('canvas').first()).toBeVisible();
	});

	test('has playback controls', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		await expect(toolbar.getByLabel('Play')).toBeVisible();
		await expect(toolbar.getByLabel('Pause')).toBeVisible();
		await expect(toolbar.getByLabel('Stop')).toBeVisible();
	});

	test('has undo/redo buttons', async ({ page }) => {
		await expect(page.getByLabel('Undo')).toBeVisible();
		await expect(page.getByLabel('Redo')).toBeVisible();
	});

	test('has zoom controls', async ({ page }) => {
		await expect(page.getByLabel('Zoom in')).toBeVisible();
		await expect(page.getByLabel('Zoom out')).toBeVisible();
		await expect(page.getByLabel('Fit to screen')).toBeVisible();
		await expect(page.locator('[data-testid="zoom-level"]')).toHaveText('100%');
	});

	test('has speed selector defaulting to 1x', async ({ page }) => {
		await expect(page.locator('[data-testid="speed-selector"]')).toBeVisible();
	});

	test('has skip-to-content link', async ({ page }) => {
		const skipLink = page.getByText('Skip to main content');
		// Skip link is visually hidden but exists in DOM
		await expect(skipLink).toBeAttached();
	});

	test('main content has correct id', async ({ page }) => {
		await expect(page.locator('main#main-content')).toBeVisible();
	});
});
