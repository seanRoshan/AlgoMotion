import type { SceneElement } from '@/types';
import type { Template, TemplateDifficulty } from './templates';

export interface AlgorithmTemplate extends Template {
	sourceCode: string;
	language: string;
	lineMapping: Record<number, string>;
	defaultBreakpoints: number[];
	metrics: string[];
	defaultInput?: string;
}

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

function makeAlgo(
	id: string,
	name: string,
	description: string,
	category: string,
	difficulty: TemplateDifficulty,
	tags: string[],
	elements: SceneElement[],
	sourceCode: string,
	lineMapping: Record<number, string>,
	defaultBreakpoints: number[],
	metrics: string[],
): AlgorithmTemplate {
	return {
		id,
		name,
		description,
		category,
		difficulty,
		tags,
		elements,
		sourceCode,
		language: 'javascript',
		lineMapping,
		defaultBreakpoints,
		metrics,
	};
}

// ── Bubble Sort ──

const bubbleSortCode = `let arr = [5, 3, 8, 1, 4];
let n = arr.length;
let comparisons = 0;
let swaps = 0;

for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    comparisons++;
    if (arr[j] > arr[j + 1]) {
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
      swaps++;
    }
  }
}`;

// ── Binary Search ──

const binarySearchCode = `let arr = [1, 3, 5, 7, 9, 11, 13];
let target = 7;
let left = 0;
let right = arr.length - 1;
let comparisons = 0;
let found = false;

while (left <= right) {
  let mid = Math.floor((left + right) / 2);
  comparisons++;
  if (arr[mid] === target) {
    found = true;
    break;
  } else if (arr[mid] < target) {
    left = mid + 1;
  } else {
    right = mid - 1;
  }
}`;

// ── DFS Graph Traversal ──

const dfsCode = `let graph = { A: ["B", "C"], B: ["D"], C: ["E"], D: [], E: [] };
let visited = [];
let stack = ["A"];
let nodesVisited = 0;

while (stack.length > 0) {
  let node = stack.pop();
  if (!visited.includes(node)) {
    visited.push(node);
    nodesVisited++;
    let neighbors = graph[node] || [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      if (!visited.includes(neighbors[i])) {
        stack.push(neighbors[i]);
      }
    }
  }
}`;

// ── Fibonacci DP ──

const fibonacciCode = `let n = 10;
let dp = [0, 1];
let computations = 0;

for (let i = 2; i <= n; i++) {
  dp[i] = dp[i - 1] + dp[i - 2];
  computations++;
}

let result = dp[n];`;

// ── Insertion Sort ──

const insertionSortCode = `let arr = [6, 3, 8, 2, 5];
let comparisons = 0;
let shifts = 0;

for (let i = 1; i < arr.length; i++) {
  let key = arr[i];
  let j = i - 1;
  comparisons++;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    shifts++;
    j--;
    comparisons++;
  }
  arr[j + 1] = key;
}`;

