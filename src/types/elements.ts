import type { JsonValue, Position, Shadow, Size } from './common';

/**
 * Union of all element types supported by AlgoMotion.
 * Covers primitives, data structure cells, architecture components,
 * math objects, and annotations.
 *
 * Spec reference: Section 6.2
 */
export type ElementType =
	// Primitives
	| 'node'
	| 'edge'
	| 'arrow'
	| 'rect'
	| 'ellipse'
	| 'text'
	| 'image'
	// Data Structure Cells
	| 'arrayCell'
	| 'stackFrame'
	| 'heapBlock'
	| 'pointerArrow'
	| 'treeNode'
	| 'graphNode'
	| 'linkedListNode'
	| 'hashBucket'
	// Architecture
	| 'register'
	| 'aluUnit'
	| 'cacheLine'
	| 'memoryWord'
	| 'bus'
	| 'pipelineStage'
	| 'controlUnit'
	| 'mux'
	| 'decoder'
	| 'flipFlop'
	// Math
	| 'coordinatePlane'
	| 'vector'
	| 'matrix'
	| 'numberLine'
	| 'equation'
	// Annotations
	| 'callout'
	| 'bracket'
	| 'highlightRegion'
	| 'codeSnippet';

/**
 * Visual styling properties for a scene element.
 * Applied to the Pixi.js display object during rendering.
 */
export interface ElementStyle {
	fill: string;
	stroke: string;
	strokeWidth: number;
	cornerRadius: number;
	fontSize: number;
	fontFamily: string;
	fontWeight: number;
	textColor: string;
	shadow?: Shadow;
}

/**
 * Base interface for all elements on the scene canvas.
 * Stored in Zustand scene store as Record<string, SceneElement>.
 *
 * Spec reference: Section 6.2
 */
export interface SceneElement {
	id: string;
	type: ElementType;
	position: Position;
	size: Size;
	rotation: number;
	opacity: number;
	visible: boolean;
	locked: boolean;
	label?: string;
	style: ElementStyle;
	metadata: Record<string, JsonValue>;
	children?: string[];
}

// ── Element Category Constants ──

export const PRIMITIVE_TYPES = [
	'node',
	'edge',
	'arrow',
	'rect',
	'ellipse',
	'text',
	'image',
] as const satisfies readonly ElementType[];

export const DATA_STRUCTURE_TYPES = [
	'arrayCell',
	'stackFrame',
	'heapBlock',
	'pointerArrow',
	'treeNode',
	'graphNode',
	'linkedListNode',
	'hashBucket',
] as const satisfies readonly ElementType[];

export const ARCHITECTURE_TYPES = [
	'register',
	'aluUnit',
	'cacheLine',
	'memoryWord',
	'bus',
	'pipelineStage',
	'controlUnit',
	'mux',
	'decoder',
	'flipFlop',
] as const satisfies readonly ElementType[];

export const MATH_TYPES = [
	'coordinatePlane',
	'vector',
	'matrix',
	'numberLine',
	'equation',
] as const satisfies readonly ElementType[];

export const ANNOTATION_TYPES = [
	'callout',
	'bracket',
	'highlightRegion',
	'codeSnippet',
] as const satisfies readonly ElementType[];

// ── Derived Union Types ──

export type PrimitiveElementType = (typeof PRIMITIVE_TYPES)[number];
export type DataStructureElementType = (typeof DATA_STRUCTURE_TYPES)[number];
export type ArchitectureElementType = (typeof ARCHITECTURE_TYPES)[number];
export type MathElementType = (typeof MATH_TYPES)[number];
export type AnnotationElementType = (typeof ANNOTATION_TYPES)[number];

// ── Type Guards ──

const primitiveSet: ReadonlySet<string> = new Set(PRIMITIVE_TYPES);
const dataStructureSet: ReadonlySet<string> = new Set(DATA_STRUCTURE_TYPES);
const architectureSet: ReadonlySet<string> = new Set(ARCHITECTURE_TYPES);
const mathSet: ReadonlySet<string> = new Set(MATH_TYPES);
const annotationSet: ReadonlySet<string> = new Set(ANNOTATION_TYPES);

const NODE_TYPES: ReadonlySet<string> = new Set([
	'node',
	'rect',
	'ellipse',
	'text',
	'image',
	'arrayCell',
	'stackFrame',
	'heapBlock',
	'treeNode',
	'graphNode',
	'linkedListNode',
	'hashBucket',
	'register',
	'aluUnit',
	'cacheLine',
	'memoryWord',
	'pipelineStage',
	'controlUnit',
	'mux',
	'decoder',
	'flipFlop',
	'coordinatePlane',
	'vector',
	'matrix',
	'numberLine',
	'equation',
	'callout',
	'bracket',
	'highlightRegion',
	'codeSnippet',
]);

const EDGE_TYPES: ReadonlySet<string> = new Set(['edge', 'arrow', 'pointerArrow', 'bus']);

export function isPrimitiveElement(
	element: SceneElement,
): element is SceneElement & { type: PrimitiveElementType } {
	return primitiveSet.has(element.type);
}

export function isDataStructureElement(
	element: SceneElement,
): element is SceneElement & { type: DataStructureElementType } {
	return dataStructureSet.has(element.type);
}

export function isArchitectureElement(
	element: SceneElement,
): element is SceneElement & { type: ArchitectureElementType } {
	return architectureSet.has(element.type);
}

export function isMathElement(
	element: SceneElement,
): element is SceneElement & { type: MathElementType } {
	return mathSet.has(element.type);
}

export function isAnnotationElement(
	element: SceneElement,
): element is SceneElement & { type: AnnotationElementType } {
	return annotationSet.has(element.type);
}

export function isNodeElement(element: SceneElement): boolean {
	return NODE_TYPES.has(element.type);
}

export function isEdgeElement(element: SceneElement): boolean {
	return EDGE_TYPES.has(element.type);
}

export function isCompositeElement(
	element: SceneElement,
): element is SceneElement & { children: string[] } {
	return element.children !== undefined && element.children.length > 0;
}
