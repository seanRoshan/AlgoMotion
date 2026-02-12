import { describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { ALIGNMENT_SNAP_THRESHOLD } from './interaction-constants';
import { SnapEngine, type SnapEngineDeps } from './snap-engine';

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: `el-${Math.random().toString(36).slice(2, 8)}`,
		type: 'rect',
		position: { x: 100, y: 200 },
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

function makeDeps(overrides: Partial<SnapEngineDeps> = {}): SnapEngineDeps {
	return {
		getSnapEnabled: vi.fn(() => false),
		getGridSize: vi.fn(() => 8),
		getElements: vi.fn(() => ({})),
		getElementIds: vi.fn(() => []),
		getCameraZoom: vi.fn(() => 1),
		...overrides,
	};
}

describe('SnapEngine', () => {
	describe('grid snap', () => {
		it('returns zero delta when snap is disabled', () => {
			const deps = makeDeps({ getSnapEnabled: vi.fn(() => false) });
			const engine = new SnapEngine(deps);

			const result = engine.computeSnap(['a'], {
				a: { x: 17, y: 23 },
			});

			expect(result.deltaX).toBe(0);
			expect(result.deltaY).toBe(0);
		});

		it('snaps bounding box origin to nearest grid intersection', () => {
			const el = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 50, height: 40 },
			});
			const deps = makeDeps({
				getSnapEnabled: vi.fn(() => true),
				getGridSize: vi.fn(() => 8),
				getElements: vi.fn(() => ({ a: el })),
				getElementIds: vi.fn(() => ['a']),
			});
			const engine = new SnapEngine(deps);

			// Raw position: 17,23 → nearest grid: 16,24
			const result = engine.computeSnap(['a'], { a: { x: 17, y: 23 } });

			expect(result.deltaX).toBeCloseTo(-1, 5); // 16 - 17
			expect(result.deltaY).toBeCloseTo(1, 5); // 24 - 23
		});

		it('snaps to exact grid when already on grid', () => {
			const el = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 50, height: 40 },
			});
			const deps = makeDeps({
				getSnapEnabled: vi.fn(() => true),
				getGridSize: vi.fn(() => 8),
				getElements: vi.fn(() => ({ a: el })),
				getElementIds: vi.fn(() => ['a']),
			});
			const engine = new SnapEngine(deps);

			const result = engine.computeSnap(['a'], { a: { x: 16, y: 24 } });

			expect(result.deltaX).toBe(0);
			expect(result.deltaY).toBe(0);
		});

		it('respects configurable grid size', () => {
			const el = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 50, height: 40 },
			});
			const deps = makeDeps({
				getSnapEnabled: vi.fn(() => true),
				getGridSize: vi.fn(() => 20),
				getElements: vi.fn(() => ({ a: el })),
				getElementIds: vi.fn(() => ['a']),
			});
			const engine = new SnapEngine(deps);

			// Raw position: 33,47 → nearest 20-grid: 40,40
			const result = engine.computeSnap(['a'], { a: { x: 33, y: 47 } });

			expect(result.deltaX).toBeCloseTo(7, 5); // 40 - 33
			expect(result.deltaY).toBeCloseTo(-7, 5); // 40 - 47
		});
	});

	describe('alignment guide detection', () => {
		it('detects left edge alignment with another element', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 100, y: 300 },
				size: { width: 120, height: 80 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' to x=102 (within threshold of b's left edge at 100)
			const result = engine.computeSnap(['a'], { a: { x: 102, y: 100 } });

			expect(result.deltaX).toBeCloseTo(-2, 5);
			expect(result.guides.length).toBeGreaterThanOrEqual(1);

			const verticalGuide = result.guides.find((g) => g.axis === 'vertical');
			expect(verticalGuide).toBeDefined();
			expect(verticalGuide?.position).toBe(100);
		});

		it('detects center alignment with another element', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			// elB center X = 200 + 120/2 = 260
			const elB = makeElement({
				id: 'b',
				position: { x: 200, y: 300 },
				size: { width: 120, height: 80 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' so its centerX = 260. elA width=80, so left=220
			// Place at x=221 → center=261, within threshold=4 of 260
			const result = engine.computeSnap(['a'], { a: { x: 221, y: 100 } });

			expect(result.deltaX).toBeCloseTo(-1, 5); // snap center to 260 → left=220
			expect(result.guides.some((g) => g.axis === 'vertical' && g.position === 260)).toBe(true);
		});

		it('detects right edge alignment with another element', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			// elB right = 200 + 120 = 320
			const elB = makeElement({
				id: 'b',
				position: { x: 200, y: 300 },
				size: { width: 120, height: 80 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' so its right edge (x+80) = 321, within threshold of 320
			const result = engine.computeSnap(['a'], { a: { x: 241, y: 100 } });

			expect(result.deltaX).toBeCloseTo(-1, 5); // snap right to 320 → left=240
			expect(result.guides.some((g) => g.axis === 'vertical' && g.position === 320)).toBe(true);
		});

		it('detects horizontal alignment (top edge)', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 300, y: 200 },
				size: { width: 100, height: 50 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' to y=202 (within threshold of b's top at 200)
			const result = engine.computeSnap(['a'], { a: { x: 100, y: 202 } });

			expect(result.deltaY).toBeCloseTo(-2, 5);
			expect(result.guides.some((g) => g.axis === 'horizontal' && g.position === 200)).toBe(true);
		});

		it('detects canvas center (0,0) alignment', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 80, height: 60 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA })),
				getElementIds: vi.fn(() => ['a']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' to x=-41 → center = -41+40 = -1, within threshold of canvas center 0
			const result = engine.computeSnap(['a'], { a: { x: -41, y: 2 } });

			// Should detect vertical guide at x=0 (center alignment) or left alignment
			// left=-41 within 4 of 0? No. center=-1 within 4 of 0? Yes.
			expect(result.guides.some((g) => g.axis === 'vertical' && g.position === 0)).toBe(true);
		});

		it('does not align when outside threshold', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 100, y: 300 },
				size: { width: 120, height: 80 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			// Move well beyond threshold
			const result = engine.computeSnap(['a'], {
				a: { x: 100 + ALIGNMENT_SNAP_THRESHOLD + 10, y: 100 },
			});

			expect(result.guides.length).toBe(0);
			expect(result.deltaX).toBe(0);
		});

		it('excludes dragged elements from alignment targets', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 100, y: 200 },
				size: { width: 80, height: 60 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			// Drag both elements — neither should align to the other
			const result = engine.computeSnap(['a', 'b'], {
				a: { x: 150, y: 100 },
				b: { x: 150, y: 200 },
			});

			// Should not have guides from element alignment (only possibly canvas center)
			const nonCanvasGuides = result.guides.filter((g) => g.position !== 0);
			expect(nonCanvasGuides.length).toBe(0);
		});

		it('skips invisible and locked elements as targets', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 80, height: 60 },
			});
			const elInvisible = makeElement({
				id: 'inv',
				position: { x: 100, y: 300 },
				size: { width: 80, height: 60 },
				visible: false,
			});
			const elLocked = makeElement({
				id: 'lock',
				position: { x: 100, y: 400 },
				size: { width: 80, height: 60 },
				locked: true,
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, inv: elInvisible, lock: elLocked })),
				getElementIds: vi.fn(() => ['a', 'inv', 'lock']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' near x=100 — invisible and locked should not create guides
			const result = engine.computeSnap(['a'], { a: { x: 102, y: 100 } });

			// Only canvas center alignment possible, not element alignment
			const elementGuides = result.guides.filter((g) => g.position !== 0);
			expect(elementGuides.length).toBe(0);
		});
	});

	describe('multi-element drag', () => {
		it('uses combined bounding box for alignment', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 100 },
				size: { width: 50, height: 40 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 200, y: 200 },
				size: { width: 50, height: 40 },
			});
			const elTarget = makeElement({
				id: 'target',
				position: { x: 100, y: 400 },
				size: { width: 150, height: 40 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB, target: elTarget })),
				getElementIds: vi.fn(() => ['a', 'b', 'target']),
			});
			const engine = new SnapEngine(deps);

			// Drag a+b together; combined left edge=102, target left=100
			const result = engine.computeSnap(['a', 'b'], {
				a: { x: 102, y: 100 },
				b: { x: 202, y: 200 },
			});

			expect(result.deltaX).toBeCloseTo(-2, 5);
			expect(result.guides.some((g) => g.axis === 'vertical' && g.position === 100)).toBe(true);
		});
	});

	describe('alignment overrides grid snap', () => {
		it('alignment snap overrides grid snap when both apply', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 80, height: 60 },
			});
			const elTarget = makeElement({
				id: 'target',
				position: { x: 99, y: 300 },
				size: { width: 100, height: 50 },
			});
			const deps = makeDeps({
				getSnapEnabled: vi.fn(() => true),
				getGridSize: vi.fn(() => 8),
				getElements: vi.fn(() => ({ a: elA, target: elTarget })),
				getElementIds: vi.fn(() => ['a', 'target']),
			});
			const engine = new SnapEngine(deps);

			// Raw position x=97, grid would snap to 96
			// After grid snap, left=96, which is within 4px of target left=99
			// Alignment should pull from 96 to 99 (additional +3)
			const result = engine.computeSnap(['a'], { a: { x: 97, y: 100 } });

			// Should align to target at 99, not just grid at 96
			expect(result.guides.some((g) => g.axis === 'vertical')).toBe(true);
		});
	});

	describe('closest match wins', () => {
		it('picks the closest alignment when multiple targets match', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 80, height: 60 },
			});
			const elTarget1 = makeElement({
				id: 't1',
				position: { x: 101, y: 300 },
				size: { width: 50, height: 40 },
			});
			const elTarget2 = makeElement({
				id: 't2',
				position: { x: 103, y: 400 },
				size: { width: 50, height: 40 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, t1: elTarget1, t2: elTarget2 })),
				getElementIds: vi.fn(() => ['a', 't1', 't2']),
			});
			const engine = new SnapEngine(deps);

			// Drag 'a' to x=100 → left=100, t1 left=101 (diff=1), t2 left=103 (diff=3)
			// Should pick t1 (closer)
			const result = engine.computeSnap(['a'], { a: { x: 100, y: 100 } });

			expect(result.deltaX).toBeCloseTo(1, 5); // snap to 101
			const vGuide = result.guides.find((g) => g.axis === 'vertical');
			expect(vGuide?.position).toBe(101);
		});
	});

	describe('empty inputs', () => {
		it('returns zero delta for empty dragged IDs', () => {
			const deps = makeDeps();
			const engine = new SnapEngine(deps);

			const result = engine.computeSnap([], {});

			expect(result.deltaX).toBe(0);
			expect(result.deltaY).toBe(0);
			expect(result.guides).toEqual([]);
		});
	});

	describe('zoom-aware threshold', () => {
		it('scales alignment threshold inversely with camera zoom', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 0, y: 0 },
				size: { width: 80, height: 60 },
			});
			const elTarget = makeElement({
				id: 'target',
				position: { x: 100, y: 300 },
				size: { width: 80, height: 60 },
			});
			const deps = makeDeps({
				getCameraZoom: vi.fn(() => 2), // 2x zoom → threshold = 4/2 = 2 world px
				getElements: vi.fn(() => ({ a: elA, target: elTarget })),
				getElementIds: vi.fn(() => ['a', 'target']),
			});
			const engine = new SnapEngine(deps);

			// At zoom=2, threshold=2 world px. Place left at 97 → diff from 100 = 3 → outside threshold
			const result = engine.computeSnap(['a'], { a: { x: 97, y: 100 } });

			const leftAlign = result.guides.find((g) => g.axis === 'vertical' && g.position === 100);
			expect(leftAlign).toBeUndefined();

			// Place left at 99 → diff from 100 = 1 → within threshold
			const result2 = engine.computeSnap(['a'], { a: { x: 99, y: 100 } });

			expect(result2.guides.some((g) => g.axis === 'vertical' && g.position === 100)).toBe(true);
		});
	});

	describe('guide extents', () => {
		it('vertical guide spans from dragged to target along Y', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 100, y: 50 },
				size: { width: 80, height: 60 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 100, y: 300 },
				size: { width: 80, height: 60 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			const result = engine.computeSnap(['a'], { a: { x: 101, y: 50 } });

			const vGuide = result.guides.find((g) => g.axis === 'vertical');
			expect(vGuide).toBeDefined();
			if (vGuide) {
				// Should span from above elA top (50) to below elB bottom (360), with padding
				expect(vGuide.start).toBeLessThan(50);
				expect(vGuide.end).toBeGreaterThan(360);
			}
		});

		it('horizontal guide spans from dragged to target along X', () => {
			const elA = makeElement({
				id: 'a',
				position: { x: 50, y: 100 },
				size: { width: 80, height: 60 },
			});
			const elB = makeElement({
				id: 'b',
				position: { x: 300, y: 100 },
				size: { width: 80, height: 60 },
			});
			const deps = makeDeps({
				getElements: vi.fn(() => ({ a: elA, b: elB })),
				getElementIds: vi.fn(() => ['a', 'b']),
			});
			const engine = new SnapEngine(deps);

			const result = engine.computeSnap(['a'], { a: { x: 50, y: 101 } });

			const hGuide = result.guides.find((g) => g.axis === 'horizontal');
			expect(hGuide).toBeDefined();
			if (hGuide) {
				// Should span from before elA left (50) to after elB right (380), with padding
				expect(hGuide.start).toBeLessThan(50);
				expect(hGuide.end).toBeGreaterThan(380);
			}
		});
	});
});
