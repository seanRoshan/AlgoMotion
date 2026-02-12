import { describe, expect, it } from 'vitest';
import type { SceneElement } from '@/types';
import { HitTester } from './hit-tester';

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

describe('HitTester', () => {
	const tester = new HitTester();

	describe('pointInElement', () => {
		const el = makeElement();

		it('returns true for point inside bounds', () => {
			expect(tester.pointInElement(120, 130, el)).toBe(true);
		});

		it('returns true for point on edge', () => {
			expect(tester.pointInElement(100, 100, el)).toBe(true); // top-left
			expect(tester.pointInElement(180, 160, el)).toBe(true); // bottom-right
		});

		it('returns false for point outside bounds', () => {
			expect(tester.pointInElement(99, 130, el)).toBe(false);
			expect(tester.pointInElement(181, 130, el)).toBe(false);
			expect(tester.pointInElement(120, 99, el)).toBe(false);
			expect(tester.pointInElement(120, 161, el)).toBe(false);
		});
	});

	describe('hitTest', () => {
		const el1 = makeElement({ id: 'el-1', position: { x: 100, y: 100 } });
		const el2 = makeElement({ id: 'el-2', position: { x: 200, y: 200 } });
		const elements: Record<string, SceneElement> = { 'el-1': el1, 'el-2': el2 };
		const elementIds = ['el-1', 'el-2'];

		it('returns element hit when clicking on an element', () => {
			const result = tester.hitTest(120, 130, elements, elementIds, [], 1);
			expect(result).toEqual({ type: 'element', elementId: 'el-1' });
		});

		it('returns topmost element in z-order (last in array)', () => {
			// Overlapping elements — el-3 is "on top" of el-1
			const el3 = makeElement({
				id: 'el-3',
				position: { x: 110, y: 110 },
				size: { width: 50, height: 50 },
			});
			const els = { ...elements, 'el-3': el3 };
			const ids = ['el-1', 'el-2', 'el-3'];
			const result = tester.hitTest(130, 130, els, ids, [], 1);
			expect(result).toEqual({ type: 'element', elementId: 'el-3' });
		});

		it('returns empty when clicking on empty canvas', () => {
			const result = tester.hitTest(50, 50, elements, elementIds, [], 1);
			expect(result).toEqual({ type: 'empty' });
		});

		it('skips invisible elements', () => {
			const invisible = makeElement({ id: 'el-1', visible: false });
			const result = tester.hitTest(120, 130, { 'el-1': invisible }, ['el-1'], [], 1);
			expect(result).toEqual({ type: 'empty' });
		});

		it('skips locked elements', () => {
			const locked = makeElement({ id: 'el-1', locked: true });
			const result = tester.hitTest(120, 130, { 'el-1': locked }, ['el-1'], [], 1);
			expect(result).toEqual({ type: 'empty' });
		});

		it('tests handles when elements are selected', () => {
			// Click on the top-left corner of el-1 (at position 100, 100)
			const result = tester.hitTest(100, 100, elements, elementIds, ['el-1'], 1);
			expect(result.type).toBe('handle');
			if (result.type === 'handle') {
				expect(result.handle).toBe('top-left');
			}
		});
	});

	describe('getElementsInRect', () => {
		const el1 = makeElement({
			id: 'el-1',
			position: { x: 100, y: 100 },
			size: { width: 80, height: 60 },
		});
		const el2 = makeElement({
			id: 'el-2',
			position: { x: 300, y: 300 },
			size: { width: 80, height: 60 },
		});
		const el3 = makeElement({
			id: 'el-3',
			position: { x: 150, y: 150 },
			size: { width: 40, height: 40 },
		});
		const elements: Record<string, SceneElement> = { 'el-1': el1, 'el-2': el2, 'el-3': el3 };
		const elementIds = ['el-1', 'el-2', 'el-3'];

		it('returns elements that intersect the rect', () => {
			const result = tester.getElementsInRect(
				{ x: 90, y: 90, width: 100, height: 100 },
				elements,
				elementIds,
			);
			expect(result).toContain('el-1');
			expect(result).toContain('el-3');
			expect(result).not.toContain('el-2');
		});

		it('returns empty for rect that misses all elements', () => {
			const result = tester.getElementsInRect(
				{ x: 0, y: 0, width: 50, height: 50 },
				elements,
				elementIds,
			);
			expect(result).toHaveLength(0);
		});

		it('handles negative-dimension rects (drag from bottom-right to top-left)', () => {
			const result = tester.getElementsInRect(
				{ x: 190, y: 190, width: -100, height: -100 },
				elements,
				elementIds,
			);
			expect(result).toContain('el-1');
			expect(result).toContain('el-3');
		});

		it('skips locked and invisible elements', () => {
			const locked = makeElement({ id: 'el-1', locked: true, position: { x: 100, y: 100 } });
			const invisible = makeElement({ id: 'el-3', visible: false, position: { x: 150, y: 150 } });
			const els = { 'el-1': locked, 'el-2': el2, 'el-3': invisible };
			const result = tester.getElementsInRect(
				{ x: 90, y: 90, width: 120, height: 120 },
				els,
				elementIds,
			);
			expect(result).toHaveLength(0);
		});
	});
});
