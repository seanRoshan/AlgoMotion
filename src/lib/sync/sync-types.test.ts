/**
 * Tests for sync types and constants.
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_SYNC_CONFIG } from './sync-types';

describe('DEFAULT_SYNC_CONFIG', () => {
	it('has debounceMs of 2000', () => {
		expect(DEFAULT_SYNC_CONFIG.debounceMs).toBe(2000);
	});

	it('has maxRetries of 3', () => {
		expect(DEFAULT_SYNC_CONFIG.maxRetries).toBe(3);
	});

	it('has quotaWarningThreshold of 0.8', () => {
		expect(DEFAULT_SYNC_CONFIG.quotaWarningThreshold).toBe(0.8);
	});

	it('has historyRetentionDays of 7', () => {
		expect(DEFAULT_SYNC_CONFIG.historyRetentionDays).toBe(7);
	});
});
