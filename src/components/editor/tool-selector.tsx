'use client';

import { ArrowRight, Circle, Hand, Minus, MousePointer2, Square, Type } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type ToolMode, useUIStore } from '@/lib/stores/ui-store';

const tools = [
	{ value: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
	{ value: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
	{ value: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
	{ value: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
	{ value: 'text', icon: Type, label: 'Text', shortcut: 'T' },
	{ value: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
	{ value: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
] as const;

const toolModeToValue: Record<ToolMode, string> = {
	select: 'select',
	pan: 'hand',
	'draw-rect': 'rect',
	'draw-ellipse': 'ellipse',
	'draw-text': 'text',
	'draw-arrow': 'arrow',
	'draw-line': 'line',
};

const valueToToolMode: Record<string, ToolMode> = {
	select: 'select',
	hand: 'pan',
	rect: 'draw-rect',
	ellipse: 'draw-ellipse',
	text: 'draw-text',
	arrow: 'draw-arrow',
	line: 'draw-line',
};

export function ToolSelector() {
	const tool = useUIStore((s) => s.tool);
	const setTool = useUIStore((s) => s.setTool);

	return (
		<ToggleGroup
			type="single"
			value={toolModeToValue[tool]}
			onValueChange={(val) => {
				if (val) setTool(valueToToolMode[val]);
			}}
			className="gap-0.5"
		>
			{tools.map((t) => (
				<Tooltip key={t.value}>
					<TooltipTrigger asChild>
						<ToggleGroupItem
							value={t.value}
							aria-label={t.label}
							className="h-8 w-8 data-[state=on]:bg-accent"
						>
							<t.icon className="h-4 w-4" />
						</ToggleGroupItem>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							{t.label}
							<span className="ml-2 text-muted-foreground">{t.shortcut}</span>
						</p>
					</TooltipContent>
				</Tooltip>
			))}
		</ToggleGroup>
	);
}
