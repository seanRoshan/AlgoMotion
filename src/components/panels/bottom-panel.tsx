'use client';

import dynamic from 'next/dynamic';
import { CallStackPanel } from '@/components/debug/call-stack-panel';
import { VariableWatchPanel } from '@/components/debug/variable-watch-panel';
import { TimelinePanel } from '@/components/timeline/timeline-panel';
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

const LazyDslEditor = dynamic(
	() => import('@/components/dsl/dsl-editor').then((m) => ({ default: m.DslEditor })),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center bg-[#1a1a2e]">
				<p className="text-xs text-muted-foreground/40">Loading DSL editor...</p>
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
				<TabsTrigger value="variables" className="h-6 text-xs">
					Variables
				</TabsTrigger>
				<TabsTrigger value="callstack" className="h-6 text-xs">
					Call Stack
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
			<TabsContent value="variables" className="mt-0 h-full">
				<VariableWatchPanel />
			</TabsContent>
			<TabsContent value="callstack" className="mt-0 h-full">
				<CallStackPanel />
			</TabsContent>
			<TabsContent value="dsl" className="mt-0 h-full">
				<LazyDslEditor />
			</TabsContent>
		</Tabs>
	);
}
