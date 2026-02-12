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
	'Dynamic Programming',
	'Architecture',
	'String',
	'Math',
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

	// ── Phase 5: Additional Templates ──

	// Sorting (3 new — Merge Sort already exists above)
	{
		id: 'heap-sort',
		name: 'Heap Sort',
		description: 'Build a max-heap from the array, then repeatedly extract the maximum to sort.',
		category: 'Sorting',
		difficulty: 'intermediate',
		tags: ['sorting', 'heap', 'in-place', 'comparison'],
		elements: [
			// Array representation
			makeCell('hs-0', 40, 40, '3'),
			makeCell('hs-1', 110, 40, '9'),
			makeCell('hs-2', 180, 40, '1'),
			makeCell('hs-3', 250, 40, '7'),
			makeCell('hs-4', 320, 40, '5'),
			// Tree representation
			makeCell('hs-t0', 200, 140, '3', 'treeNode'),
			makeCell('hs-t1', 120, 220, '9', 'treeNode'),
			makeCell('hs-t2', 280, 220, '1', 'treeNode'),
			makeCell('hs-t3', 80, 300, '7', 'treeNode'),
			makeCell('hs-t4', 160, 300, '5', 'treeNode'),
		],
	},
	{
		id: 'radix-sort',
		name: 'Radix Sort',
		description: 'Sort integers digit by digit from least significant to most significant.',
		category: 'Sorting',
		difficulty: 'advanced',
		tags: ['sorting', 'non-comparison', 'stable', 'linear'],
		elements: [
			makeCell('rx-0', 40, 60, '170'),
			makeCell('rx-1', 110, 60, '45'),
			makeCell('rx-2', 180, 60, '75'),
			makeCell('rx-3', 250, 60, '90'),
			makeCell('rx-4', 320, 60, '802'),
			makeCell('rx-5', 390, 60, '24'),
			// Buckets row
			...Array.from({ length: 10 }, (_, i) => makeCell(`rx-b${i}`, 40 + i * 50, 180, `${i}`)),
		],
	},
	{
		id: 'counting-sort',
		name: 'Counting Sort',
		description: 'Count occurrences of each value and use counts to place elements in order.',
		category: 'Sorting',
		difficulty: 'intermediate',
		tags: ['sorting', 'non-comparison', 'stable', 'linear'],
		elements: [
			// Input array
			makeCell('cs-0', 40, 60, '4'),
			makeCell('cs-1', 110, 60, '2'),
			makeCell('cs-2', 180, 60, '2'),
			makeCell('cs-3', 250, 60, '8'),
			makeCell('cs-4', 320, 60, '3'),
			makeCell('cs-5', 390, 60, '3'),
			// Count array
			makeCell('cs-c0', 40, 180, '0'),
			makeCell('cs-c1', 110, 180, '0'),
			makeCell('cs-c2', 180, 180, '0'),
			makeCell('cs-c3', 250, 180, '0'),
			makeCell('cs-c4', 320, 180, '0'),
		],
	},

	// Graph (4 new)
	{
		id: 'dijkstra',
		name: "Dijkstra's Shortest Path",
		description: 'Find the shortest path from a source to all vertices using greedy relaxation.',
		category: 'Graph',
		difficulty: 'advanced',
		tags: ['graph', 'shortest-path', 'greedy', 'weighted'],
		elements: [
			makeCell('dj-0', 80, 40, 'A', 'graphNode'),
			makeCell('dj-1', 280, 40, 'B', 'graphNode'),
			makeCell('dj-2', 80, 200, 'C', 'graphNode'),
			makeCell('dj-3', 280, 200, 'D', 'graphNode'),
			makeCell('dj-4', 180, 120, 'E', 'graphNode'),
		],
	},
	{
		id: 'prims-mst',
		name: "Prim's MST",
		description: 'Build a minimum spanning tree by greedily adding the cheapest edge.',
		category: 'Graph',
		difficulty: 'advanced',
		tags: ['graph', 'mst', 'greedy', 'weighted'],
		elements: [
			makeCell('pm-0', 80, 40, 'A', 'graphNode'),
			makeCell('pm-1', 240, 40, 'B', 'graphNode'),
			makeCell('pm-2', 400, 40, 'C', 'graphNode'),
			makeCell('pm-3', 80, 200, 'D', 'graphNode'),
			makeCell('pm-4', 240, 200, 'E', 'graphNode'),
			makeCell('pm-5', 400, 200, 'F', 'graphNode'),
		],
	},
	{
		id: 'kruskals-mst',
		name: "Kruskal's MST",
		description: 'Build a minimum spanning tree by sorting edges and using union-find.',
		category: 'Graph',
		difficulty: 'advanced',
		tags: ['graph', 'mst', 'greedy', 'union-find', 'weighted'],
		elements: [
			makeCell('km-0', 80, 40, 'A', 'graphNode'),
			makeCell('km-1', 240, 40, 'B', 'graphNode'),
			makeCell('km-2', 400, 40, 'C', 'graphNode'),
			makeCell('km-3', 160, 180, 'D', 'graphNode'),
			makeCell('km-4', 320, 180, 'E', 'graphNode'),
		],
	},
	{
		id: 'topological-sort',
		name: 'Topological Sort',
		description: 'Order directed acyclic graph vertices so every edge goes from earlier to later.',
		category: 'Graph',
		difficulty: 'intermediate',
		tags: ['graph', 'dag', 'dfs', 'ordering'],
		elements: [
			makeCell('ts-0', 200, 20, 'A', 'graphNode'),
			makeCell('ts-1', 100, 100, 'B', 'graphNode'),
			makeCell('ts-2', 300, 100, 'C', 'graphNode'),
			makeCell('ts-3', 60, 200, 'D', 'graphNode'),
			makeCell('ts-4', 200, 200, 'E', 'graphNode'),
			makeCell('ts-5', 340, 200, 'F', 'graphNode'),
		],
	},

	// Trees (3 new)
	{
		id: 'avl-tree',
		name: 'AVL Tree Insert + Rebalance',
		description: 'Self-balancing BST that maintains height difference ≤ 1 via rotations.',
		category: 'Trees',
		difficulty: 'advanced',
		tags: ['tree', 'bst', 'balanced', 'rotation', 'self-balancing'],
		elements: [
			makeCell('avl-0', 200, 40, '10', 'treeNode'),
			makeCell('avl-1', 120, 120, '5', 'treeNode'),
			makeCell('avl-2', 280, 120, '15', 'treeNode'),
			makeCell('avl-3', 80, 200, '3', 'treeNode'),
			makeCell('avl-4', 160, 200, '7', 'treeNode'),
			makeCell('avl-5', 240, 200, '12', 'treeNode'),
		],
	},
	{
		id: 'red-black-tree',
		name: 'Red-Black Tree Insert + Fixup',
		description: 'Self-balancing BST using red/black coloring rules to maintain balance.',
		category: 'Trees',
		difficulty: 'advanced',
		tags: ['tree', 'bst', 'balanced', 'red-black', 'self-balancing'],
		elements: [
			makeCell('rb-0', 200, 40, '13', 'treeNode'),
			makeCell('rb-1', 120, 120, '8', 'treeNode'),
			makeCell('rb-2', 280, 120, '17', 'treeNode'),
			makeCell('rb-3', 80, 200, '1', 'treeNode'),
			makeCell('rb-4', 160, 200, '11', 'treeNode'),
			makeCell('rb-5', 240, 200, '15', 'treeNode'),
			makeCell('rb-6', 320, 200, '25', 'treeNode'),
		],
	},
	{
		id: 'heap-extract-min',
		name: 'Heap Extract-Min',
		description: 'Remove the minimum from a min-heap and restore the heap property via heapify.',
		category: 'Trees',
		difficulty: 'intermediate',
		tags: ['tree', 'heap', 'priority-queue', 'heapify'],
		elements: [
			makeCell('hem-0', 200, 40, '1', 'treeNode'),
			makeCell('hem-1', 120, 120, '3', 'treeNode'),
			makeCell('hem-2', 280, 120, '6', 'treeNode'),
			makeCell('hem-3', 80, 200, '5', 'treeNode'),
			makeCell('hem-4', 160, 200, '9', 'treeNode'),
			makeCell('hem-5', 240, 200, '8', 'treeNode'),
		],
	},

	// Dynamic Programming (3 new)
	{
		id: 'knapsack',
		name: '0/1 Knapsack',
		description: 'Maximize value within a weight capacity using a 2D dynamic programming table.',
		category: 'Dynamic Programming',
		difficulty: 'advanced',
		tags: ['dp', 'optimization', 'tabulation', 'knapsack'],
		elements: [
			// Items row
			makeCell('kn-i0', 40, 40, 'w:1 v:6'),
			makeCell('kn-i1', 140, 40, 'w:2 v:10'),
			makeCell('kn-i2', 240, 40, 'w:3 v:12'),
			// DP table (3x4 grid)
			...Array.from({ length: 4 }, (_, col) =>
				Array.from({ length: 4 }, (_, row) =>
					makeCell(`kn-${row}-${col}`, 40 + col * 70, 140 + row * 70, '0'),
				),
			).flat(),
		],
	},
	{
		id: 'lcs',
		name: 'Longest Common Subsequence',
		description: 'Find the longest subsequence common to two strings using DP table + backtrack.',
		category: 'Dynamic Programming',
		difficulty: 'advanced',
		tags: ['dp', 'string', 'tabulation', 'backtracking'],
		elements: [
			// String 1 header
			makeCell('lcs-h0', 110, 40, 'A'),
			makeCell('lcs-h1', 180, 40, 'B'),
			makeCell('lcs-h2', 250, 40, 'C'),
			makeCell('lcs-h3', 320, 40, 'B'),
			// String 2 header
			makeCell('lcs-v0', 40, 110, 'B'),
			makeCell('lcs-v1', 40, 180, 'D'),
			makeCell('lcs-v2', 40, 250, 'C'),
			// DP table
			...Array.from({ length: 3 }, (_, row) =>
				Array.from({ length: 4 }, (_, col) =>
					makeCell(`lcs-${row}-${col}`, 110 + col * 70, 110 + row * 70, '0'),
				),
			).flat(),
		],
	},
	{
		id: 'edit-distance',
		name: 'Edit Distance',
		description:
			'Find minimum edits (insert, delete, replace) to transform one string into another.',
		category: 'Dynamic Programming',
		difficulty: 'advanced',
		tags: ['dp', 'string', 'levenshtein', 'tabulation'],
		elements: [
			// Source string
			makeCell('ed-s0', 110, 40, 'k'),
			makeCell('ed-s1', 180, 40, 'i'),
			makeCell('ed-s2', 250, 40, 't'),
			// Target string
			makeCell('ed-t0', 40, 110, 's'),
			makeCell('ed-t1', 40, 180, 'i'),
			makeCell('ed-t2', 40, 250, 't'),
			// DP table
			...Array.from({ length: 4 }, (_, row) =>
				Array.from({ length: 4 }, (_, col) =>
					makeCell(
						`ed-${row}-${col}`,
						110 + col * 70,
						40 + row * 70,
						`${row === 0 ? col : col === 0 ? row : 0}`,
					),
				),
			).flat(),
		],
	},

	// Architecture (3 new)
	{
		id: 'pipeline-hazards',
		name: '5-Stage Pipeline with Hazards',
		description: 'Visualize IF/ID/EX/MEM/WB stages with data hazards and stall detection.',
		category: 'Architecture',
		difficulty: 'advanced',
		tags: ['architecture', 'pipeline', 'hazards', 'cpu'],
		elements: [
			makeCell('pl-0', 40, 100, 'IF', 'pipelineStage'),
			makeCell('pl-1', 140, 100, 'ID', 'pipelineStage'),
			makeCell('pl-2', 240, 100, 'EX', 'pipelineStage'),
			makeCell('pl-3', 340, 100, 'MEM', 'pipelineStage'),
			makeCell('pl-4', 440, 100, 'WB', 'pipelineStage'),
			// Instructions
			makeCell('pl-i0', 40, 200, 'ADD R1,R2,R3'),
			makeCell('pl-i1', 40, 260, 'SUB R4,R1,R5'),
			makeCell('pl-i2', 40, 320, 'AND R6,R1,R7'),
		],
	},
	{
		id: 'cache-hit-miss',
		name: 'Cache Hit/Miss Sequence',
		description: 'Animate memory access patterns showing cache hits, misses, and evictions.',
		category: 'Architecture',
		difficulty: 'intermediate',
		tags: ['architecture', 'cache', 'memory', 'cpu'],
		elements: [
			// Cache lines
			makeCell('ch-0', 40, 60, 'Line 0', 'cacheLine'),
			makeCell('ch-1', 40, 130, 'Line 1', 'cacheLine'),
			makeCell('ch-2', 40, 200, 'Line 2', 'cacheLine'),
			makeCell('ch-3', 40, 270, 'Line 3', 'cacheLine'),
			// Memory blocks
			makeCell('ch-m0', 250, 60, 'Blk 0', 'memoryWord'),
			makeCell('ch-m1', 250, 130, 'Blk 1', 'memoryWord'),
			makeCell('ch-m2', 250, 200, 'Blk 2', 'memoryWord'),
			makeCell('ch-m3', 250, 270, 'Blk 3', 'memoryWord'),
		],
	},
	{
		id: 'virtual-memory',
		name: 'Virtual Memory Page Fault',
		description: 'Visualize page table lookups, TLB checks, and page fault handling.',
		category: 'Architecture',
		difficulty: 'advanced',
		tags: ['architecture', 'virtual-memory', 'page-fault', 'os'],
		elements: [
			// Page table entries
			makeCell('vm-p0', 40, 60, 'Page 0', 'memoryWord'),
			makeCell('vm-p1', 40, 130, 'Page 1', 'memoryWord'),
			makeCell('vm-p2', 40, 200, 'Page 2', 'memoryWord'),
			makeCell('vm-p3', 40, 270, 'Page 3', 'memoryWord'),
			// Physical frames
			makeCell('vm-f0', 280, 60, 'Frame 0', 'memoryWord'),
			makeCell('vm-f1', 280, 130, 'Frame 1', 'memoryWord'),
			makeCell('vm-f2', 280, 200, 'Frame 2', 'memoryWord'),
			// Disk
			makeCell('vm-d0', 480, 140, 'Disk', 'register'),
		],
	},

	// String (2 new)
	{
		id: 'kmp-pattern-matching',
		name: 'KMP Pattern Matching',
		description:
			'Search for a pattern in text using the failure function to skip unnecessary comparisons.',
		category: 'String',
		difficulty: 'advanced',
		tags: ['string', 'pattern-matching', 'kmp', 'failure-function'],
		elements: [
			// Text
			makeCell('kmp-t0', 40, 60, 'A'),
			makeCell('kmp-t1', 110, 60, 'B'),
			makeCell('kmp-t2', 180, 60, 'A'),
			makeCell('kmp-t3', 250, 60, 'B'),
			makeCell('kmp-t4', 320, 60, 'A'),
			makeCell('kmp-t5', 390, 60, 'C'),
			makeCell('kmp-t6', 460, 60, 'A'),
			// Pattern
			makeCell('kmp-p0', 40, 160, 'A'),
			makeCell('kmp-p1', 110, 160, 'B'),
			makeCell('kmp-p2', 180, 160, 'A'),
			makeCell('kmp-p3', 250, 160, 'C'),
			// Failure function
			makeCell('kmp-f0', 40, 260, '0'),
			makeCell('kmp-f1', 110, 260, '0'),
			makeCell('kmp-f2', 180, 260, '1'),
			makeCell('kmp-f3', 250, 260, '0'),
		],
	},
	{
		id: 'rabin-karp',
		name: 'Rabin-Karp Hashing',
		description: 'Pattern matching using rolling hash values for fast average-case comparison.',
		category: 'String',
		difficulty: 'advanced',
		tags: ['string', 'pattern-matching', 'hashing', 'rolling-hash'],
		elements: [
			// Text
			makeCell('rk-t0', 40, 60, 'A'),
			makeCell('rk-t1', 110, 60, 'B'),
			makeCell('rk-t2', 180, 60, 'C'),
			makeCell('rk-t3', 250, 60, 'D'),
			makeCell('rk-t4', 320, 60, 'A'),
			makeCell('rk-t5', 390, 60, 'B'),
			// Pattern
			makeCell('rk-p0', 40, 160, 'D'),
			makeCell('rk-p1', 110, 160, 'A'),
			makeCell('rk-p2', 180, 160, 'B'),
			// Hash display
			makeCell('rk-h0', 40, 260, 'h=?'),
			makeCell('rk-h1', 180, 260, 'h=?'),
		],
	},

	// Math (1 new)
	{
		id: 'sieve-eratosthenes',
		name: 'Sieve of Eratosthenes',
		description: 'Find all primes up to N by iteratively eliminating multiples.',
		category: 'Math',
		difficulty: 'intermediate',
		tags: ['math', 'primes', 'sieve', 'number-theory'],
		elements: [
			// Number grid (2-30)
			...Array.from({ length: 29 }, (_, i) => {
				const n = i + 2;
				const col = i % 10;
				const row = Math.floor(i / 10);
				return makeCell(`se-${n}`, 40 + col * 50, 60 + row * 60, `${n}`, 'numberLine');
			}),
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
