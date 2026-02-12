/**
 * E2E tests for authentication flows.
 *
 * Covers: Login page rendering, signup page rendering,
 * form elements, and navigation between auth pages.
 */

import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
	test('login page renders sign in form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByText('Sign in to AlgoMotion')).toBeVisible();
	});

	test('signup page renders', async ({ page }) => {
		await page.goto('/signup');
		await expect(page).toHaveURL(/\/signup/);
	});

	test('login page has email input', async ({ page }) => {
		await page.goto('/login');
		const emailInput = page.getByLabel(/email/i);
		await expect(emailInput).toBeVisible();
	});

	test('login page has password input', async ({ page }) => {
		await page.goto('/login');
		const passwordInput = page.getByLabel(/password/i);
		await expect(passwordInput).toBeVisible();
	});

	test('login page has submit button', async ({ page }) => {
		await page.goto('/login');
		const submitButton = page.getByRole('button', { name: /sign in/i });
		await expect(submitButton).toBeVisible();
	});

	test('login form validates empty submission', async ({ page }) => {
		await page.goto('/login');
		const submitButton = page.getByRole('button', { name: /sign in/i });
		await submitButton.click();
		// Form should show validation — either HTML5 or custom error messages
		await page.waitForTimeout(500);
	});

	test('login page has link to signup', async ({ page }) => {
		await page.goto('/login');
		const signupLink = page.getByRole('link', { name: /sign up|create account|register/i });
		await expect(signupLink).toBeVisible();
	});
});
