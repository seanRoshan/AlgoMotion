import type { ElementType, SceneElement } from '@/types/elements';

const DEFAULT_STYLE = {
	fill: '#2a2a4a',
	stroke: '#6366f1',
	strokeWidth: 2,
	cornerRadius: 8,
	fontSize: 14,
	fontFamily: 'Inter, system-ui, sans-serif',
	fontWeight: 500,
	textColor: '#e0e0f0',
} as const;

const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; label: string }> = {
	node: { width: 60, height: 60, label: 'Node' },
	edge: { width: 100, height: 4, label: '' },
	arrow: { width: 100, height: 4, label: '' },
	rect: { width: 120, height: 80, label: 'Rectangle' },
	ellipse: { width: 80, height: 80, label: 'Ellipse' },
	text: { width: 120, height: 40, label: 'Text' },
	image: { width: 120, height: 90, label: '' },
	callout: { width: 160, height: 60, label: 'Callout' },
	bracket: { width: 20, height: 80, label: '' },
	highlightRegion: { width: 140, height: 100, label: '' },
	codeSnippet: { width: 200, height: 120, label: 'code' },
};

let counter = 0;

/**
 * Create a new SceneElement with sensible defaults for the given type.
 * Position is in logical canvas coordinates.
 */
export function createElement(type: ElementType, x: number, y: number): SceneElement {
	const defaults = ELEMENT_DEFAULTS[type] ?? { width: 80, height: 80, label: type };
	const id = `${type}-${Date.now()}-${counter++}`;

	return {
		id,
		type,
		position: { x: x - defaults.width / 2, y: y - defaults.height / 2 },
		size: { width: defaults.width, height: defaults.height },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label: defaults.label,
		style: { ...DEFAULT_STYLE },
		metadata: {},
	};
}
