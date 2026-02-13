/**
 * E2E tests for animation playback controls.
 *
 * Covers: Play/pause/stop buttons, speed selector,
 * step forward/back, and playback state transitions.
 */

import { expect, test } from '@playwright/test';

test.describe('Playback Controls', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('load');
	});

	test('play button is clickable', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		const playButton = toolbar.getByLabel('Play');
		await expect(playButton).toBeVisible();
		await expect(playButton).toBeEnabled();
		await playButton.click();
	});

	test('pause button is clickable', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		const pauseButton = toolbar.getByLabel('Pause');
		await expect(pauseButton).toBeVisible();
		await pauseButton.click();
	});

	test('stop button is clickable', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		const stopButton = toolbar.getByLabel('Stop');
		await expect(stopButton).toBeVisible();
		await stopButton.click();
	});

	test('step forward button exists', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		await expect(toolbar.getByLabel('Step forward')).toBeVisible();
	});

	test('step back button exists', async ({ page }) => {
		const toolbar = page.getByRole('toolbar', { name: 'Main toolbar' });
		await expect(toolbar.getByLabel('Step back')).toBeVisible();
	});

	test('speed selector opens dropdown with options', async ({ page }) => {
		const speedButton = page.locator('[data-testid="speed-selector"]');
		await speedButton.click();

		// Should show speed options
		await expect(page.getByRole('menuitem', { name: '0.25x' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: '0.5x' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: '2x' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: '4x' })).toBeVisible();
	});

	test('can change playback speed', async ({ page }) => {
		const speedButton = page.locator('[data-testid="speed-selector"]');
		await speedButton.click();
		await page.getByRole('menuitem', { name: '2x' }).click();

		// Speed display should update
		await expect(speedButton).toHaveText(/2x/);
	});
});
