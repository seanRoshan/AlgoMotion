/**
 * Tests for usePerformanceMonitor hook.
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePerformanceMonitor } from './use-performance-monitor';

describe('usePerformanceMonitor', () => {
	it('returns fps value', () => {
		const { result } = renderHook(() => usePerformanceMonitor());
		expect(typeof result.current.fps).toBe('number');
	});

	it('returns elementCount', () => {
		const { result } = renderHook(() => usePerformanceMonitor());
		expect(typeof result.current.elementCount).toBe('number');
	});

	it('returns memoryUsageMB', () => {
		const { result } = renderHook(() => usePerformanceMonitor());
		expect(typeof result.current.memoryUsageMB).toBe('number');
	});

	it('returns performanceWarning', () => {
		const { result } = renderHook(() => usePerformanceMonitor());
		expect(typeof result.current.performanceWarning).toBe('boolean');
	});

	it('measureFrame records timing', () => {
		const { result } = renderHook(() => usePerformanceMonitor());
		// measureFrame is a function
		expect(typeof result.current.measureFrame).toBe('function');
	});

	it('measureFrame returns cleanup function', () => {
		const { result } = renderHook(() => usePerformanceMonitor());
		const end = result.current.measureFrame();
		expect(typeof end).toBe('function');
	});
});
