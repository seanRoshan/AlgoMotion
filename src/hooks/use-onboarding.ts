/**
 * Hook for managing the onboarding tutorial flow.
 *
 * Tracks current step, handles step progression,
 * and persists completion state in localStorage.
 *
 * Spec reference: Section 16.3 (Onboarding Flow)
 */

'use client';

import { useCallback, useState } from 'react';
import type { TutorialStep } from '@/lib/onboarding/tutorial-steps';
import {
	ONBOARDING_STORAGE_KEY,
	TOTAL_STEPS,
	TUTORIAL_STEPS,
} from '@/lib/onboarding/tutorial-steps';

export interface UseOnboardingResult {
	isActive: boolean;
	currentStep: number;
	totalSteps: number;
	step: TutorialStep | null;
	nextStep: () => void;
	prevStep: () => void;
	skip: () => void;
	reset: () => void;
}

function isCompleted(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

function markCompleted(): void {
	localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

function clearCompleted(): void {
	localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

export function useOnboarding(): UseOnboardingResult {
	const [isActive, setIsActive] = useState(() => !isCompleted());
	const [currentStep, setCurrentStep] = useState(0);

	const step = isActive ? (TUTORIAL_STEPS[currentStep] ?? null) : null;

	const complete = useCallback(() => {
		setIsActive(false);
		markCompleted();
	}, []);

	const nextStep = useCallback(() => {
		setCurrentStep((prev) => {
			const next = prev + 1;
			if (next >= TOTAL_STEPS) {
				complete();
				return prev;
			}
			return next;
		});
	}, [complete]);

	const prevStep = useCallback(() => {
		setCurrentStep((prev) => Math.max(0, prev - 1));
	}, []);

	const skip = useCallback(() => {
		complete();
	}, [complete]);

	const reset = useCallback(() => {
		clearCompleted();
		setIsActive(true);
		setCurrentStep(0);
	}, []);

	return {
		isActive,
		currentStep,
		totalSteps: TOTAL_STEPS,
		step,
		nextStep,
		prevStep,
		skip,
		reset,
	};
}
