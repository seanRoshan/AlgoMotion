'use client';

import { ChevronRight, Layers } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { useExecutionStore } from '@/lib/stores/execution-store';
import type { JsonValue, StackFrame } from '@/types';

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

function FrameVariables({ variables }: { variables: Record<string, JsonValue> }) {
	const entries = Object.entries(variables);
	if (entries.length === 0) {
		return <p className="px-6 py-1 text-[10px] text-muted-foreground/60">No local variables</p>;
	}
	return (
		<div className="border-t border-border/20 bg-muted/30 px-6 py-1">
			{entries.map(([name, value]) => (
				<div key={name} className="flex items-center gap-2 py-0.5 font-mono text-[10px]">
					<span className="text-foreground/80">{name}</span>
					<span className="text-muted-foreground">=</span>
					<span className="text-blue-400">{formatValue(value)}</span>
				</div>
			))}
		</div>
	);
}

function StackFrameItem({
	frame,
	isCurrent,
	onNavigate,
}: {
	frame: StackFrame;
	isCurrent: boolean;
	onNavigate: (line: number) => void;
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<li className={`border-b border-border/30 ${isCurrent ? 'current bg-blue-500/10' : ''}`}>
			<div className="flex items-center">
				<button
					type="button"
					className="flex items-center px-1 py-1 text-muted-foreground/60 hover:text-foreground"
					onClick={() => setExpanded(!expanded)}
					aria-label={expanded ? 'Collapse frame' : 'Expand frame'}
				>
					<ChevronRight className={`size-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
				</button>
				<button
					type="button"
					className="flex flex-1 items-center gap-2 py-1 pr-2 text-left text-xs hover:bg-muted/50"
					onClick={() => onNavigate(frame.lineNumber)}
				>
					{isCurrent && <span className="size-1.5 rounded-full bg-blue-400" />}
					<span className="font-mono font-medium">{frame.functionName}</span>
					<span className="text-muted-foreground/60">Line {frame.lineNumber}</span>
				</button>
			</div>
			{expanded && <FrameVariables variables={frame.localVariables} />}
		</li>
	);
}

export function CallStackPanel() {
	const callStack = useExecutionStore((s) => s.executionState.callStack);
	const setCurrentLine = useExecutionStore((s) => s.setCurrentLine);

	// Reverse so most recent frame is on top
	const frames = [...callStack].reverse();

	if (frames.length === 0) {
		return (
			<EmptyState
				icon={Layers}
				title="No call stack"
				description="The call stack will appear here during code execution"
			/>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center justify-between border-b px-2 py-1">
				<span className="text-xs font-medium text-muted-foreground">
					{frames.length} frame{frames.length !== 1 ? 's' : ''}
				</span>
			</div>

			{/* Stack frames list */}
			<ul aria-live="polite" className="flex-1 overflow-y-auto">
				{frames.map((frame, i) => (
					<StackFrameItem
						key={`${frame.functionName}-${frame.lineNumber}-${i}`}
						frame={frame}
						isCurrent={i === 0}
						onNavigate={setCurrentLine}
					/>
				))}
			</ul>
		</div>
	);
}
