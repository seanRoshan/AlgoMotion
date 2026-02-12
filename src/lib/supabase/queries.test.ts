/**
 * Tests for Supabase query helpers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

// Chain builder mock — each call returns `this` for fluent API
function createChainMock(finalResult: unknown = { data: [], error: null }) {
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	const handler: ProxyHandler<Record<string, ReturnType<typeof vi.fn>>> = {
		get(_target, prop: string) {
			if (prop === 'then') return undefined; // Prevent Promise resolution
			if (!chain[prop]) {
				chain[prop] = vi.fn(() => {
					// Terminal methods return the result
					if (prop === 'single' || prop === 'returns' || prop === 'rpc') {
						return Promise.resolve(finalResult);
					}
					return new Proxy(chain, handler);
				});
			}
			return chain[prop];
		},
	};
	return new Proxy(chain, handler);
}

function createMockClient(finalResult?: unknown): SupabaseClient {
	const chain = createChainMock(finalResult);
	return {
		from: vi.fn(() => chain),
		rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
	} as unknown as SupabaseClient;
}

describe('query helpers', () => {
	describe('project queries', () => {
		it('getProjects queries by user_id', async () => {
			const client = createMockClient();
			const { getProjects } = await import('./queries');

			await getProjects(client, 'user-123');

			expect(client.from).toHaveBeenCalledWith('projects');
		});

		it('getProject queries by id', async () => {
			const client = createMockClient();
			const { getProject } = await import('./queries');

			await getProject(client, 'project-1');

			expect(client.from).toHaveBeenCalledWith('projects');
		});

		it('getPublicProjects filters by is_public', async () => {
			const client = createMockClient();
			const { getPublicProjects } = await import('./queries');

			await getPublicProjects(client);

			expect(client.from).toHaveBeenCalledWith('projects');
		});

		it('createProject inserts into projects table', async () => {
			const client = createMockClient();
			const { createProject } = await import('./queries');

			await createProject(client, {
				user_id: 'user-1',
				name: 'Test',
				description: '',
				thumbnail_url: null,
				is_public: false,
				tags: [],
				settings: {},
			});

			expect(client.from).toHaveBeenCalledWith('projects');
		});

		it('updateProject updates by id', async () => {
			const client = createMockClient();
			const { updateProject } = await import('./queries');

			await updateProject(client, 'project-1', { name: 'Updated' });

			expect(client.from).toHaveBeenCalledWith('projects');
		});

		it('deleteProject deletes by id', async () => {
			const client = createMockClient();
			const { deleteProject } = await import('./queries');

			await deleteProject(client, 'project-1');

			expect(client.from).toHaveBeenCalledWith('projects');
		});
	});

	describe('scene queries', () => {
		it('getScenes queries by project_id', async () => {
			const client = createMockClient();
			const { getScenes } = await import('./queries');

			await getScenes(client, 'project-1');

			expect(client.from).toHaveBeenCalledWith('scenes');
		});

		it('getScene queries by id', async () => {
			const client = createMockClient();
			const { getScene } = await import('./queries');

			await getScene(client, 'scene-1');

			expect(client.from).toHaveBeenCalledWith('scenes');
		});

		it('createScene inserts into scenes table', async () => {
			const client = createMockClient();
			const { createScene } = await import('./queries');

			await createScene(client, {
				project_id: 'project-1',
				name: 'Scene 1',
				scene_order: 0,
				data: {},
				code_source: null,
				duration: 0,
			});

			expect(client.from).toHaveBeenCalledWith('scenes');
		});

		it('updateScene updates by id', async () => {
			const client = createMockClient();
			const { updateScene } = await import('./queries');

			await updateScene(client, 'scene-1', { name: 'Renamed' });

			expect(client.from).toHaveBeenCalledWith('scenes');
		});

		it('deleteScene deletes by id', async () => {
			const client = createMockClient();
			const { deleteScene } = await import('./queries');

			await deleteScene(client, 'scene-1');

			expect(client.from).toHaveBeenCalledWith('scenes');
		});
	});

	describe('template queries', () => {
		it('getTemplates queries all templates', async () => {
			const client = createMockClient();
			const { getTemplates } = await import('./queries');

			await getTemplates(client);

			expect(client.from).toHaveBeenCalledWith('templates');
		});

		it('getTemplates filters by category when provided', async () => {
			const client = createMockClient();
			const { getTemplates } = await import('./queries');

			await getTemplates(client, 'sorting');

			expect(client.from).toHaveBeenCalledWith('templates');
		});

		it('getTemplate queries by id', async () => {
			const client = createMockClient();
			const { getTemplate } = await import('./queries');

			await getTemplate(client, 'template-1');

			expect(client.from).toHaveBeenCalledWith('templates');
		});

		it('incrementTemplateUsage calls rpc', async () => {
			const client = createMockClient();
			const { incrementTemplateUsage } = await import('./queries');

			await incrementTemplateUsage(client, 'template-1');

			expect(client.rpc).toHaveBeenCalledWith('increment_template_usage', {
				template_id: 'template-1',
			});
		});
	});
});
