/**
 * Public embed player page.
 *
 * Server Component that fetches project data from Supabase
 * and renders the EmbedPlayer client component.
 * Generates dynamic OG tags for social media previews.
 *
 * Spec reference: Section 5.1 (embed/[projectId] route)
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EmbedPlayer } from '@/components/embed/embed-player';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface EmbedPageProps {
	params: Promise<{ projectId: string }>;
}

async function getProjectData(projectId: string) {
	const supabase = await createServerSupabaseClient();

	const { data: project } = await supabase
		.from('projects')
		.select('*')
		.eq('id', projectId)
		.eq('is_public', true)
		.single();

	if (!project) return null;

	const { data: scenes } = await supabase
		.from('scenes')
		.select('*')
		.eq('project_id', projectId)
		.order('scene_order', { ascending: true });

	return { project, scenes: scenes ?? [] };
}

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
	const { projectId } = await params;
	const data = await getProjectData(projectId);

	if (!data) {
		return { title: 'Not Found — AlgoMotion' };
	}

	const { project } = data;
	const title = `${project.name} — AlgoMotion`;
	const description = project.description || 'Interactive algorithm animation';

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: 'website',
			siteName: 'AlgoMotion',
			...(project.thumbnail_url && { images: [{ url: project.thumbnail_url }] }),
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			...(project.thumbnail_url && { images: [project.thumbnail_url] }),
		},
		other: {
			'og:type': 'website',
		},
	};
}

export default async function EmbedPage({ params }: EmbedPageProps) {
	const { projectId } = await params;
	const data = await getProjectData(projectId);

	if (!data) {
		notFound();
	}

	return <EmbedPlayer project={data.project} scenes={data.scenes} />;
}
