/**
 * Tutorial step definitions for the onboarding flow.
 *
 * Each step defines what to highlight and what to tell the user.
 * Steps follow a guided bubble sort animation creation flow.
 *
 * Spec reference: Section 16.3 (Onboarding Flow)
 */

export interface TutorialStep {
	id: string;
	title: string;
	description: string;
	targetSelector: string;
	placement: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: 'add-element',
		title: 'Add an Array Element',
		description: 'Click the Array tool in the toolbar to add an array element to the canvas.',
		targetSelector: '[data-onboarding="add-element"]',
		placement: 'right',
	},
	{
		id: 'set-values',
		title: 'Set Array Values',
		description: 'Click on the array to select it, then enter values in the properties panel.',
		targetSelector: '[data-onboarding="properties-panel"]',
		placement: 'left',
	},
	{
		id: 'play-animation',
		title: 'Play the Animation',
		description: 'Press the Play button to watch the sorting algorithm animate.',
		targetSelector: '[data-onboarding="play-button"]',
		placement: 'top',
	},
	{
		id: 'step-code',
		title: 'Step Through Code',
		description:
			'Use the step controls to advance one line at a time and watch the visualization update.',
		targetSelector: '[data-onboarding="step-controls"]',
		placement: 'top',
	},
	{
		id: 'export',
		title: 'Export Your Animation',
		description: "Export as video, GIF, or share with a public link. You're ready to create!",
		targetSelector: '[data-onboarding="export-button"]',
		placement: 'bottom',
	},
];

export const ONBOARDING_STORAGE_KEY = 'algomotion-onboarding-completed';
export const TOTAL_STEPS = TUTORIAL_STEPS.length;
