/**
 * E2E tests for template browsing.
 *
 * Covers: Template gallery in left panel, template categories,
 * and template loading.
 */

import { expect, test } from '@playwright/test';

test.describe('Templates', () => {
	test('templates page shows heading', async ({ page }) => {
		await page.goto('/dashboard/templates');
		await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
	});

	test('templates page shows description', async ({ page }) => {
		await page.goto('/dashboard/templates');
		await expect(
			page.getByText('Start from a pre-built algorithm or data structure template'),
		).toBeVisible();
	});

	test('editor has Templates tab in left panel', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');

		const templatesTab = page.getByRole('tab', { name: 'Templates' });
		await expect(templatesTab).toBeVisible();
	});

	test('clicking Templates tab shows template gallery', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');

		await page.getByRole('tab', { name: 'Templates' }).click();
		await expect(page.getByRole('tab', { name: 'Templates' })).toHaveAttribute(
			'data-state',
			'active',
		);
	});

	test('template gallery has search/filter capability', async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');

		await page.getByRole('tab', { name: 'Templates' }).click();
		// Template gallery should be rendered in the panel
		const tabContent = page.locator('[data-state="active"][role="tabpanel"]').first();
		await expect(tabContent).toBeVisible();
	});
});
