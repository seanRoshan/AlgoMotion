'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createElement } from '@/lib/element-library/create-element';
import {
	ELEMENT_CATALOG,
	type LibraryCategory,
	type LibraryItem,
} from '@/lib/element-library/element-catalog';
import { useSceneStore } from '@/lib/stores/scene-store';

const DRAG_MIME_TYPE = 'application/algomotion-element';

function ElementCard({ item }: { item: LibraryItem }) {
	const Icon = item.icon;
	const addElement = useSceneStore((s) => s.addElement);
	const camera = useSceneStore((s) => s.camera);

	function handleDragStart(e: React.DragEvent) {
		e.dataTransfer.setData(DRAG_MIME_TYPE, item.type);
		e.dataTransfer.effectAllowed = 'copy';
	}

	function handleClick() {
		// Add element at canvas center (viewport center in canvas coords)
		const centerX = -camera.x + 400 / camera.zoom;
		const centerY = -camera.y + 300 / camera.zoom;
		const element = createElement(item.type, centerX, centerY);
		addElement(element);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: draggable cards need div, not button — button interferes with drag behavior
		<div
			role="button"
			tabIndex={0}
			draggable
			onDragStart={handleDragStart}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className="flex cursor-grab flex-col items-center gap-1.5 rounded-md border border-transparent p-2 text-center transition-colors hover:border-border hover:bg-accent active:cursor-grabbing"
		>
			<Icon className="h-6 w-6 text-muted-foreground" />
			<span className="text-[10px] leading-tight text-muted-foreground">{item.label}</span>
		</div>
	);
}

function CategorySection({ category }: { category: LibraryCategory }) {
	if (!category.enabled) {
		return (
			<div className="flex items-center justify-between px-3 py-2">
				<span className="text-xs font-medium text-muted-foreground/60">{category.label}</span>
				{category.disabledReason && (
					<Badge variant="outline" className="text-[10px] text-muted-foreground/60">
						{category.disabledReason}
					</Badge>
				)}
			</div>
		);
	}

	return (
		<AccordionItem value={category.id}>
			<AccordionTrigger className="px-3 py-2 text-xs">
				<span className="flex items-center gap-2">
					{category.label}
					<Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
						{category.items.length}
					</Badge>
				</span>
			</AccordionTrigger>
			<AccordionContent className="px-2 pb-2">
				<div className="grid grid-cols-3 gap-1">
					{category.items.map((item) => (
						<ElementCard key={item.type} item={item} />
					))}
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

export function ElementLibrary() {
	const [search, setSearch] = useState('');

	const filteredCatalog = useMemo(() => {
		const query = search.toLowerCase().trim();
		if (!query) return ELEMENT_CATALOG;

		return ELEMENT_CATALOG.map((category) => {
			if (!category.enabled) return { ...category, items: [] };
			const matchedItems = category.items.filter((item) =>
				item.label.toLowerCase().includes(query),
			);
			return { ...category, items: matchedItems };
		});
	}, [search]);

	const enabledCategories = filteredCatalog.filter((c) => c.enabled);
	const disabledCategories = filteredCatalog.filter((c) => !c.enabled);
	const hasResults = enabledCategories.some((c) => c.items.length > 0);
	const defaultOpen = enabledCategories.filter((c) => c.items.length > 0).map((c) => c.id);

	return (
		<div className="flex h-full flex-col">
			<div className="border-b p-2">
				<div className="relative">
					<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search elements..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-7 pl-8 text-xs"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{hasResults ? (
					<Accordion type="multiple" defaultValue={defaultOpen}>
						{enabledCategories
							.filter((c) => c.items.length > 0)
							.map((category) => (
								<CategorySection key={category.id} category={category} />
							))}
					</Accordion>
				) : (
					<div className="flex items-center justify-center p-8">
						<p className="text-xs text-muted-foreground">No elements found</p>
					</div>
				)}

				{!search && disabledCategories.length > 0 && (
					<div className="border-t">
						{disabledCategories.map((category) => (
							<CategorySection key={category.id} category={category} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
