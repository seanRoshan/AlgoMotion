'use client';

import { ArrowRight, Circle, Hand, Minus, MousePointer2, Square, Type } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const tools = [
	{ value: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
	{ value: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
	{ value: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
	{ value: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
	{ value: 'text', icon: Type, label: 'Text', shortcut: 'T' },
	{ value: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
	{ value: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
] as const;

export function ToolSelector() {
	return (
		<ToggleGroup type="single" defaultValue="select" className="gap-0.5">
			{tools.map((tool) => (
				<Tooltip key={tool.value}>
					<TooltipTrigger asChild>
						<ToggleGroupItem
							value={tool.value}
							aria-label={tool.label}
							className="h-8 w-8 data-[state=on]:bg-accent"
						>
							<tool.icon className="h-4 w-4" />
						</ToggleGroupItem>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							{tool.label}
							<span className="ml-2 text-muted-foreground">{tool.shortcut}</span>
						</p>
					</TooltipContent>
				</Tooltip>
			))}
		</ToggleGroup>
	);
}
