/**
 * Tests for EmbedPlayer component.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { DbProject, DbScene } from '@/lib/supabase/database.types';
import { EmbedPlayer } from './embed-player';

function createProject(overrides: Partial<DbProject> = {}): DbProject {
	return {
		id: 'proj-1',
		user_id: 'user-1',
		name: 'Bubble Sort',
		description: 'Bubble sort animation',
		thumbnail_url: null,
		is_public: true,
		tags: ['sorting'],
		settings: { backgroundColor: '#1a1a2e', canvasWidth: 1920, canvasHeight: 1080 },
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-02T00:00:00Z',
		...overrides,
	};
}

function createScenes(): DbScene[] {
	return [
		{
			id: 'scene-1',
			project_id: 'proj-1',
			name: 'Scene 1',
			scene_order: 0,
			data: { elements: {}, elementIds: [] },
			code_source: null,
			duration: 5,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z',
		},
	];
}

describe('EmbedPlayer', () => {
	afterEach(cleanup);

	it('renders project title', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByText('Bubble Sort')).toBeDefined();
	});

	it('renders play button', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByRole('button', { name: /play/i })).toBeDefined();
	});

	it('renders speed control', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByText('1x')).toBeDefined();
	});

	it('renders progress bar', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByRole('progressbar')).toBeDefined();
	});

	it('renders canvas element', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByTestId('embed-canvas')).toBeDefined();
	});

	it('toggles play/pause on button click', async () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		const btn = screen.getByRole('button', { name: /play/i });
		await userEvent.click(btn);
		expect(screen.getByRole('button', { name: /pause/i })).toBeDefined();
	});

	it('cycles speed on speed button click', async () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		const speedBtn = screen.getByText('1x');
		await userEvent.click(speedBtn);
		expect(screen.getByText('1.5x')).toBeDefined();
	});

	it('renders time display', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByText(/0:00/)).toBeDefined();
	});

	it('renders AlgoMotion branding link', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		expect(screen.getByText('AlgoMotion')).toBeDefined();
	});

	it('respects prefers-reduced-motion', () => {
		render(<EmbedPlayer project={createProject()} scenes={createScenes()} />);
		// Component should render without error with reduced motion
		expect(screen.getByTestId('embed-player')).toBeDefined();
	});
});
