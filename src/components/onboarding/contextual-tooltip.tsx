/**
 * Contextual tooltip for unfamiliar UI elements.
 *
 * Shows a tip bubble on hover after a short delay.
 * Uses CSS-only hover with a delay for performance.
 *
 * Spec reference: Section 16.3 (Onboarding)
 */

'use client';

import type { ReactNode } from 'react';

interface ContextualTooltipProps {
	tip: string;
	children: ReactNode;
	id?: string;
}

export function ContextualTooltip({ tip, children, id }: ContextualTooltipProps) {
	const tooltipId = id ?? `tip-${tip.slice(0, 10).replace(/\s/g, '-')}`;

	return (
		<span className="group relative inline-block">
			{children}
			<span
				id={tooltipId}
				role="tooltip"
				className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-500 z-50 whitespace-nowrap rounded bg-popover border border-border px-2 py-1 text-xs text-popover-foreground shadow-md"
			>
				{tip}
			</span>
		</span>
	);
}
