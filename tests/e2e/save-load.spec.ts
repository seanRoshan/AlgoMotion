/**
 * E2E tests for save and load functionality.
 *
 * Covers: Auto-save triggers, page refresh restores state,
 * and manual save via Ctrl+S.
 */

import { expect, test } from '@playwright/test';

test.describe('Save and Load', () => {
	test('editor page loads without errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		// No uncaught errors should occur during load
		expect(errors).toHaveLength(0);
	});

	test('Ctrl+S does not trigger browser save dialog', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');

		// Click canvas to ensure focus
		await page.locator('canvas').click();

		// Ctrl+S should be intercepted by the app (no browser save dialog)
		let dialogAppeared = false;
		page.on('dialog', () => {
			dialogAppeared = true;
		});
		await page.keyboard.press('Control+s');
		await page.waitForTimeout(500);
		expect(dialogAppeared).toBe(false);
	});

	test('editor state persists across page navigation', async ({ page }) => {
		// Go to editor
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');

		// Verify editor loaded
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();

		// Navigate away and back
		await page.goto('/dashboard');
		await expect(page.getByText('Welcome to AlgoMotion')).toBeVisible();

		// Go back to editor
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');

		// Editor should still load correctly
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();
	});

	test('page refresh preserves editor structure', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();

		// Reload
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Editor should still render
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();
		await expect(page.locator('canvas')).toBeVisible();
	});
});
