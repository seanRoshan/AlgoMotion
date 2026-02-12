/**
 * Tests for the embed page module exports.
 */

import { describe, expect, it } from 'vitest';
import * as embedPage from './page';

describe('embed page', () => {
	it('exports generateMetadata function', () => {
		expect(typeof embedPage.generateMetadata).toBe('function');
	});

	it('exports default function', () => {
		expect(typeof embedPage.default).toBe('function');
	});
});
