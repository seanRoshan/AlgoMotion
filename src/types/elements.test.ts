import { describe, expect, it } from 'vitest';
import type { SceneElement } from './elements';
import {
	ANNOTATION_TYPES,
	ARCHITECTURE_TYPES,
	DATA_STRUCTURE_TYPES,
	isAnnotationElement,
	isArchitectureElement,
	isCompositeElement,
	isDataStructureElement,
	isEdgeElement,
	isMathElement,
	isNodeElement,
	isPrimitiveElement,
	MATH_TYPES,
	PRIMITIVE_TYPES,
} from './elements';

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: 'test-1',
		type: 'rect',
		position: { x: 0, y: 0 },
		size: { width: 100, height: 100 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		style: {
			fill: '#ffffff',
			stroke: '#000000',
			strokeWidth: 1,
			cornerRadius: 0,
			fontSize: 14,
			fontFamily: 'Inter',
			fontWeight: 400,
			textColor: '#000000',
		},
		metadata: {},
		...overrides,
	};
}

describe('element category constants', () => {
	it('has 7 primitive types', () => {
		expect(PRIMITIVE_TYPES).toHaveLength(7);
		expect(PRIMITIVE_TYPES).toContain('node');
		expect(PRIMITIVE_TYPES).toContain('edge');
		expect(PRIMITIVE_TYPES).toContain('arrow');
		expect(PRIMITIVE_TYPES).toContain('rect');
		expect(PRIMITIVE_TYPES).toContain('ellipse');
		expect(PRIMITIVE_TYPES).toContain('text');
		expect(PRIMITIVE_TYPES).toContain('image');
	});

	it('has 8 data structure types', () => {
		expect(DATA_STRUCTURE_TYPES).toHaveLength(8);
		expect(DATA_STRUCTURE_TYPES).toContain('arrayCell');
		expect(DATA_STRUCTURE_TYPES).toContain('treeNode');
		expect(DATA_STRUCTURE_TYPES).toContain('linkedListNode');
	});

	it('has 10 architecture types', () => {
		expect(ARCHITECTURE_TYPES).toHaveLength(10);
		expect(ARCHITECTURE_TYPES).toContain('register');
		expect(ARCHITECTURE_TYPES).toContain('bus');
		expect(ARCHITECTURE_TYPES).toContain('mux');
	});

	it('has 5 math types', () => {
		expect(MATH_TYPES).toHaveLength(5);
		expect(MATH_TYPES).toContain('vector');
		expect(MATH_TYPES).toContain('matrix');
		expect(MATH_TYPES).toContain('equation');
	});

	it('has 4 annotation types', () => {
		expect(ANNOTATION_TYPES).toHaveLength(4);
		expect(ANNOTATION_TYPES).toContain('callout');
		expect(ANNOTATION_TYPES).toContain('codeSnippet');
	});

	it('covers all 34 element types across categories', () => {
		const allTypes = [
			...PRIMITIVE_TYPES,
			...DATA_STRUCTURE_TYPES,
			...ARCHITECTURE_TYPES,
			...MATH_TYPES,
			...ANNOTATION_TYPES,
		];
		expect(allTypes).toHaveLength(34);
		// No duplicates
		expect(new Set(allTypes).size).toBe(34);
	});
});

describe('type guard: isPrimitiveElement', () => {
	it('returns true for primitive types', () => {
		for (const type of PRIMITIVE_TYPES) {
			expect(isPrimitiveElement(makeElement({ type }))).toBe(true);
		}
	});

	it('returns false for non-primitive types', () => {
		expect(isPrimitiveElement(makeElement({ type: 'arrayCell' }))).toBe(false);
		expect(isPrimitiveElement(makeElement({ type: 'register' }))).toBe(false);
	});
});

describe('type guard: isDataStructureElement', () => {
	it('returns true for data structure types', () => {
		for (const type of DATA_STRUCTURE_TYPES) {
			expect(isDataStructureElement(makeElement({ type }))).toBe(true);
		}
	});

	it('returns false for non-data-structure types', () => {
		expect(isDataStructureElement(makeElement({ type: 'rect' }))).toBe(false);
	});
});

describe('type guard: isArchitectureElement', () => {
	it('returns true for architecture types', () => {
		for (const type of ARCHITECTURE_TYPES) {
			expect(isArchitectureElement(makeElement({ type }))).toBe(true);
		}
	});

	it('returns false for non-architecture types', () => {
		expect(isArchitectureElement(makeElement({ type: 'node' }))).toBe(false);
	});
});

describe('type guard: isMathElement', () => {
	it('returns true for math types', () => {
		for (const type of MATH_TYPES) {
			expect(isMathElement(makeElement({ type }))).toBe(true);
		}
	});

	it('returns false for non-math types', () => {
		expect(isMathElement(makeElement({ type: 'node' }))).toBe(false);
	});
});

describe('type guard: isAnnotationElement', () => {
	it('returns true for annotation types', () => {
		for (const type of ANNOTATION_TYPES) {
			expect(isAnnotationElement(makeElement({ type }))).toBe(true);
		}
	});

	it('returns false for non-annotation types', () => {
		expect(isAnnotationElement(makeElement({ type: 'node' }))).toBe(false);
	});
});

describe('type guard: isNodeElement', () => {
	it('returns true for visual node elements', () => {
		expect(isNodeElement(makeElement({ type: 'rect' }))).toBe(true);
		expect(isNodeElement(makeElement({ type: 'treeNode' }))).toBe(true);
		expect(isNodeElement(makeElement({ type: 'register' }))).toBe(true);
		expect(isNodeElement(makeElement({ type: 'callout' }))).toBe(true);
	});

	it('returns false for edge/connector elements', () => {
		expect(isNodeElement(makeElement({ type: 'edge' }))).toBe(false);
		expect(isNodeElement(makeElement({ type: 'arrow' }))).toBe(false);
		expect(isNodeElement(makeElement({ type: 'pointerArrow' }))).toBe(false);
		expect(isNodeElement(makeElement({ type: 'bus' }))).toBe(false);
	});
});

describe('type guard: isEdgeElement', () => {
	it('returns true for edge/connector types', () => {
		expect(isEdgeElement(makeElement({ type: 'edge' }))).toBe(true);
		expect(isEdgeElement(makeElement({ type: 'arrow' }))).toBe(true);
		expect(isEdgeElement(makeElement({ type: 'pointerArrow' }))).toBe(true);
		expect(isEdgeElement(makeElement({ type: 'bus' }))).toBe(true);
	});

	it('returns false for node types', () => {
		expect(isEdgeElement(makeElement({ type: 'rect' }))).toBe(false);
		expect(isEdgeElement(makeElement({ type: 'node' }))).toBe(false);
	});
});

describe('type guard: isCompositeElement', () => {
	it('returns true for elements with children', () => {
		expect(isCompositeElement(makeElement({ children: ['child-1', 'child-2'] }))).toBe(true);
	});

	it('returns false for elements without children', () => {
		expect(isCompositeElement(makeElement())).toBe(false);
		expect(isCompositeElement(makeElement({ children: [] }))).toBe(false);
	});
});
