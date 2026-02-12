/**
 * Coach-mark spotlight overlay for onboarding tutorial.
 *
 * Renders a floating card with step info, navigation buttons,
 * and progress dots. Positioned relative to the target element.
 *
 * Spec reference: Section 16.3 (Onboarding Flow)
 */

'use client';

interface SpotlightOverlayProps {
	title: string;
	description: string;
	currentStep: number;
	totalSteps: number;
	placement: 'top' | 'bottom' | 'left' | 'right';
	onNext: () => void;
	onPrev: () => void;
	onSkip: () => void;
}

export function SpotlightOverlay({
	title,
	description,
	currentStep,
	totalSteps,
	onNext,
	onPrev,
	onSkip,
}: SpotlightOverlayProps) {
	const isFirst = currentStep === 0;
	const isLast = currentStep === totalSteps - 1;

	return (
		<div className="fixed inset-0 z-50 pointer-events-none">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/40 pointer-events-auto" />

			{/* Card */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto w-80 rounded-lg border border-border bg-background p-5 shadow-xl">
				{/* Step indicator */}
				<div className="text-xs text-muted-foreground mb-2">
					{currentStep + 1} of {totalSteps}
				</div>

				{/* Title */}
				<h3 className="text-base font-semibold mb-1">{title}</h3>

				{/* Description */}
				<p className="text-sm text-muted-foreground mb-4">{description}</p>

				{/* Progress dots */}
				<div className="flex gap-1.5 mb-4">
					{Array.from({ length: totalSteps }, (_, i) => (
						<span
							key={`step-${i.toString()}`}
							data-testid="step-dot"
							className={`h-1.5 w-1.5 rounded-full ${
								i === currentStep ? 'bg-indigo-500' : 'bg-muted'
							}`}
						/>
					))}
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={onSkip}
						aria-label="Skip tutorial"
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						Skip
					</button>

					<div className="flex gap-2">
						{!isFirst && (
							<button
								type="button"
								onClick={onPrev}
								aria-label="Back"
								className="rounded px-3 py-1 text-xs border border-border hover:bg-accent"
							>
								Back
							</button>
						)}
						<button
							type="button"
							onClick={onNext}
							aria-label={isLast ? 'Finish' : 'Next'}
							className="rounded px-3 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
						>
							{isLast ? 'Finish' : 'Next'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
