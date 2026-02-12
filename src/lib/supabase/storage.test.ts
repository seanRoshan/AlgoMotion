/**
 * Tests for Supabase Storage helpers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { deleteFile, getSignedUrl, uploadFile } from './storage';

function createMockClient(overrides: Record<string, unknown> = {}): SupabaseClient {
	const mockUpload = vi.fn(() => Promise.resolve({ data: { path: '' }, error: null }));
	const mockGetPublicUrl = vi.fn(() => ({
		data: { publicUrl: 'https://cdn.example.com/file.png' },
	}));
	const mockCreateSignedUrl = vi.fn(() =>
		Promise.resolve({ data: { signedUrl: 'https://cdn.example.com/signed' }, error: null }),
	);
	const mockRemove = vi.fn(() => Promise.resolve({ data: [], error: null }));

	return {
		storage: {
			from: vi.fn(() => ({
				upload: mockUpload,
				getPublicUrl: mockGetPublicUrl,
				createSignedUrl: mockCreateSignedUrl,
				remove: mockRemove,
				...overrides,
			})),
		},
	} as unknown as SupabaseClient;
}

describe('storage helpers', () => {
	describe('uploadFile', () => {
		it('uploads file with user-scoped path', async () => {
			const client = createMockClient();
			const file = new Blob(['test'], { type: 'text/plain' });

			const result = await uploadFile(client, 'project-assets', 'user-123', 'image.png', file);

			expect(result.error).toBeNull();
			expect(result.data).not.toBeNull();
			expect(result.data?.path).toBe('user-123/image.png');
			expect(result.data?.url).toBe('https://cdn.example.com/file.png');
		});

		it('returns error on upload failure', async () => {
			const client = createMockClient({
				upload: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Upload failed' } })),
			});
			const file = new Blob(['test']);

			const result = await uploadFile(client, 'project-assets', 'user-123', 'file.png', file);

			expect(result.data).toBeNull();
			expect(result.error).not.toBeNull();
			expect(result.error?.message).toBe('Upload failed');
		});

		it('calls storage.from with correct bucket', async () => {
			const client = createMockClient();
			const file = new Blob(['test']);

			await uploadFile(client, 'exported-media', 'user-123', 'video.mp4', file);

			expect(client.storage.from).toHaveBeenCalledWith('exported-media');
		});
	});

	describe('getSignedUrl', () => {
		it('returns signed URL for private file', async () => {
			const client = createMockClient();

			const result = await getSignedUrl(client, 'exported-media', 'user-123/video.mp4');

			expect(result.error).toBeNull();
			expect(result.url).toBe('https://cdn.example.com/signed');
		});

		it('returns error on failure', async () => {
			const client = createMockClient({
				createSignedUrl: vi.fn(() =>
					Promise.resolve({ data: null, error: { message: 'Not found' } }),
				),
			});

			const result = await getSignedUrl(client, 'exported-media', 'bad-path');

			expect(result.url).toBeNull();
			expect(result.error?.message).toBe('Not found');
		});

		it('uses default expiry of 3600 seconds', async () => {
			const mockCreateSignedUrl = vi.fn(() =>
				Promise.resolve({ data: { signedUrl: 'url' }, error: null }),
			);
			const client = createMockClient({ createSignedUrl: mockCreateSignedUrl });

			await getSignedUrl(client, 'project-assets', 'path');

			expect(mockCreateSignedUrl).toHaveBeenCalledWith('path', 3600);
		});
	});

	describe('deleteFile', () => {
		it('deletes file from bucket', async () => {
			const client = createMockClient();

			const result = await deleteFile(client, 'project-assets', 'user-123/old.png');

			expect(result.error).toBeNull();
		});

		it('returns error on failure', async () => {
			const client = createMockClient({
				remove: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Delete failed' } })),
			});

			const result = await deleteFile(client, 'project-assets', 'path');

			expect(result.error?.message).toBe('Delete failed');
		});
	});
});
