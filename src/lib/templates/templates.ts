import type { SceneElement } from '@/types';

// ── Types ──

export interface Template {
	id: string;
	name: string;
	description: string;
	category: string;
	difficulty: TemplateDifficulty;
	tags: string[];
	elements: SceneElement[];
}

export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface TemplateFilter {
	query?: string;
	category?: string;
	difficulty?: TemplateDifficulty;
}

// ── Constants ──

export const TEMPLATE_CATEGORIES = [
	'Sorting',
	'Searching',
	'Graph',
	'Data Structures',
	'Trees',
] as const;

export const TEMPLATE_DIFFICULTIES: TemplateDifficulty[] = ['beginner', 'intermediate', 'advanced'];

// ── Helper: default element style ──

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

function makeCell(
	id: string,
	x: number,
	y: number,
	label: string,
	type: SceneElement['type'] = 'arrayCell',
): SceneElement {
	return {
		id,
		type,
		position: { x, y },
		size: { width: 60, height: 60 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label,
		style: { ...DEFAULT_STYLE },
		metadata: {},
	};
}

// ── Starter Templates ──

export const templates: Template[] = [
	{
		id: 'bubble-sort',
		name: 'Bubble Sort',
		description: 'Compare adjacent elements and swap them if they are in the wrong order.',
		category: 'Sorting',
		difficulty: 'beginner',
		tags: ['sorting', 'comparison', 'in-place', 'stable'],
		elements: [
			makeCell('bs-0', 40, 100, '5'),
			makeCell('bs-1', 110, 100, '3'),
			makeCell('bs-2', 180, 100, '8'),
			makeCell('bs-3', 250, 100, '1'),
			makeCell('bs-4', 320, 100, '4'),
		],
	},
	{
		id: 'selection-sort',
		name: 'Selection Sort',
		description: 'Find the minimum element and place it at the beginning repeatedly.',
		category: 'Sorting',
		difficulty: 'beginner',
		tags: ['sorting', 'comparison', 'in-place'],
		elements: [
			makeCell('ss-0', 40, 100, '7'),
			makeCell('ss-1', 110, 100, '2'),
			makeCell('ss-2', 180, 100, '9'),
			makeCell('ss-3', 250, 100, '4'),
			makeCell('ss-4', 320, 100, '1'),
		],
	},
	{
		id: 'insertion-sort',
		name: 'Insertion Sort',
		description: 'Build a sorted array one element at a time by inserting into position.',
		category: 'Sorting',
		difficulty: 'beginner',
		tags: ['sorting', 'comparison', 'in-place', 'stable', 'adaptive'],
		elements: [
			makeCell('is-0', 40, 100, '6'),
			makeCell('is-1', 110, 100, '3'),
			makeCell('is-2', 180, 100, '8'),
			makeCell('is-3', 250, 100, '2'),
		],
	},
	{
		id: 'merge-sort',
		name: 'Merge Sort',
		description: 'Divide the array into halves, sort each half, then merge them back.',
		category: 'Sorting',
		difficulty: 'intermediate',
		tags: ['sorting', 'divide-and-conquer', 'stable', 'recursive'],
		elements: [
			makeCell('ms-0', 40, 60, '4'),
			makeCell('ms-1', 110, 60, '7'),
			makeCell('ms-2', 180, 60, '2'),
			makeCell('ms-3', 250, 60, '5'),
			makeCell('ms-4', 320, 60, '1'),
			makeCell('ms-5', 390, 60, '6'),
		],
	},
	{
		id: 'quick-sort',
		name: 'Quick Sort',
		description: 'Pick a pivot, partition elements around it, and recursively sort.',
		category: 'Sorting',
		difficulty: 'intermediate',
		tags: ['sorting', 'divide-and-conquer', 'in-place', 'recursive'],
		elements: [
			makeCell('qs-0', 40, 100, '6'),
			makeCell('qs-1', 110, 100, '3'),
			makeCell('qs-2', 180, 100, '9'),
			makeCell('qs-3', 250, 100, '1'),
			makeCell('qs-4', 320, 100, '7'),
		],
	},
	{
		id: 'binary-search',
		name: 'Binary Search',
		description: 'Efficiently search a sorted array by repeatedly dividing the search range.',
		category: 'Searching',
		difficulty: 'beginner',
		tags: ['searching', 'divide-and-conquer', 'sorted-input'],
		elements: [
			makeCell('bin-0', 40, 100, '1'),
			makeCell('bin-1', 110, 100, '3'),
			makeCell('bin-2', 180, 100, '5'),
			makeCell('bin-3', 250, 100, '7'),
			makeCell('bin-4', 320, 100, '9'),
			makeCell('bin-5', 390, 100, '11'),
		],
	},
	{
		id: 'linear-search',
		name: 'Linear Search',
		description: 'Scan through each element one by one until the target is found.',
		category: 'Searching',
		difficulty: 'beginner',
		tags: ['searching', 'sequential', 'unsorted'],
		elements: [
			makeCell('ls-0', 40, 100, '4'),
			makeCell('ls-1', 110, 100, '7'),
			makeCell('ls-2', 180, 100, '2'),
			makeCell('ls-3', 250, 100, '9'),
			makeCell('ls-4', 320, 100, '5'),
		],
	},
	{
		id: 'bfs-traversal',
		name: 'BFS Traversal',
		description: 'Explore a graph level by level using a queue.',
		category: 'Graph',
		difficulty: 'intermediate',
		tags: ['graph', 'traversal', 'queue', 'shortest-path'],
		elements: [
			makeCell('bfs-0', 200, 40, 'A', 'graphNode'),
			makeCell('bfs-1', 120, 120, 'B', 'graphNode'),
			makeCell('bfs-2', 280, 120, 'C', 'graphNode'),
			makeCell('bfs-3', 80, 200, 'D', 'graphNode'),
			makeCell('bfs-4', 200, 200, 'E', 'graphNode'),
		],
	},
	{
		id: 'dfs-traversal',
		name: 'DFS Traversal',
		description: 'Explore a graph by going as deep as possible before backtracking.',
		category: 'Graph',
		difficulty: 'intermediate',
		tags: ['graph', 'traversal', 'stack', 'recursive'],
		elements: [
			makeCell('dfs-0', 200, 40, 'A', 'graphNode'),
			makeCell('dfs-1', 120, 120, 'B', 'graphNode'),
			makeCell('dfs-2', 280, 120, 'C', 'graphNode'),
			makeCell('dfs-3', 80, 200, 'D', 'graphNode'),
		],
	},
	{
		id: 'stack-operations',
		name: 'Stack Operations',
		description: 'Push and pop elements on a LIFO stack data structure.',
		category: 'Data Structures',
		difficulty: 'beginner',
		tags: ['data-structure', 'stack', 'lifo', 'push', 'pop'],
		elements: [
			makeCell('stk-0', 100, 40, '10', 'stackFrame'),
			makeCell('stk-1', 100, 110, '20', 'stackFrame'),
			makeCell('stk-2', 100, 180, '30', 'stackFrame'),
		],
	},
	{
		id: 'queue-operations',
		name: 'Queue Operations',
		description: 'Enqueue and dequeue elements on a FIFO queue data structure.',
		category: 'Data Structures',
		difficulty: 'beginner',
		tags: ['data-structure', 'queue', 'fifo', 'enqueue', 'dequeue'],
		elements: [
			makeCell('q-0', 40, 100, 'A', 'queueCell'),
			makeCell('q-1', 110, 100, 'B', 'queueCell'),
			makeCell('q-2', 180, 100, 'C', 'queueCell'),
		],
	},
	{
		id: 'binary-tree-traversal',
		name: 'Binary Tree Traversal',
		description: 'Traverse a binary tree using inorder, preorder, or postorder strategies.',
		category: 'Trees',
		difficulty: 'intermediate',
		tags: ['tree', 'traversal', 'recursive', 'binary-tree'],
		elements: [
			makeCell('bt-0', 200, 40, '8', 'treeNode'),
			makeCell('bt-1', 120, 120, '4', 'treeNode'),
			makeCell('bt-2', 280, 120, '12', 'treeNode'),
			makeCell('bt-3', 80, 200, '2', 'treeNode'),
			makeCell('bt-4', 160, 200, '6', 'treeNode'),
		],
	},
];

// ── Query Functions ──

export function getTemplateById(id: string): Template | undefined {
	return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
	return templates.filter((t) => t.category === category);
}

export function filterTemplates(filter: TemplateFilter): Template[] {
	return templates.filter((t) => {
		if (filter.query) {
			const q = filter.query.toLowerCase();
			const matchesName = t.name.toLowerCase().includes(q);
			const matchesDesc = t.description.toLowerCase().includes(q);
			const matchesTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
			if (!matchesName && !matchesDesc && !matchesTags) return false;
		}
		if (filter.category && t.category !== filter.category) return false;
		if (filter.difficulty && t.difficulty !== filter.difficulty) return false;
		return true;
	});
}
