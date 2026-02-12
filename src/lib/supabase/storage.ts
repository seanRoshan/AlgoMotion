/**
 * Supabase Storage helpers for file upload/download.
 *
 * Provides typed wrappers around Supabase Storage for
 * project assets, exported media, and template assets.
 *
 * Spec reference: Section 4 (Cloud Storage)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageBucket } from './database.types';

export interface UploadResult {
	path: string;
	url: string;
}

/**
 * Upload a file to a Supabase Storage bucket.
 * Uses the user's ID as a path prefix for isolation.
 */
export async function uploadFile(
	supabase: SupabaseClient,
	bucket: StorageBucket,
	userId: string,
	fileName: string,
	file: File | Blob,
): Promise<{ data: UploadResult | null; error: Error | null }> {
	const path = `${userId}/${fileName}`;

	const { error } = await supabase.storage.from(bucket).upload(path, file, {
		upsert: true,
	});

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

	return {
		data: { path, url: urlData.publicUrl },
		error: null,
	};
}

/**
 * Get a signed URL for temporary access to a private file.
 */
export async function getSignedUrl(
	supabase: SupabaseClient,
	bucket: StorageBucket,
	path: string,
	expiresInSeconds = 3600,
): Promise<{ url: string | null; error: Error | null }> {
	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrl(path, expiresInSeconds);

	if (error) {
		return { url: null, error: new Error(error.message) };
	}

	return { url: data.signedUrl, error: null };
}

/**
 * Delete a file from a Supabase Storage bucket.
 */
export async function deleteFile(
	supabase: SupabaseClient,
	bucket: StorageBucket,
	path: string,
): Promise<{ error: Error | null }> {
	const { error } = await supabase.storage.from(bucket).remove([path]);

	if (error) {
		return { error: new Error(error.message) };
	}

	return { error: null };
}
