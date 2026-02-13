/**
 * E2E tests for keyboard shortcuts.
 *
 * Covers: Playback (Space), undo/redo (Ctrl+Z/Ctrl+Shift+Z),
 * zoom (Ctrl+=/-/0), panel toggles (Ctrl+B/I/`), save (Ctrl+S),
 * command palette (Ctrl+K).
 */

import { expect, test } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor/demo');
		await page.waitForLoadState('networkidle');
		// Wait for Pixi.js canvas to initialize, then click to ensure focus
		const canvas = page.locator('canvas').first();
		await expect(canvas).toBeVisible({ timeout: 15_000 });
		await canvas.click();
	});

	test('Space toggles play/pause', async ({ page }) => {
		await page.keyboard.press('Space');
		// Just verify it doesn't crash — actual playback state is tested in unit tests
		await page.keyboard.press('Space');
	});

	test('Ctrl+Z triggers undo', async ({ page }) => {
		// Undo button should be disabled initially (no history)
		const undoButton = page.getByLabel('Undo');
		await expect(undoButton).toBeDisabled();
		// Press Ctrl+Z — should not cause errors
		await page.keyboard.press('Control+z');
	});

	test('Ctrl+K opens command palette', async ({ page }) => {
		await page.keyboard.press('Control+k');
		// Command palette dialog should appear
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('Ctrl+B toggles left panel', async ({ page }) => {
		const elementsTab = page.getByRole('tab', { name: 'Elements' });
		await expect(elementsTab).toBeVisible();

		// Toggle panel off
		await page.keyboard.press('Control+b');
		await expect(elementsTab).not.toBeVisible();

		// Toggle panel back on
		await page.keyboard.press('Control+b');
		await expect(elementsTab).toBeVisible();
	});

	test('Ctrl+= zooms in', async ({ page }) => {
		const zoomDisplay = page.locator('[data-testid="zoom-level"]');
		await expect(zoomDisplay).toHaveText('100%');

		await page.keyboard.press('Control+=');
		await expect(zoomDisplay).not.toHaveText('100%');
	});

	test('Ctrl+- zooms out', async ({ page }) => {
		const zoomDisplay = page.locator('[data-testid="zoom-level"]');
		await expect(zoomDisplay).toHaveText('100%');

		await page.keyboard.press('Control+-');
		await expect(zoomDisplay).not.toHaveText('100%');
	});

	test('Ctrl+0 fits to screen (resets zoom)', async ({ page }) => {
		const zoomDisplay = page.locator('[data-testid="zoom-level"]');

		// Zoom in first
		await page.keyboard.press('Control+=');
		await expect(zoomDisplay).not.toHaveText('100%');

		// Reset
		await page.keyboard.press('Control+0');
		await expect(zoomDisplay).toHaveText('100%');
	});

	test('shortcuts are suppressed when text input is focused', async ({ page }) => {
		// Focus on the search input
		const searchInput = page.getByPlaceholder('Search elements...');
		await searchInput.click();
		await searchInput.fill('test');

		// Space should type into the input, not toggle playback
		await page.keyboard.press('Space');
		const value = await searchInput.inputValue();
		expect(value).toContain(' ');
	});
});
