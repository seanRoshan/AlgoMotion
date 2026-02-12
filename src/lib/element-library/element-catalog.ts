import type { LucideIcon } from 'lucide-react';
import {
	ArrowRight,
	Braces,
	Circle,
	Code,
	GitGraph,
	Grid2x2,
	Hash,
	Highlighter,
	Image,
	Link,
	List,
	MessageSquare,
	Minus,
	RectangleHorizontal,
	Square,
	Type,
} from 'lucide-react';
import type { ElementType } from '@/types/elements';

export interface LibraryItem {
	type: ElementType;
	label: string;
	icon: LucideIcon;
}

export interface LibraryCategory {
	id: string;
	label: string;
	enabled: boolean;
	disabledReason?: string;
	items: LibraryItem[];
}

export const ELEMENT_CATALOG: LibraryCategory[] = [
	{
		id: 'primitives',
		label: 'Primitives',
		enabled: true,
		items: [
			{ type: 'node', label: 'Node', icon: Circle },
			{ type: 'edge', label: 'Edge', icon: Minus },
			{ type: 'arrow', label: 'Arrow', icon: ArrowRight },
			{ type: 'rect', label: 'Rectangle', icon: Square },
			{ type: 'ellipse', label: 'Ellipse', icon: Circle },
			{ type: 'text', label: 'Text', icon: Type },
			{ type: 'image', label: 'Image', icon: Image },
		],
	},
	{
		id: 'data-structures',
		label: 'Data Structures',
		enabled: false,
		disabledReason: 'Coming in Phase 2',
		items: [
			{ type: 'arrayCell', label: 'Array Cell', icon: Grid2x2 },
			{ type: 'linkedListNode', label: 'Linked List Node', icon: List },
			{ type: 'stackFrame', label: 'Stack Frame', icon: RectangleHorizontal },
			{ type: 'heapBlock', label: 'Heap Block', icon: Square },
			{ type: 'treeNode', label: 'Tree Node', icon: GitGraph },
			{ type: 'graphNode', label: 'Graph Node', icon: Circle },
			{ type: 'hashBucket', label: 'Hash Bucket', icon: Hash },
			{ type: 'pointerArrow', label: 'Pointer Arrow', icon: Link },
		],
	},
	{
		id: 'architecture',
		label: 'Architecture',
		enabled: false,
		disabledReason: 'Coming in Phase 4',
		items: [
			{ type: 'register', label: 'Register', icon: Square },
			{ type: 'aluUnit', label: 'ALU Unit', icon: Square },
			{ type: 'cacheLine', label: 'Cache Line', icon: Grid2x2 },
			{ type: 'memoryWord', label: 'Memory Word', icon: RectangleHorizontal },
			{ type: 'bus', label: 'Bus', icon: Minus },
			{ type: 'pipelineStage', label: 'Pipeline Stage', icon: ArrowRight },
			{ type: 'controlUnit', label: 'Control Unit', icon: Square },
			{ type: 'mux', label: 'Multiplexer', icon: GitGraph },
			{ type: 'decoder', label: 'Decoder', icon: Code },
			{ type: 'flipFlop', label: 'Flip-Flop', icon: Square },
		],
	},
	{
		id: 'math',
		label: 'Math',
		enabled: false,
		disabledReason: 'Coming in Phase 4',
		items: [
			{ type: 'coordinatePlane', label: 'Coordinate Plane', icon: Grid2x2 },
			{ type: 'vector', label: 'Vector', icon: ArrowRight },
			{ type: 'matrix', label: 'Matrix', icon: Grid2x2 },
			{ type: 'numberLine', label: 'Number Line', icon: Minus },
			{ type: 'equation', label: 'Equation', icon: Type },
		],
	},
	{
		id: 'annotations',
		label: 'Annotations',
		enabled: true,
		items: [
			{ type: 'callout', label: 'Callout', icon: MessageSquare },
			{ type: 'bracket', label: 'Bracket', icon: Braces },
			{ type: 'highlightRegion', label: 'Highlight Region', icon: Highlighter },
			{ type: 'codeSnippet', label: 'Code Snippet', icon: Code },
		],
	},
];
