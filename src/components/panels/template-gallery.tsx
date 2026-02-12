'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSceneStore } from '@/lib/stores/scene-store';
import { filterTemplates, TEMPLATE_CATEGORIES, type Template } from '@/lib/templates/templates';

function TemplateCard({
	template,
	onLoad,
}: {
	template: Template;
	onLoad: (template: Template) => void;
}) {
	return (
		<article className="cursor-pointer rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-accent">
			<button type="button" className="w-full text-left" onClick={() => onLoad(template)}>
				<div className="mb-1 flex items-center justify-between gap-2">
					<h4 className="text-xs font-medium">{template.name}</h4>
					<Badge variant="outline" className="text-[10px]">
						{template.difficulty}
					</Badge>
				</div>
				<p className="text-[11px] leading-snug text-muted-foreground">{template.description}</p>
			</button>
		</article>
	);
}

export function TemplateGallery() {
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('All');
	const addElement = useSceneStore((s) => s.addElement);
	const deselectAll = useSceneStore((s) => s.deselectAll);
	const reset = useSceneStore((s) => s.reset);

	const filtered = useMemo(() => {
		return filterTemplates({
			query: search || undefined,
			category: activeCategory === 'All' ? undefined : activeCategory,
		});
	}, [search, activeCategory]);

	function handleLoad(template: Template) {
		reset();
		deselectAll();
		for (const element of template.elements) {
			addElement(element);
		}
	}

	return (
		<div className="flex h-full flex-col">
			{/* Search */}
			<div className="border-b p-2">
				<div className="relative">
					<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search templates..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-7 pl-8 text-xs"
					/>
				</div>
			</div>

			{/* Category Tabs */}
			<div className="border-b px-2 py-1">
				<Tabs value={activeCategory} onValueChange={setActiveCategory}>
					<TabsList className="h-7 bg-transparent">
						<TabsTrigger value="All" className="h-5 text-[10px]">
							All
						</TabsTrigger>
						{TEMPLATE_CATEGORIES.map((cat) => (
							<TabsTrigger key={cat} value={cat} className="h-5 text-[10px]">
								{cat}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			{/* Template Grid */}
			<div className="flex-1 overflow-y-auto p-2">
				{filtered.length > 0 ? (
					<div className="space-y-2">
						{filtered.map((template) => (
							<TemplateCard key={template.id} template={template} onLoad={handleLoad} />
						))}
					</div>
				) : (
					<div className="flex items-center justify-center p-8">
						<p className="text-xs text-muted-foreground">No templates found</p>
					</div>
				)}
			</div>
		</div>
	);
}
