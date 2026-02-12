'use client';

import { ClipboardCopy, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useExecutionStore } from '@/lib/stores/execution-store';

/**
 * Console output panel displaying execution output.
 * Shows console.log/print output from the execution engine,
 * with auto-scroll, clear, and copy functionality.
 */
export function ConsolePanel() {
	const output = useExecutionStore((s) => s.executionState.output);
	const clearOutput = useExecutionStore((s) => s.clearOutput);
	const scrollRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is a stable ref
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [output]);

	function handleCopy() {
		if (output.length > 0) {
			navigator.clipboard.writeText(output.join('\n'));
		}
	}

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center justify-between border-b px-2 py-1">
				<span className="text-xs text-muted-foreground">
					{output.length > 0 ? `${output.length} lines` : 'Console'}
				</span>
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon-xs" onClick={handleCopy} aria-label="Copy output">
								<ClipboardCopy className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Copy to clipboard</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={clearOutput}
								aria-label="Clear console"
							>
								<Trash2 className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Clear console</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Output area */}
			<div
				ref={scrollRef}
				className="flex-1 overflow-y-auto p-2 font-mono text-xs"
				role="log"
				aria-label="Console output"
			>
				{output.length === 0 ? (
					<p className="text-muted-foreground/40">No output yet. Run code to see results.</p>
				) : (
					output.map((line, i) => (
						<div key={`${i}-${line.slice(0, 20)}`} className="py-0.5 text-foreground/80">
							{line}
						</div>
					))
				)}
			</div>
		</div>
	);
}
