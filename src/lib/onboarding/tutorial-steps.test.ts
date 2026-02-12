/**
 * Tests for tutorial step definitions.
 */

import { describe, expect, it } from 'vitest';
import { ONBOARDING_STORAGE_KEY, TOTAL_STEPS, TUTORIAL_STEPS } from './tutorial-steps';

describe('TUTORIAL_STEPS', () => {
	it('has 5 steps', () => {
		expect(TUTORIAL_STEPS).toHaveLength(5);
	});

	it('each step has required fields', () => {
		for (const step of TUTORIAL_STEPS) {
			expect(step.id).toBeTruthy();
			expect(step.title).toBeTruthy();
			expect(step.description).toBeTruthy();
			expect(step.targetSelector).toBeTruthy();
			expect(['top', 'bottom', 'left', 'right']).toContain(step.placement);
		}
	});

	it('steps have unique IDs', () => {
		const ids = TUTORIAL_STEPS.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('first step is add-element', () => {
		expect(TUTORIAL_STEPS[0]?.id).toBe('add-element');
	});

	it('last step is export', () => {
		expect(TUTORIAL_STEPS[4]?.id).toBe('export');
	});

	it('TOTAL_STEPS matches array length', () => {
		expect(TOTAL_STEPS).toBe(TUTORIAL_STEPS.length);
	});

	it('ONBOARDING_STORAGE_KEY is defined', () => {
		expect(ONBOARDING_STORAGE_KEY).toBe('algomotion-onboarding-completed');
	});
});
