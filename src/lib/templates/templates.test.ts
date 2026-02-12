import { describe, expect, it } from 'vitest';
import {
	filterTemplates,
	getTemplateById,
	getTemplatesByCategory,
	TEMPLATE_CATEGORIES,
	TEMPLATE_DIFFICULTIES,
	templates,
} from './templates';

describe('templates', () => {
	it('has at least 30 templates (12 starter + 19 Phase 5)', () => {
		expect(templates.length).toBeGreaterThanOrEqual(31);
	});

	it('all templates have required fields', () => {
		for (const t of templates) {
			expect(t.id).toBeTruthy();
			expect(t.name).toBeTruthy();
			expect(t.description).toBeTruthy();
			expect(t.category).toBeTruthy();
			expect(TEMPLATE_DIFFICULTIES).toContain(t.difficulty);
			expect(t.tags.length).toBeGreaterThan(0);
			expect(t.elements.length).toBeGreaterThan(0);
		}
	});

	it('all template IDs are unique', () => {
		const ids = templates.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('TEMPLATE_CATEGORIES', () => {
	it('has 9 categories including Phase 5 additions', () => {
		expect(TEMPLATE_CATEGORIES.length).toBe(9);
		expect(TEMPLATE_CATEGORIES).toContain('Dynamic Programming');
		expect(TEMPLATE_CATEGORIES).toContain('Architecture');
		expect(TEMPLATE_CATEGORIES).toContain('String');
		expect(TEMPLATE_CATEGORIES).toContain('Math');
	});

	it('every template category is in TEMPLATE_CATEGORIES or a known category', () => {
		const allCategories = [...TEMPLATE_CATEGORIES];
		for (const t of templates) {
			expect(allCategories).toContain(t.category);
		}
	});
});

describe('Phase 5 templates', () => {
	const PHASE_5_IDS = [
		'heap-sort',
		'radix-sort',
		'counting-sort',
		'dijkstra',
		'prims-mst',
		'kruskals-mst',
		'topological-sort',
		'avl-tree',
		'red-black-tree',
		'heap-extract-min',
		'knapsack',
		'lcs',
		'edit-distance',
		'pipeline-hazards',
		'cache-hit-miss',
		'virtual-memory',
		'kmp-pattern-matching',
		'rabin-karp',
		'sieve-eratosthenes',
	];

	it('includes all 19 Phase 5 template IDs', () => {
		const ids = templates.map((t) => t.id);
		for (const id of PHASE_5_IDS) {
			expect(ids).toContain(id);
		}
	});

	it('has Graph templates (Dijkstra, Prims, Kruskals, Topological)', () => {
		const graphTemplates = getTemplatesByCategory('Graph');
		expect(graphTemplates.length).toBeGreaterThanOrEqual(6);
	});

	it('has Dynamic Programming templates', () => {
		const dpTemplates = getTemplatesByCategory('Dynamic Programming');
		expect(dpTemplates.length).toBe(3);
	});

	it('has Architecture templates', () => {
		const archTemplates = getTemplatesByCategory('Architecture');
		expect(archTemplates.length).toBe(3);
	});

	it('has String templates', () => {
		const stringTemplates = getTemplatesByCategory('String');
		expect(stringTemplates.length).toBe(2);
	});

	it('has Math templates', () => {
		const mathTemplates = getTemplatesByCategory('Math');
		expect(mathTemplates.length).toBe(1);
	});
});

describe('getTemplateById', () => {
	it('returns the template with the given ID', () => {
		const t = getTemplateById('bubble-sort');
		expect(t).toBeDefined();
		expect(t?.name).toContain('Bubble Sort');
	});

	it('returns undefined for unknown ID', () => {
		expect(getTemplateById('nonexistent')).toBeUndefined();
	});
});

describe('getTemplatesByCategory', () => {
	it('returns templates in the given category', () => {
		const sorting = getTemplatesByCategory('Sorting');
		expect(sorting.length).toBeGreaterThan(0);
		for (const t of sorting) {
			expect(t.category).toBe('Sorting');
		}
	});

	it('returns empty array for unknown category', () => {
		expect(getTemplatesByCategory('NoSuchCategory')).toEqual([]);
	});
});

describe('filterTemplates', () => {
	it('filters by search query (name)', () => {
		const results = filterTemplates({ query: 'bubble' });
		expect(results.length).toBeGreaterThan(0);
		expect(results[0]?.name.toLowerCase()).toContain('bubble');
	});

	it('filters by category', () => {
		const results = filterTemplates({ category: 'Searching' });
		for (const t of results) {
			expect(t.category).toBe('Searching');
		}
	});

	it('filters by difficulty', () => {
		const results = filterTemplates({ difficulty: 'beginner' });
		for (const t of results) {
			expect(t.difficulty).toBe('beginner');
		}
	});

	it('combines filters', () => {
		const results = filterTemplates({ category: 'Sorting', difficulty: 'beginner' });
		for (const t of results) {
			expect(t.category).toBe('Sorting');
			expect(t.difficulty).toBe('beginner');
		}
	});

	it('returns all templates with empty filter', () => {
		const results = filterTemplates({});
		expect(results.length).toBe(templates.length);
	});
});
