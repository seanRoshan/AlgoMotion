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
		await expect(page.getByRole('menuitem', { name: /New Project/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Save/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Export/ })).toBeVisible();
	});

	test('Edit menu opens and shows items', async ({ page }) => {
		await page.getByRole('menubar').getByText('Edit').click();
		await expect(page.getByRole('menuitem', { name: /Undo/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Redo/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Copy/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Paste/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Delete/ })).toBeVisible();
	});

	test('View menu opens and shows panel toggles', async ({ page }) => {
		await page.getByRole('menubar').getByText('View').click();
		await expect(page.getByRole('menuitem', { name: /Toggle Left Panel/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Toggle Right Panel/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Toggle Bottom Panel/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Command Palette/ })).toBeVisible();
	});

	test('Insert menu opens and shows element types', async ({ page }) => {
		await page.getByRole('menubar').getByText('Insert').click();
		await expect(page.getByRole('menuitem', { name: /Rectangle/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Ellipse/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Text/ })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Arrow/ })).toBeVisible();
	});

	test('menu items show keyboard shortcuts', async ({ page }) => {
		await page.getByRole('menubar').getByText('File').click();
		const fileMenu = page.getByRole('menu');
		await expect(fileMenu.getByText('Ctrl+N')).toBeVisible();
		await expect(fileMenu.getByText('Ctrl+S')).toBeVisible();
	});
});
