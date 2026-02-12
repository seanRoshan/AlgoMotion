'use client';

import { Sparkles } from 'lucide-react';
import { PropertiesInspector } from '@/components/panels/properties-inspector';
import { EmptyState } from '@/components/shared/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RightPanel() {
	return (
		<Tabs defaultValue="properties" className="flex h-full flex-col">
			<TabsList className="h-8 w-full justify-start rounded-none border-b bg-transparent px-2">
				<TabsTrigger value="properties" className="h-6 text-xs">
					Properties
				</TabsTrigger>
				<TabsTrigger value="animation" className="h-6 text-xs">
					Animation
				</TabsTrigger>
			</TabsList>
			<ScrollArea className="flex-1">
				<TabsContent value="properties" className="mt-0">
					<PropertiesInspector />
				</TabsContent>
				<TabsContent value="animation" className="mt-0">
					<EmptyState
						icon={Sparkles}
						title="No animation"
						description="Select an element to configure its animations"
					/>
				</TabsContent>
			</ScrollArea>
		</Tabs>
	);
}
