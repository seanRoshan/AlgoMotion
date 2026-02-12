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

	test('skip-to-content link is focusable', async ({ page }) => {
		// Tab to the skip link (should be the first focusable element)
		await page.keyboard.press('Tab');
		const skipLink = page.getByText('Skip to main content');
		await expect(skipLink).toBeFocused();
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

		const assertiveRegion = page.locator('[role="alert"][aria-live="assertive"]');
		await expect(assertiveRegion).toBeAttached();
	});

	test('canvas a11y layer exists', async ({ page }) => {
		const a11yLayer = page.locator('section[aria-label="Canvas scene description"]');
		await expect(a11yLayer).toBeAttached();
	});

	test('focus-visible outlines appear on keyboard navigation', async ({ page }) => {
		// Tab to a button
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// The focused element should have a visible outline
		const focused = page.locator(':focus-visible');
		const count = await focused.count();
		expect(count).toBeGreaterThan(0);
	});
});
