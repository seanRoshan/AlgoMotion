/**
 * E2E tests for menu interactions.
 *
 * Covers: File menu, Edit menu, View menu, Insert menu,
 * and their respective items and shortcuts.
 */

import { expect, test } from '@playwright/test';

test.describe('Menus', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
	});

	test('File menu opens and shows items', async ({ page }) => {
		await page.getByRole('menubar').getByText('File').click();
		await expect(page.getByText('New Project')).toBeVisible();
		await expect(page.getByText('Save')).toBeVisible();
		await expect(page.getByText('Export...')).toBeVisible();
	});

	test('Edit menu opens and shows items', async ({ page }) => {
		await page.getByRole('menubar').getByText('Edit').click();
		await expect(page.getByText('Undo')).toBeVisible();
		await expect(page.getByText('Redo')).toBeVisible();
		await expect(page.getByText('Copy')).toBeVisible();
		await expect(page.getByText('Paste')).toBeVisible();
		await expect(page.getByText('Delete')).toBeVisible();
	});

	test('View menu opens and shows panel toggles', async ({ page }) => {
		await page.getByRole('menubar').getByText('View').click();
		await expect(page.getByText('Toggle Left Panel')).toBeVisible();
		await expect(page.getByText('Toggle Right Panel')).toBeVisible();
		await expect(page.getByText('Toggle Bottom Panel')).toBeVisible();
		await expect(page.getByText('Command Palette')).toBeVisible();
	});

	test('Insert menu opens and shows element types', async ({ page }) => {
		await page.getByRole('menubar').getByText('Insert').click();
		await expect(page.getByText('Rectangle')).toBeVisible();
		await expect(page.getByText('Ellipse')).toBeVisible();
		await expect(page.getByText('Text')).toBeVisible();
		await expect(page.getByText('Arrow')).toBeVisible();
	});

	test('menu items show keyboard shortcuts', async ({ page }) => {
		await page.getByRole('menubar').getByText('File').click();
		await expect(page.getByText('Ctrl+N')).toBeVisible();
		await expect(page.getByText('Ctrl+S')).toBeVisible();
	});
});
