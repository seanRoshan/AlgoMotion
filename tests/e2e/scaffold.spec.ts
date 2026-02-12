import { expect, test } from '@playwright/test';

test.describe('scaffold', () => {
	test('home page redirects to editor', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL(/\/editor\//);
		expect(page.url()).toContain('/editor/');
	});

	test('editor page loads with toolbar', async ({ page }) => {
		await page.goto('/editor/demo');
		await expect(page.getByRole('toolbar', { name: 'Main toolbar' })).toBeVisible();
	});

	test('editor page has resizable panels', async ({ page }) => {
		await page.goto('/editor/demo');
		await expect(page.getByRole('tab', { name: 'Elements' })).toBeVisible();
		await expect(page.getByText('Properties').first()).toBeVisible();
		await expect(page.getByText('Timeline').first()).toBeVisible();
	});

	test('dashboard page renders', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page.getByText('Welcome to AlgoMotion')).toBeVisible();
	});

	test('login page renders', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByText('Sign in to AlgoMotion')).toBeVisible();
	});

	test('404 page renders for unknown routes', async ({ page }) => {
		await page.goto('/nonexistent-route');
		await expect(page.getByText('404')).toBeVisible();
	});
});
