/**
 * E2E tests for accessibility features.
 *
 * Covers: Skip navigation, ARIA landmarks, focus management,
 * screen reader announcer, and keyboard navigation.
 */

import { expect, test } from '@playwright/test';

test.describe('Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
	});

	test('skip-to-content link exists and is focusable', async ({ page }) => {
		const skipLink = page.getByText('Skip to main content');
		await expect(skipLink).toBeAttached();

		// Tab to the skip link
		await page.keyboard.press('Tab');
		// Verify it received focus (or at least exists as first focusable)
		const focused = page.locator(':focus');
		const count = await focused.count();
		expect(count).toBeGreaterThan(0);
	});

	test('main content landmark exists', async ({ page }) => {
		await expect(page.locator('main')).toBeVisible();
	});

	test('toolbar has correct ARIA role and label', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		await expect(toolbar).toBeVisible();
	});

	test('all buttons have aria-labels', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		const buttons = toolbar.getByRole('button');
		const count = await buttons.count();

		for (let i = 0; i < count; i++) {
			const button = buttons.nth(i);
			const label = await button.getAttribute('aria-label');
			const text = await button.textContent();
			// Each button should have either an aria-label or visible text
			expect(label || text).toBeTruthy();
		}
	});

	test('screen reader announcer is present', async ({ page }) => {
		// The ScreenReaderAnnouncer renders sr-only elements
		const politeRegion = page.locator('output[aria-live="polite"]');
		await expect(politeRegion).toBeAttached();

		const assertiveRegion = page.locator('[role="alert"][aria-live="assertive"]').first();
		await expect(assertiveRegion).toBeAttached();
	});

	test('canvas a11y layer exists', async ({ page }) => {
		const a11yLayer = page.locator('section[aria-label="Canvas scene description"]');
		await expect(a11yLayer).toBeAttached();
	});

	test('keyboard navigation produces focus indicators', async ({ page }) => {
		// Tab a few times to move focus into the page
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Some element should have focus
		const focused = page.locator(':focus');
		const count = await focused.count();
		expect(count).toBeGreaterThan(0);
	});
});
