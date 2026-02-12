'use client';

import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSceneStore } from '@/lib/stores/scene-store';
import { cn } from '@/lib/utils';

function formatElementType(type: string): string {
	// Convert camelCase to Title Case (e.g., 'arrayCell' → 'Array Cell')
	return type
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (c) => c.toUpperCase())
		.trim();
}

export function LayersPanel() {
	const elementIds = useSceneStore((s) => s.elementIds);
	const elements = useSceneStore((s) => s.elements);
	const selectedIds = useSceneStore((s) => s.selectedIds);
	const selectElement = useSceneStore((s) => s.selectElement);
	const updateElement = useSceneStore((s) => s.updateElement);

	if (elementIds.length === 0) {
		return (
			<div className="flex h-32 items-center justify-center text-center text-xs text-muted-foreground">
				No layers — Elements will appear here as you add them
			</div>
		);
	}

	// Display in reverse order (top layers first, matching visual stacking)
	const reversedIds = [...elementIds].reverse();

	return (
		<div className="flex flex-col" role="listbox" aria-label="Layers">
			{reversedIds.map((id) => {
				const element = elements[id];
				if (!element) return null;

				const isSelected = selectedIds.includes(id);
				const displayName = element.label || formatElementType(element.type);

				return (
					<div
						key={id}
						role="option"
						aria-selected={isSelected}
						className={cn(
							'flex items-center gap-1 border-b px-2 py-1 text-xs cursor-pointer hover:bg-accent/50',
							isSelected && 'bg-accent',
						)}
						onClick={() => selectElement(id)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectElement(id);
							}
						}}
						tabIndex={0}
					>
						<span className="flex-1 truncate">{displayName}</span>

						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							aria-label={element.visible ? 'Hide layer' : 'Show layer'}
							onClick={(e) => {
								e.stopPropagation();
								updateElement(id, { visible: !element.visible });
							}}
						>
							{element.visible ? (
								<Eye className="h-3 w-3" />
							) : (
								<EyeOff className="h-3 w-3 text-muted-foreground" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							aria-label={element.locked ? 'Unlock layer' : 'Lock layer'}
							onClick={(e) => {
								e.stopPropagation();
								updateElement(id, { locked: !element.locked });
							}}
						>
							{element.locked ? (
								<Lock className="h-3 w-3 text-muted-foreground" />
							) : (
								<Unlock className="h-3 w-3" />
							)}
						</Button>
					</div>
				);
			})}
		</div>
	);
}
