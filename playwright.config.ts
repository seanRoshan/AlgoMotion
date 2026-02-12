import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	timeout: 30_000,
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
			animations: 'disabled',
		},
	},
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
	},
	snapshotPathTemplate: '{testDir}/../visual/__snapshots__/{testFilePath}/{arg}{ext}',
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
	],
	webServer: {
		command: process.env.CI ? 'pnpm start' : 'pnpm dev',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
	},
});
