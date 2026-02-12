import { describe, expect, it } from 'vitest';
import {
	computeBoundingBox,
	getAnchorHandle,
	getHandlePosition,
	HANDLE_CURSORS,
} from './interaction-state';

describe('interaction-state utilities', () => {
	describe('HANDLE_CURSORS', () => {
		it('has correct cursor for all handle positions', () => {
			expect(HANDLE_CURSORS['top-left']).toBe('nwse-resize');
			expect(HANDLE_CURSORS['top-right']).toBe('nesw-resize');
			expect(HANDLE_CURSORS['bottom-left']).toBe('nesw-resize');
			expect(HANDLE_CURSORS['bottom-right']).toBe('nwse-resize');
			expect(HANDLE_CURSORS['top-center']).toBe('ns-resize');
			expect(HANDLE_CURSORS['bottom-center']).toBe('ns-resize');
			expect(HANDLE_CURSORS['middle-left']).toBe('ew-resize');
			expect(HANDLE_CURSORS['middle-right']).toBe('ew-resize');
			expect(HANDLE_CURSORS.rotation).toBe('grab');
		});
	});

	describe('getAnchorHandle', () => {
		it('returns the opposite handle for corners', () => {
			expect(getAnchorHandle('top-left')).toBe('bottom-right');
			expect(getAnchorHandle('top-right')).toBe('bottom-left');
			expect(getAnchorHandle('bottom-left')).toBe('top-right');
			expect(getAnchorHandle('bottom-right')).toBe('top-left');
		});

		it('returns the opposite handle for edges', () => {
			expect(getAnchorHandle('top-center')).toBe('bottom-center');
			expect(getAnchorHandle('bottom-center')).toBe('top-center');
			expect(getAnchorHandle('middle-left')).toBe('middle-right');
			expect(getAnchorHandle('middle-right')).toBe('middle-left');
		});
	});

	describe('getHandlePosition', () => {
		const bounds = { x: 100, y: 200, width: 80, height: 60 };

		it('returns corners correctly', () => {
			expect(getHandlePosition('top-left', bounds)).toEqual({ x: 100, y: 200 });
			expect(getHandlePosition('top-right', bounds)).toEqual({ x: 180, y: 200 });
			expect(getHandlePosition('bottom-left', bounds)).toEqual({ x: 100, y: 260 });
			expect(getHandlePosition('bottom-right', bounds)).toEqual({ x: 180, y: 260 });
		});

		it('returns edge midpoints correctly', () => {
			expect(getHandlePosition('top-center', bounds)).toEqual({ x: 140, y: 200 });
			expect(getHandlePosition('bottom-center', bounds)).toEqual({ x: 140, y: 260 });
			expect(getHandlePosition('middle-left', bounds)).toEqual({ x: 100, y: 230 });
			expect(getHandlePosition('middle-right', bounds)).toEqual({ x: 180, y: 230 });
		});

		it('returns rotation handle at top-center', () => {
			const pos = getHandlePosition('rotation', bounds);
			expect(pos.x).toBe(140); // center x
			expect(pos.y).toBe(200); // top y (distance added by renderer)
		});
	});

	describe('computeBoundingBox', () => {
		it('returns zero box for empty array', () => {
			expect(computeBoundingBox([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
		});

		it('returns element bounds for single element', () => {
			const result = computeBoundingBox([
				{ position: { x: 10, y: 20 }, size: { width: 100, height: 50 } },
			]);
			expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 });
		});

		it('computes combined bounds for multiple elements', () => {
			const result = computeBoundingBox([
				{ position: { x: 10, y: 20 }, size: { width: 50, height: 30 } },
				{ position: { x: 100, y: 100 }, size: { width: 40, height: 60 } },
			]);
			expect(result).toEqual({ x: 10, y: 20, width: 130, height: 140 });
		});

		it('handles overlapping elements', () => {
			const result = computeBoundingBox([
				{ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
				{ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } },
			]);
			expect(result).toEqual({ x: 0, y: 0, width: 150, height: 150 });
		});

		it('handles negative positions', () => {
			const result = computeBoundingBox([
				{ position: { x: -50, y: -30 }, size: { width: 100, height: 60 } },
			]);
			expect(result).toEqual({ x: -50, y: -30, width: 100, height: 60 });
		});
	});
});
