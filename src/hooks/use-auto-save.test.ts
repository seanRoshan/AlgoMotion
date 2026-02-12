import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as persistence from '@/lib/persistence/project-persistence';
import { useProjectStore } from '@/lib/stores/project-store';
import { useAutoSave } from './use-auto-save';

vi.mock('@/lib/persistence/project-persistence', () => ({
	saveProjectToIndex: vi.fn().mockResolvedValue(undefined),
}));

const mockSaveProjectToIndex = vi.mocked(persistence.saveProjectToIndex);

function makeProject() {
	return {
		id: 'proj-auto',
		name: 'Auto Save Project',
		description: '',
		thumbnail: '',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		userId: 'user-1',
		isPublic: false,
		tags: [],
		settings: {
			canvasWidth: 1920,
			canvasHeight: 1080,
			backgroundColor: '#1e1e2e',
			backgroundStyle: 'grid' as const,
			gridSize: 20,
			snapToGrid: true,
			fps: 60,
			defaultEasing: 'power2.out',
			theme: 'dark' as const,
		},
		sceneIds: [],
	};
}

describe('useAutoSave', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockSaveProjectToIndex.mockClear();
		useProjectStore.getState().reset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not save when project is not dirty', async () => {
		const project = makeProject();
		act(() => {
			useProjectStore.getState().setProject(project);
		});

		renderHook(() => useAutoSave());

		await act(async () => {
			vi.advanceTimersByTime(6000);
		});

		expect(mockSaveProjectToIndex).not.toHaveBeenCalled();
	});

	it('saves when project becomes dirty after debounce interval', async () => {
		const project = makeProject();
		act(() => {
			useProjectStore.getState().setProject(project);
		});

		renderHook(() => useAutoSave());

		act(() => {
			useProjectStore.getState().markDirty();
		});

		await act(async () => {
			vi.advanceTimersByTime(6000);
		});

		expect(mockSaveProjectToIndex).toHaveBeenCalledOnce();
	});

	it('does not save when there is no project', async () => {
		renderHook(() => useAutoSave());

		act(() => {
			useProjectStore.getState().markDirty();
		});

		await act(async () => {
			vi.advanceTimersByTime(6000);
		});

		expect(mockSaveProjectToIndex).not.toHaveBeenCalled();
	});

	it('marks project as saved after successful auto-save', async () => {
		const project = makeProject();
		act(() => {
			useProjectStore.getState().setProject(project);
			useProjectStore.getState().markDirty();
		});

		renderHook(() => useAutoSave());

		await act(async () => {
			vi.advanceTimersByTime(6000);
		});

		expect(useProjectStore.getState().isDirty).toBe(false);
	});

	it('debounces rapid changes', async () => {
		const project = makeProject();
		act(() => {
			useProjectStore.getState().setProject(project);
		});

		renderHook(() => useAutoSave());

		// Mark dirty multiple times rapidly
		act(() => {
			useProjectStore.getState().markDirty();
		});
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		act(() => {
			useProjectStore.getState().markDirty();
		});
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		act(() => {
			useProjectStore.getState().markDirty();
		});

		// Not called yet — debounce timer keeps resetting
		expect(mockSaveProjectToIndex).not.toHaveBeenCalled();

		// After full debounce interval from last change
		await act(async () => {
			vi.advanceTimersByTime(6000);
		});

		expect(mockSaveProjectToIndex).toHaveBeenCalledOnce();
	});
});

describe('saveProject (manual)', () => {
	beforeEach(() => {
		mockSaveProjectToIndex.mockClear();
		useProjectStore.getState().reset();
	});

	it('exports a saveProject function that saves immediately', async () => {
		const { saveProject } = await import('./use-auto-save');

		const project = makeProject();
		act(() => {
			useProjectStore.getState().setProject(project);
			useProjectStore.getState().markDirty();
		});

		await saveProject();

		expect(mockSaveProjectToIndex).toHaveBeenCalledOnce();
		expect(useProjectStore.getState().isDirty).toBe(false);
	});

	it('does nothing when there is no project', async () => {
		const { saveProject } = await import('./use-auto-save');

		await saveProject();

		expect(mockSaveProjectToIndex).not.toHaveBeenCalled();
	});
});
