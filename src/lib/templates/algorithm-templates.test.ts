import { describe, expect, it } from 'vitest';
import {
	type AlgorithmTemplate,
	algorithmTemplates,
	getAlgorithmTemplateById,
} from './algorithm-templates';

describe('algorithmTemplates', () => {
	it('contains exactly 5 algorithm templates', () => {
		expect(algorithmTemplates).toHaveLength(5);
	});

	it('has unique IDs across all templates', () => {
		const ids = algorithmTemplates.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('each template has required code sync fields', () => {
		for (const template of algorithmTemplates) {
			expect(template.sourceCode).toBeTruthy();
			expect(template.language).toBe('javascript');
			expect(template.lineMapping).toBeDefined();
			expect(Object.keys(template.lineMapping).length).toBeGreaterThan(0);
			expect(template.defaultBreakpoints.length).toBeGreaterThan(0);
			expect(template.metrics.length).toBeGreaterThan(0);
		}
	});

	it('each template has base template fields', () => {
		for (const template of algorithmTemplates) {
			expect(template.name).toBeTruthy();
			expect(template.description).toBeTruthy();
			expect(template.category).toBeTruthy();
			expect(template.difficulty).toBeTruthy();
			expect(template.tags.length).toBeGreaterThan(0);
			expect(template.elements.length).toBeGreaterThan(0);
		}
	});

	it('includes Bubble Sort template', () => {
		const t = getAlgorithmTemplateById('algo-bubble-sort');
		expect(t).toBeDefined();
		expect(t?.name).toBe('Bubble Sort');
		expect(t?.metrics).toContain('comparisons');
		expect(t?.metrics).toContain('swaps');
	});

	it('includes Binary Search template', () => {
		const t = getAlgorithmTemplateById('algo-binary-search');
		expect(t).toBeDefined();
		expect(t?.name).toBe('Binary Search');
		expect(t?.metrics).toContain('comparisons');
	});

	it('includes DFS Traversal template', () => {
		const t = getAlgorithmTemplateById('algo-dfs-traversal');
		expect(t).toBeDefined();
		expect(t?.name).toBe('DFS Graph Traversal');
		expect(t?.metrics).toContain('nodesVisited');
	});

	it('includes Fibonacci DP template', () => {
		const t = getAlgorithmTemplateById('algo-fibonacci-dp');
		expect(t).toBeDefined();
		expect(t?.name).toBe('Fibonacci (DP)');
		expect(t?.metrics).toContain('computations');
	});

	it('includes Insertion Sort template', () => {
		const t = getAlgorithmTemplateById('algo-insertion-sort');
		expect(t).toBeDefined();
		expect(t?.name).toBe('Insertion Sort');
		expect(t?.metrics).toContain('comparisons');
		expect(t?.metrics).toContain('shifts');
	});

	it('source code is non-empty multi-line JavaScript', () => {
		for (const template of algorithmTemplates) {
			const lines = template.sourceCode.split('\n');
			expect(lines.length).toBeGreaterThan(3);
		}
	});

	it('defaultBreakpoints reference valid line numbers within sourceCode', () => {
		for (const template of algorithmTemplates) {
			const lineCount = template.sourceCode.split('\n').length;
			for (const bp of template.defaultBreakpoints) {
				expect(bp).toBeGreaterThan(0);
				expect(bp).toBeLessThanOrEqual(lineCount);
			}
		}
	});

	it('lineMapping keys reference valid line numbers within sourceCode', () => {
		for (const template of algorithmTemplates) {
			const lineCount = template.sourceCode.split('\n').length;
			for (const lineStr of Object.keys(template.lineMapping)) {
				const line = Number(lineStr);
				expect(line).toBeGreaterThan(0);
				expect(line).toBeLessThanOrEqual(lineCount);
			}
		}
	});

	it('getAlgorithmTemplateById returns undefined for unknown ID', () => {
		expect(getAlgorithmTemplateById('nonexistent')).toBeUndefined();
	});

	it('satisfies AlgorithmTemplate interface for type safety', () => {
		const template: AlgorithmTemplate = algorithmTemplates[0] as AlgorithmTemplate;
		expect(template.sourceCode).toBeDefined();
		expect(template.lineMapping).toBeDefined();
	});
});
