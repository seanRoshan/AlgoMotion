'use client';

import { Code, FileCode2, SlidersHorizontal, Terminal } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
			<ScrollArea className="flex-1">
				<TabsContent value="timeline" className="mt-0">
					<EmptyState
						icon={SlidersHorizontal}
						title="Timeline"
						description="Animation timeline with keyframes and scrubber"
					/>
				</TabsContent>
				<TabsContent value="code" className="mt-0">
					<EmptyState
						icon={Code}
						title="Code Editor"
						description="Write and step through algorithm code"
					/>
				</TabsContent>
				<TabsContent value="console" className="mt-0">
					<EmptyState
						icon={Terminal}
						title="Console"
						description="Code execution output will appear here"
					/>
				</TabsContent>
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
