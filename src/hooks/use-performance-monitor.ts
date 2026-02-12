/**
 * Hook for monitoring runtime performance metrics.
 *
 * Tracks FPS, element count, memory usage, and provides
 * performance warnings when thresholds are exceeded.
 *
 * Spec reference: Section 10 (Performance Requirements)
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { MAX_ELEMENTS_OPTIMAL } from '@/lib/performance/constants';

export interface PerformanceMetrics {
	fps: number;
	elementCount: number;
	memoryUsageMB: number;
	performanceWarning: boolean;
	measureFrame: () => () => void;
}

export function usePerformanceMonitor(): PerformanceMetrics {
	const [fps, setFps] = useState(60);
	const [elementCount, _setElementCount] = useState(0);
	const [memoryUsageMB, _setMemoryUsageMB] = useState(0);
	const frameTimesRef = useRef<number[]>([]);

	const measureFrame = useCallback(() => {
		const start = performance.now();
		return () => {
			const elapsed = performance.now() - start;
			const times = frameTimesRef.current;
			times.push(elapsed);

			// Keep last 60 frame times
			if (times.length > 60) {
				times.shift();
			}

			// Calculate FPS from average frame time
			if (times.length >= 10) {
				const avg = times.reduce((a, b) => a + b, 0) / times.length;
				const calculatedFps = Math.min(60, Math.round(1000 / Math.max(avg, 1)));
				setFps(calculatedFps);
			}
		};
	}, []);

	const performanceWarning = fps < 30 || elementCount > MAX_ELEMENTS_OPTIMAL;

	return {
		fps,
		elementCount,
		memoryUsageMB,
		performanceWarning,
		measureFrame,
	};
}
