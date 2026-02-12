import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [['html'], ['github']] : 'html',
	timeout: 30_000,
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.03,
			animations: 'disabled',
		},
	},
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'off',
	},
	snapshotPathTemplate: '{testDir}/../visual/__snapshots__/{testFilePath}/{arg}{ext}',
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: process.env.CI ? 'pnpm start' : 'pnpm dev',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
