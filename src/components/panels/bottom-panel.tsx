'use client';

import { FileCode2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { EmptyState } from '@/components/shared/empty-state';
import { TimelinePanel } from '@/components/timeline/timeline-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LazyCodeEditor = dynamic(
	() => import('@/components/code-editor/code-editor').then((m) => ({ default: m.CodeEditor })),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center bg-[#1a1a2e]">
				<p className="text-xs text-muted-foreground/40">Loading editor...</p>
			</div>
		),
	},
);

const LazyConsolePanel = dynamic(
	() => import('@/components/console/console-panel').then((m) => ({ default: m.ConsolePanel })),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center">
				<p className="text-xs text-muted-foreground/40">Loading console...</p>
			</div>
		),
	},
);

export function BottomPanel() {
	return (
		<Tabs defaultValue="timeline" className="flex h-full flex-col">
			<TabsList className="h-8 w-full justify-start rounded-none border-b bg-transparent px-2">
				<TabsTrigger value="timeline" className="h-6 text-xs">
					Timeline
				</TabsTrigger>
				<TabsTrigger value="code" className="h-6 text-xs">
					Code
				</TabsTrigger>
				<TabsTrigger value="console" className="h-6 text-xs">
					Console
				</TabsTrigger>
				<TabsTrigger value="dsl" className="h-6 text-xs">
					DSL
				</TabsTrigger>
			</TabsList>
			<TabsContent value="timeline" className="mt-0 h-full">
				<TimelinePanel />
			</TabsContent>
			<TabsContent value="code" className="mt-0 h-full">
				<LazyCodeEditor />
			</TabsContent>
			<TabsContent value="console" className="mt-0 h-full">
				<LazyConsolePanel />
			</TabsContent>
			<ScrollArea className="flex-1">
				<TabsContent value="dsl" className="mt-0">
					<EmptyState
						icon={FileCode2}
						title="DSL Editor"
						description="Write animation scripts using the AlgoMotion DSL"
					/>
				</TabsContent>
			</ScrollArea>
		</Tabs>
	);
}
