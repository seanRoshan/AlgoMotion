import { describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { DRAG_THRESHOLD } from './interaction-constants';
import type { InteractionDeps } from './interaction-manager';
import { InteractionManager } from './interaction-manager';
import type { SelectionRenderer } from './selection-renderer';

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: 'el-1',
		type: 'rect',
		position: { x: 100, y: 100 },
		size: { width: 80, height: 60 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: {
			fill: '#2a2a4a',
			stroke: '#4a4a6a',
			strokeWidth: 2,
			cornerRadius: 0,
			fontSize: 14,
			fontFamily: 'sans-serif',
			fontWeight: 500,
			textColor: '#ffffff',
		},
		metadata: {},
		...overrides,
	};
}

function createMockDeps(overrides: Partial<InteractionDeps> = {}): InteractionDeps {
	const elements: Record<string, SceneElement> = {
		'el-1': makeElement({ id: 'el-1', position: { x: 100, y: 100 } }),
		'el-2': makeElement({ id: 'el-2', position: { x: 300, y: 300 } }),
	};
	let selectedIds: string[] = [];

	return {
		getElements: vi.fn(() => elements),
		getElementIds: vi.fn(() => Object.keys(elements)),
		getSelectedIds: vi.fn(() => selectedIds),
		getCameraZoom: vi.fn(() => 1),
		// 1:1 mapping (zoom=1, no offset)
		screenToWorld: vi.fn((sx: number, sy: number) => ({ x: sx, y: sy })),
		getContainerRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect),
		selectElement: vi.fn((id: string) => {
			selectedIds = [id];
		}),
		deselectAll: vi.fn(() => {
			selectedIds = [];
		}),
		selectMultiple: vi.fn((ids: string[]) => {
			selectedIds = ids;
		}),
		toggleSelection: vi.fn((id: string) => {
			const idx = selectedIds.indexOf(id);
			if (idx >= 0) {
				selectedIds = selectedIds.filter((sid) => sid !== id);
			} else {
				selectedIds = [...selectedIds, id];
			}
		}),
		moveElements: vi.fn(),
		resizeElement: vi.fn(),
		rotateElement: vi.fn(),
		moveDisplayObject: vi.fn(),
		rotateDisplayObject: vi.fn(),
		setCursor: vi.fn(),
		getSnapEnabled: vi.fn(() => false),
		getGridSize: vi.fn(() => 8),
		...overrides,
	};
}

function createMockSelectionRenderer(): SelectionRenderer {
	return {
		render: vi.fn(),
		renderMarquee: vi.fn(),
		clearMarquee: vi.fn(),
		clear: vi.fn(),
		destroy: vi.fn(),
	} as unknown as SelectionRenderer;
}

function makePointerEvent(_type: string, overrides: Partial<PointerEvent> = {}): PointerEvent {
	return {
		button: 0,
		clientX: 0,
		clientY: 0,
		shiftKey: false,
		metaKey: false,
		ctrlKey: false,
		preventDefault: vi.fn(),
		...overrides,
	} as unknown as PointerEvent;
}