export const algorithmTemplates: AlgorithmTemplate[] = [
	makeAlgo(
		'algo-bubble-sort',
		'Bubble Sort',
		'Step through Bubble Sort with comparisons and swaps animated on the array.',
		'Sorting',
		'beginner',
		['sorting', 'comparison', 'in-place', 'stable', 'code-sync'],
		[
			makeCell('abs-0', 40, 100, '5'),
			makeCell('abs-1', 110, 100, '3'),
			makeCell('abs-2', 180, 100, '8'),
			makeCell('abs-3', 250, 100, '1'),
			makeCell('abs-4', 320, 100, '4'),
		],
		bubbleSortCode,
		{
			6: 'outer-loop-start',
			7: 'inner-loop-start',
			9: 'compare-elements',
			10: 'swap-start',
			12: 'swap-complete',
		},
		[9, 12],
		['comparisons', 'swaps'],
	),
	makeAlgo(
		'algo-binary-search',
		'Binary Search',
		'Visualize Binary Search narrowing the search range with left/right pointers.',
		'Searching',
		'beginner',
		['searching', 'divide-and-conquer', 'sorted-input', 'code-sync'],
		[
			makeCell('abs2-0', 40, 100, '1'),
			makeCell('abs2-1', 110, 100, '3'),
			makeCell('abs2-2', 180, 100, '5'),
			makeCell('abs2-3', 250, 100, '7'),
			makeCell('abs2-4', 320, 100, '9'),
			makeCell('abs2-5', 390, 100, '11'),
			makeCell('abs2-6', 460, 100, '13'),
		],
		binarySearchCode,
		{
			9: 'compute-mid',
			11: 'check-target',
			13: 'found-target',
			15: 'narrow-left',
			17: 'narrow-right',
		},
		[11, 15, 17],
		['comparisons'],
	),
	makeAlgo(
		'algo-dfs-traversal',
		'DFS Graph Traversal',
		'Stack-based DFS traversal with graph node highlighting and visited tracking.',
		'Graph',
		'intermediate',
		['graph', 'traversal', 'stack', 'code-sync'],
		[
			makeCell('adfs-0', 200, 40, 'A', 'graphNode'),
			makeCell('adfs-1', 120, 120, 'B', 'graphNode'),
			makeCell('adfs-2', 280, 120, 'C', 'graphNode'),
			makeCell('adfs-3', 80, 200, 'D', 'graphNode'),
			makeCell('adfs-4', 320, 200, 'E', 'graphNode'),
		],
		dfsCode,
		{
			7: 'pop-node',
			8: 'check-visited',
			9: 'mark-visited',
			12: 'check-neighbor',
			13: 'push-neighbor',
		},
		[7, 9, 13],
		['nodesVisited'],
	),
	makeAlgo(
		'algo-fibonacci-dp',
		'Fibonacci (DP)',
		'Bottom-up dynamic programming approach to compute Fibonacci numbers with table fill.',
		'Data Structures',
		'intermediate',
		['dynamic-programming', 'fibonacci', 'table-fill', 'code-sync'],
		[
			makeCell('afib-0', 40, 100, '0'),
			makeCell('afib-1', 110, 100, '1'),
			makeCell('afib-2', 180, 100, '?'),
			makeCell('afib-3', 250, 100, '?'),
			makeCell('afib-4', 320, 100, '?'),
			makeCell('afib-5', 390, 100, '?'),
			makeCell('afib-6', 460, 100, '?'),
			makeCell('afib-7', 530, 100, '?'),
			makeCell('afib-8', 600, 100, '?'),
			makeCell('afib-9', 670, 100, '?'),
			makeCell('afib-10', 740, 100, '?'),
		],
		fibonacciCode,
		{
			5: 'loop-start',
			6: 'compute-value',
			10: 'read-result',
		},
		[6],
		['computations'],
	),
	makeAlgo(
		'algo-insertion-sort',
		'Insertion Sort',
		'Watch elements shift right to make room for the key element during Insertion Sort.',
		'Sorting',
		'beginner',
		['sorting', 'comparison', 'in-place', 'stable', 'adaptive', 'code-sync'],
		[
			makeCell('ais-0', 40, 100, '6'),
			makeCell('ais-1', 110, 100, '3'),
			makeCell('ais-2', 180, 100, '8'),
			makeCell('ais-3', 250, 100, '2'),
			makeCell('ais-4', 320, 100, '5'),
		],
		insertionSortCode,
		{
			5: 'outer-loop',
			6: 'pick-key',
			9: 'compare-shift',
			10: 'shift-right',
			14: 'insert-key',
		},
		[6, 10, 14],
		['comparisons', 'shifts'],
	),
];

export function getAlgorithmTemplateById(id: string): AlgorithmTemplate | undefined {
	return algorithmTemplates.find((t) => t.id === id);
}
