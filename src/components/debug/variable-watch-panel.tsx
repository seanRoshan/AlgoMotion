'use client';

import { ArrowUpDown, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useExecutionStore } from '@/lib/stores/execution-store';
import type { VariableSnapshot } from '@/types';

type SortMode = 'name' | 'changed';

function formatValue(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return `"${value}"`;
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return `[${value.join(', ')}]`;
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function getValueColorClass(type: string): string {
	switch (type) {
		case 'number':
			return 'text-blue-400';
		case 'string':
			return 'text-green-400';
		case 'boolean':
			return 'text-amber-400';
		default:
			return 'text-foreground';
	}
}

function VariableRow({ variable }: { variable: VariableSnapshot }) {
	return (
		<tr
			className={`border-b border-border/30 text-xs ${variable.changed ? 'changed bg-amber-500/10' : ''}`}
		>
			<td className="px-2 py-1 font-mono font-medium">{variable.name}</td>
			<td className={`px-2 py-1 font-mono ${getValueColorClass(variable.type)}`}>
				{formatValue(variable.value)}
			</td>
			<td className="px-2 py-1 text-muted-foreground">{variable.type}</td>
			<td className="px-2 py-1 font-mono text-muted-foreground/60">
				{variable.changed ? formatValue(variable.previousValue) : ''}
			</td>
		</tr>
	);
}

export function VariableWatchPanel() {
	const variables = useExecutionStore((s) => s.executionState.variables);
	const [sortMode, setSortMode] = useState<SortMode>('name');

	const varList = useMemo(() => {
		const entries = Object.values(variables);
		if (sortMode === 'changed') {
			return entries.sort((a, b) => {
				if (a.changed && !b.changed) return -1;
				if (!a.changed && b.changed) return 1;
				return a.name.localeCompare(b.name);
			});
		}
		return entries.sort((a, b) => a.name.localeCompare(b.name));
	}, [variables, sortMode]);

	if (varList.length === 0) {
		return (
			<EmptyState
				icon={Eye}
				title="No variables"
				description="Variables will appear here during code execution"
			/>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center justify-between border-b px-2 py-1">
				<span className="text-xs font-medium text-muted-foreground">
					{varList.length} variable{varList.length !== 1 ? 's' : ''}
				</span>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => setSortMode(sortMode === 'name' ? 'changed' : 'name')}
							aria-label="Toggle sort order"
						>
							<ArrowUpDown className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{sortMode === 'name' ? 'Sort by last changed' : 'Sort by name'}
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Variable table */}
			<div role="log" aria-live="polite" className="flex-1 overflow-y-auto">
				<table className="w-full">
					<thead>
						<tr>
							<th className="px-2 py-1 text-left text-[10px] font-medium text-muted-foreground">
								Name
							</th>
							<th className="px-2 py-1 text-left text-[10px] font-medium text-muted-foreground">
								Value
							</th>
							<th className="px-2 py-1 text-left text-[10px] font-medium text-muted-foreground">
								Type
							</th>
							<th className="px-2 py-1 text-left text-[10px] font-medium text-muted-foreground">
								Prev
							</th>
						</tr>
					</thead>
					<tbody>
						{varList.map((v) => (
							<VariableRow key={v.name} variable={v} />
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
