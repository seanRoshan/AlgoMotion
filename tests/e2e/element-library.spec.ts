/**
 * E2E tests for the Element Library panel.
 *
 * Covers: Viewing elements, searching, element categories,
 * and drag interaction setup.
 */

import { expect, test } from '@playwright/test';

test.describe('Element Library', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
	});

	test('shows Elements tab by default', async ({ page }) => {
		const elementsTab = page.getByRole('tab', { name: 'Elements' });
		await expect(elementsTab).toBeVisible();
		await expect(elementsTab).toHaveAttribute('data-state', 'active');
	});

	test('has Templates and Layers tabs', async ({ page }) => {
		await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Layers' })).toBeVisible();
	});

	test('has search input for filtering elements', async ({ page }) => {
		const searchInput = page.getByPlaceholder('Search elements...');
		await expect(searchInput).toBeVisible();
	});

	test('shows element categories in accordion', async ({ page }) => {
		// Should have at least one category (Primitives is always enabled)
		const accordionTriggers = page.locator('[data-state="open"]');
		const count = await accordionTriggers.count();
		expect(count).toBeGreaterThan(0);
	});

	test('search filters elements', async ({ page }) => {
		const searchInput = page.getByPlaceholder('Search elements...');
		await searchInput.fill('rect');
		// Should show matching elements
		await expect(page.getByText('Rectangle')).toBeVisible();
	});

	test('search with no results shows empty message', async ({ page }) => {
		const searchInput = page.getByPlaceholder('Search elements...');
		await searchInput.fill('zzzznonexistent');
		await expect(page.getByText('No elements found')).toBeVisible();
	});

	test('switching to Templates tab shows template gallery', async ({ page }) => {
		await page.getByRole('tab', { name: 'Templates' }).click();
		await expect(page.getByRole('tab', { name: 'Templates' })).toHaveAttribute(
			'data-state',
			'active',
		);
	});

	test('elements are draggable', async ({ page }) => {
		// Find a draggable element card
		const elementCard = page.locator('[draggable="true"]').first();
		await expect(elementCard).toBeVisible();
		await expect(elementCard).toHaveAttribute('draggable', 'true');
	});
});
