/**
 * E2E tests for navigation and page rendering.
 *
 * Covers: Dashboard rendering, editor page load, templates page,
 * login page, 404 page, and navigation between pages.
 */

import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
	test('dashboard renders with welcome message', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page.getByText('Welcome to AlgoMotion')).toBeVisible();
	});

	test('dashboard has New Project button linking to editor', async ({ page }) => {
		await page.goto('/dashboard');
		const newProjectLink = page.getByRole('link', { name: 'New Project' });
		await expect(newProjectLink).toBeVisible();
		await expect(newProjectLink).toHaveAttribute('href', '/editor/new');
	});

	test('clicking New Project navigates to editor', async ({ page }) => {
		await page.goto('/dashboard');
		await page.getByRole('link', { name: 'New Project' }).click();
		await page.waitForURL(/\/editor\//);
		expect(page.url()).toContain('/editor/');
	});

	test('templates page renders', async ({ page }) => {
		await page.goto('/dashboard/templates');
		await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
	});

	test('login page renders with sign in form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByText('Sign in to AlgoMotion')).toBeVisible();
	});

	test('404 page renders for unknown routes', async ({ page }) => {
		await page.goto('/nonexistent-route');
		await expect(page.getByText('404')).toBeVisible();
	});

	test('home page redirects to editor', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL(/\/editor\//);
		expect(page.url()).toContain('/editor/');
	});
});
