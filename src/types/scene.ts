import type { JsonValue } from './common';
import type { SceneElement } from './elements';

/**
 * Supported code languages for the execution engine.
 *
 * Spec reference: Section 8.1 (CodeSource.language)
 */
export type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'pseudocode';

/**
 * Source code attached to a scene for step-by-step execution.
 * Line mapping uses string keys (JSON-serializable) mapping line numbers
 * to animation sequence IDs.
 *
 * Spec reference: Section 8.1
 */
export interface CodeSource {
	language: CodeLanguage;
	code: string;
	/** Maps line number (as string key) → animation sequence ID */
	lineMapping: Record<string, string>;
}

/**
 * Anchor point for connections between elements.
 * Either a named cardinal/center position, or a custom { x, y } relative position (0–1).
 *
 * Spec reference: Section 8.1
 */
export type AnchorPoint = 'top' | 'bottom' | 'left' | 'right' | 'center' | { x: number; y: number };

/** Arrow head/tail shape for connections */
export type ArrowShape = 'none' | 'triangle' | 'diamond' | 'circle';

/** Connection routing type */
export type ConnectionType = 'straight' | 'bezier' | 'orthogonal' | 'arc';

/**
 * Visual style for a connection line.
 *
 * Spec reference: Section 8.1
 */
export interface ConnectionStyle {
	stroke: string;
	strokeWidth: number;
	dashArray?: number[];
	animated: boolean;
	arrowHead: ArrowShape;
	arrowTail: ArrowShape;
}

/**
 * A connection (edge) between two scene elements.
 *
 * Spec reference: Section 8.1
 */
export interface Connection {
	id: string;
	fromElementId: string;
	toElementId: string;
	fromAnchor: AnchorPoint;
	toAnchor: AnchorPoint;
	type: ConnectionType;
	style: ConnectionStyle;
	label?: string;
}

/**
 * An annotation overlay on the scene canvas.
 * Annotations are non-interactive visual hints (callouts, highlights, etc.).
 */
export interface Annotation {
	id: string;
	type: 'callout' | 'bracket' | 'highlightRegion' | 'codeSnippet';
	elementId?: string;
	content: string;
	metadata: Record<string, JsonValue>;
}

/**
 * A single scene within a project.
 * Uses Record<string, SceneElement> + elementIds for ordered, serializable storage.
 *
 * Spec reference: Section 8.1
 */
export interface Scene {
	id: string;
	name: string;
	order: number;
	/** Element lookup by ID */
	elements: Record<string, SceneElement>;
	/** Ordered element IDs (render/layer order) */
	elementIds: string[];
	connections: Connection[];
	annotations: Annotation[];
	/** References to AnimationSequence IDs in the timeline store */
	animationSequenceIds: string[];
	codeSource?: CodeSource;
	/** Total duration in seconds */
	duration: number;
}
