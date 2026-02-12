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
	it('has at least 10 starter templates', () => {
		expect(templates.length).toBeGreaterThanOrEqual(10);
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
	it('has at least 5 categories', () => {
		expect(TEMPLATE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
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