describe('InteractionManager', () => {
	describe('click on element', () => {
		it('selects an unselected element on pointerdown', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Click inside el-1 (at 120, 130)
			const down = makePointerEvent('pointerdown', {
				clientX: 120,
				clientY: 130,
			});
			mgr.onPointerDown(down);

			expect(deps.selectElement).toHaveBeenCalledWith('el-1');
		});

		it('transitions to clicking state on pointerdown', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));

			expect(mgr.getInteractionState().state).toBe('clicking');
		});

		it('returns to idle after pointerup without drag', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 120, clientY: 130 }));

			expect(mgr.getInteractionState().state).toBe('idle');
		});
	});

	describe('click on empty', () => {
		it('deselects all on click on empty canvas', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Click on empty area (50, 50 — no element there)
			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 50, clientY: 50 }));

			expect(deps.deselectAll).toHaveBeenCalled();
		});

		it('does not deselect with shift+click on empty', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(
				makePointerEvent('pointerdown', {
					clientX: 50,
					clientY: 50,
					shiftKey: true,
				}),
			);
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 50, clientY: 50 }));

			expect(deps.deselectAll).not.toHaveBeenCalled();
		});
	});

	describe('shift+click', () => {
		it('toggles selection on shift+click', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(
				makePointerEvent('pointerdown', {
					clientX: 120,
					clientY: 130,
					shiftKey: true,
				}),
			);

			expect(deps.toggleSelection).toHaveBeenCalledWith('el-1');
		});
	});

	describe('click-to-narrow multi-selection', () => {
		it('narrows multi-selection to single element on click', () => {
			let selectedIds = ['el-1', 'el-2'];
			const deps = createMockDeps({
				getSelectedIds: vi.fn(() => selectedIds),
				selectElement: vi.fn((id: string) => {
					selectedIds = [id];
				}),
			});
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Click on el-1 (already selected as part of multi-selection)
			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 121, clientY: 131 }));

			// Should narrow to just el-1
			expect(deps.selectElement).toHaveBeenCalledWith('el-1');
		});
	});

	describe('drag', () => {
		it('transitions to dragging after exceeding threshold', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));

			// Move beyond threshold
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 120 + DRAG_THRESHOLD + 1,
					clientY: 130,
				}),
			);

			expect(mgr.getInteractionState().state).toBe('dragging');
		});

		it('moves display objects directly during drag', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));

			// Move beyond threshold
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 120 + DRAG_THRESHOLD + 10,
					clientY: 130 + 5,
				}),
			);

			expect(deps.moveDisplayObject).toHaveBeenCalled();
		});

		it('commits final positions to store on pointerup', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 120 + DRAG_THRESHOLD + 20,
					clientY: 130 + 10,
				}),
			);
			mgr.onPointerUp(
				makePointerEvent('pointerup', {
					clientX: 120 + DRAG_THRESHOLD + 20,
					clientY: 130 + 10,
				}),
			);

			expect(deps.moveElements).toHaveBeenCalled();
		});

		it('does not move below threshold', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 121,
					clientY: 131,
				}),
			);

			expect(mgr.getInteractionState().state).toBe('clicking');
			expect(deps.moveDisplayObject).not.toHaveBeenCalled();
		});
	});

	describe('marquee selection', () => {
		it('starts marquee when dragging from empty', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Start from empty area
			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 10 + DRAG_THRESHOLD + 50,
					clientY: 10 + DRAG_THRESHOLD + 50,
				}),
			);

			expect(mgr.getInteractionState().state).toBe('selecting');
			expect(renderer.renderMarquee).toHaveBeenCalled();
		});

		it('selects elements within marquee bounds', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Drag from top-left to encompass el-1 (at 100,100 with size 80x60)
			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 200,
					clientY: 200,
				}),
			);

			expect(deps.selectMultiple).toHaveBeenCalled();
		});

		it('clears marquee on pointerup', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 200,
					clientY: 200,
				}),
			);
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 200, clientY: 200 }));

			expect(renderer.clearMarquee).toHaveBeenCalled();
			expect(mgr.getInteractionState().state).toBe('idle');
		});
	});

	describe('resize', () => {
		it('transitions to resizing when dragging a handle', () => {
			// Set up with el-1 selected
			const selectedIds = ['el-1'];
			const deps = createMockDeps({
				getSelectedIds: vi.fn(() => selectedIds),
			});
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Click on top-left handle (at element position 100,100)
			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 100 - DRAG_THRESHOLD - 5,
					clientY: 100 - DRAG_THRESHOLD - 5,
				}),
			);

			expect(mgr.getInteractionState().state).toBe('resizing');
		});

		it('calls resizeElement during resize move', () => {
			const selectedIds = ['el-1'];
			const deps = createMockDeps({
				getSelectedIds: vi.fn(() => selectedIds),
			});
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 80,
					clientY: 80,
				}),
			);

			expect(deps.resizeElement).toHaveBeenCalled();
		});
	});

	describe('rotation', () => {
		it('transitions to rotating when dragging rotation handle', () => {
			const selectedIds = ['el-1'];
			const deps = createMockDeps({
				getSelectedIds: vi.fn(() => selectedIds),
			});
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			// Rotation handle is above top-center. el-1 center x is 140 (100 + 80/2).
			// Top-center y is 100. Rotation handle is 24/zoom above = y=76.
			// Hit area is 12/zoom = 12px. So clicking at (140, 76) should hit it.
			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 140, clientY: 76 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 140 + DRAG_THRESHOLD + 5,
					clientY: 76,
				}),
			);

			expect(mgr.getInteractionState().state).toBe('rotating');
		});

		it('commits rotation to store on pointerup', () => {
			const selectedIds = ['el-1'];
			const deps = createMockDeps({
				getSelectedIds: vi.fn(() => selectedIds),
			});
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 140, clientY: 76 }));
			mgr.onPointerMove(
				makePointerEvent('pointermove', {
					clientX: 160,
					clientY: 80,
				}),
			);
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 160, clientY: 80 }));

			expect(deps.rotateElement).toHaveBeenCalled();
		});
	});

	describe('cursor management', () => {
		it('sets move cursor on element click', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));

			expect(deps.setCursor).toHaveBeenCalledWith('move');
		});

		it('resets cursor on pointerup', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			mgr.onPointerDown(makePointerEvent('pointerdown', { clientX: 120, clientY: 130 }));
			mgr.onPointerUp(makePointerEvent('pointerup', { clientX: 120, clientY: 130 }));

			expect(deps.setCursor).toHaveBeenLastCalledWith('default');
		});
	});

	describe('ignores non-left clicks', () => {
		it('returns false for middle button', () => {
			const deps = createMockDeps();
			const renderer = createMockSelectionRenderer();
			const mgr = new InteractionManager(deps, renderer);

			const result = mgr.onPointerDown(makePointerEvent('pointerdown', { button: 1 }));
			expect(result).toBe(false);
		});
	});
});
