'use client';

import { Layers } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ElementLibrary } from './element-library';
import { TemplateGallery } from './template-gallery';

export function LeftPanel() {
	return (
		<Tabs defaultValue="elements" className="flex h-full flex-col">
			<TabsList className="h-8 w-full justify-start rounded-none border-b bg-transparent px-2">
				<TabsTrigger value="elements" className="h-6 text-xs">
					Elements
				</TabsTrigger>
				<TabsTrigger value="templates" className="h-6 text-xs">
					Templates
				</TabsTrigger>
				<TabsTrigger value="layers" className="h-6 text-xs">
					Layers
				</TabsTrigger>
			</TabsList>
			<ScrollArea className="flex-1">
				<TabsContent value="elements" className="mt-0 h-full">
					<ElementLibrary />
				</TabsContent>
				<TabsContent value="templates" className="mt-0">
					<TemplateGallery />
				</TabsContent>
				<TabsContent value="layers" className="mt-0">
					<EmptyState
						icon={Layers}
						title="No layers"
						description="Elements will appear here as you add them"
					/>
				</TabsContent>
			</ScrollArea>
		</Tabs>
	);
}
