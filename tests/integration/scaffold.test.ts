import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');

describe('project scaffold', () => {
	it('has package.json with correct name', async () => {
		const pkg = await import(`${root}/package.json`);
		expect(pkg.name).toBe('algomotion');
	});

	it('has biome.json configuration', () => {
		expect(existsSync(resolve(root, 'biome.json'))).toBe(true);
	});

	it('has vitest configuration', () => {
		expect(existsSync(resolve(root, 'vitest.config.ts'))).toBe(true);
	});

	it('has playwright configuration', () => {
		expect(existsSync(resolve(root, 'playwright.config.ts'))).toBe(true);
	});

	it('has TypeScript strict mode in tsconfig', async () => {
		const tsconfig = await import(`${root}/tsconfig.json`);
		expect(tsconfig.compilerOptions.strict).toBe(true);
	});

	it('has Sentry configuration files', () => {
		expect(existsSync(resolve(root, 'instrumentation.ts'))).toBe(true);
		expect(existsSync(resolve(root, 'instrumentation-client.ts'))).toBe(true);
		expect(existsSync(resolve(root, 'sentry.server.config.ts'))).toBe(true);
		expect(existsSync(resolve(root, 'sentry.edge.config.ts'))).toBe(true);
	});

	it('has .nvmrc with Node 22', async () => {
		const fs = await import('node:fs');
		const nvmrc = fs.readFileSync(resolve(root, '.nvmrc'), 'utf-8').trim();
		expect(nvmrc).toBe('22');
	});

	it('has .editorconfig', () => {
		expect(existsSync(resolve(root, '.editorconfig'))).toBe(true);
	});

	it('has src directory structure', () => {
		expect(existsSync(resolve(root, 'src/app/layout.tsx'))).toBe(true);
		expect(existsSync(resolve(root, 'src/app/globals.css'))).toBe(true);
		expect(existsSync(resolve(root, 'src/components/ui'))).toBe(true);
		expect(existsSync(resolve(root, 'src/lib/utils.ts'))).toBe(true);
		expect(existsSync(resolve(root, 'src/types/index.ts'))).toBe(true);
	});

	it('has editor route', () => {
		expect(existsSync(resolve(root, 'src/app/editor/[projectId]/page.tsx'))).toBe(true);
		expect(existsSync(resolve(root, 'src/app/editor/[projectId]/layout.tsx'))).toBe(true);
	});

	it('has shadcn/ui components installed', () => {
		expect(existsSync(resolve(root, 'src/components/ui/button.tsx'))).toBe(true);
		expect(existsSync(resolve(root, 'src/components/ui/dialog.tsx'))).toBe(true);
		expect(existsSync(resolve(root, 'src/components/ui/resizable.tsx'))).toBe(true);
		expect(existsSync(resolve(root, 'src/components/ui/tabs.tsx'))).toBe(true);
		expect(existsSync(resolve(root, 'src/components/ui/command.tsx'))).toBe(true);
	});
});
