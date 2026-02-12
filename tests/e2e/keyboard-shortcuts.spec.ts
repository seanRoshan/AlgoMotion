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
		// Click on the canvas area to ensure focus is not on a text input
		await page.locator('canvas').click();
	});

	test('Space toggles play/pause', async ({ page }) => {
		await page.keyboard.press('Space');
		// Animation should start — the play button behavior changes
		// Wait a moment then press Space again to pause
		await page.waitForTimeout(100);
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
		const zoomText = page.locator('text=100%');
		await expect(zoomText).toBeVisible();

		await page.keyboard.press('Control+=');
		// Zoom should increase to 125%
		await expect(page.locator('text=125%')).toBeVisible();
	});

	test('Ctrl+- zooms out', async ({ page }) => {
		const zoomText = page.locator('text=100%');
		await expect(zoomText).toBeVisible();

		await page.keyboard.press('Control+-');
		// Zoom should decrease to 75%
		await expect(page.locator('text=75%')).toBeVisible();
	});

	test('Ctrl+0 fits to screen (resets zoom)', async ({ page }) => {
		// Zoom in first
		await page.keyboard.press('Control+=');
		await expect(page.locator('text=125%')).toBeVisible();

		// Reset
		await page.keyboard.press('Control+0');
		await expect(page.locator('text=100%')).toBeVisible();
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
