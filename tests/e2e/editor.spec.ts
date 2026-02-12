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
		await page.waitForLoadState('networkidle');
	});

	test('loads with main toolbar', async ({ page }) => {
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();
	});

	test('has File, Edit, View, Insert menus', async ({ page }) => {
		await expect(page.getByRole('menubar').getByText('File')).toBeVisible();
		await expect(page.getByRole('menubar').getByText('Edit')).toBeVisible();
		await expect(page.getByRole('menubar').getByText('View')).toBeVisible();
		await expect(page.getByRole('menubar').getByText('Insert')).toBeVisible();
	});

	test('has resizable panels', async ({ page }) => {
		await expect(page.getByText('Elements')).toBeVisible();
		await expect(page.getByText('Properties')).toBeVisible();
		await expect(page.getByText('Timeline')).toBeVisible();
	});

	test('has canvas element', async ({ page }) => {
		await expect(page.locator('canvas')).toBeVisible();
	});

	test('has playback controls', async ({ page }) => {
		await expect(page.getByLabel('Play')).toBeVisible();
		await expect(page.getByLabel('Pause')).toBeVisible();
		await expect(page.getByLabel('Stop')).toBeVisible();
	});

	test('has undo/redo buttons', async ({ page }) => {
		await expect(page.getByLabel('Undo')).toBeVisible();
		await expect(page.getByLabel('Redo')).toBeVisible();
	});

	test('has zoom controls', async ({ page }) => {
		await expect(page.getByLabel('Zoom in')).toBeVisible();
		await expect(page.getByLabel('Zoom out')).toBeVisible();
		await expect(page.getByLabel('Fit to screen')).toBeVisible();
		await expect(page.getByText('100%')).toBeVisible();
	});

	test('has speed selector defaulting to 1x', async ({ page }) => {
		await expect(page.getByText('1x')).toBeVisible();
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
