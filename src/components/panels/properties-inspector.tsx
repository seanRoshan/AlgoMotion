'use client';

import { Settings2 } from 'lucide-react';
import { useCallback } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useSceneStore } from '@/lib/stores/scene-store';
import type { SceneElement } from '@/types';

/**
 * Properties Inspector panel — displays and edits properties
 * of the currently selected scene element.
 *
 * Sections: Transform (position, size, rotation, opacity),
 * Style (fill, stroke, corner radius).
 */
export function PropertiesInspector() {
	const selectedIds = useSceneStore((s) => s.selectedIds);
	const elements = useSceneStore((s) => s.elements);
	const updateElement = useSceneStore((s) => s.updateElement);

	if (selectedIds.length === 0) {
		return (
			<EmptyState
				icon={Settings2}
				title="No selection"
				description="Select an element to view its properties"
			/>
		);
	}

	if (selectedIds.length > 1) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-sm text-muted-foreground">{selectedIds.length} elements selected</p>
			</div>
		);
	}

	const elementId = selectedIds[0];
	if (!elementId) return null;
	const element = elements[elementId];
	if (!element) return null;

	return (
		<div className="space-y-3 p-3">
			{/* Element type label */}
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-muted-foreground">Type</span>
				<span className="text-xs font-mono">{element.type}</span>
			</div>

			<Separator />

			{/* Transform Section */}
			<TransformSection element={element} onUpdate={updateElement} />

			<Separator />

			{/* Style Section */}
			<StyleSection element={element} onUpdate={updateElement} />
		</div>
	);
}

// ── Transform Section ──

function TransformSection({
	element,
	onUpdate,
}: {
	element: SceneElement;
	onUpdate: (id: string, updates: Partial<SceneElement>) => void;
}) {
	const handlePositionChange = useCallback(
		(axis: 'x' | 'y', value: string) => {
			const num = Number(value);
			if (Number.isNaN(num)) return;
			onUpdate(element.id, {
				position: { ...element.position, [axis]: num },
			});
		},
		[element.id, element.position, onUpdate],
	);

	const handleSizeChange = useCallback(
		(dim: 'width' | 'height', value: string) => {
			const num = Number(value);
			if (Number.isNaN(num) || num < 1) return;
			onUpdate(element.id, {
				size: { ...element.size, [dim]: num },
			});
		},
		[element.id, element.size, onUpdate],
	);

	const handleRotationChange = useCallback(
		(value: string) => {
			const num = Number(value);
			if (Number.isNaN(num)) return;
			onUpdate(element.id, { rotation: num });
		},
		[element.id, onUpdate],
	);

	const handleOpacityChange = useCallback(
		(values: number[]) => {
			const value = values[0];
			if (value === undefined) return;
			onUpdate(element.id, { opacity: value / 100 });
		},
		[element.id, onUpdate],
	);

	return (
		<div className="space-y-2">
			<h3 className="text-xs font-semibold text-muted-foreground">Transform</h3>

			{/* Position */}
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1">
					<Label htmlFor="pos-x" className="text-xs">
						X
					</Label>
					<Input
						id="pos-x"
						type="number"
						value={Math.round(element.position.x)}
						onChange={(e) => handlePositionChange('x', e.target.value)}
						className="h-7 text-xs"
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="pos-y" className="text-xs">
						Y
					</Label>
					<Input
						id="pos-y"
						type="number"
						value={Math.round(element.position.y)}
						onChange={(e) => handlePositionChange('y', e.target.value)}
						className="h-7 text-xs"
					/>
				</div>
			</div>

			{/* Size */}
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1">
					<Label htmlFor="size-w" className="text-xs">
						W
					</Label>
					<Input
						id="size-w"
						type="number"
						value={Math.round(element.size.width)}
						onChange={(e) => handleSizeChange('width', e.target.value)}
						className="h-7 text-xs"
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="size-h" className="text-xs">
						H
					</Label>
					<Input
						id="size-h"
						type="number"
						value={Math.round(element.size.height)}
						onChange={(e) => handleSizeChange('height', e.target.value)}
						className="h-7 text-xs"
					/>
				</div>
			</div>

			{/* Rotation */}
			<div className="space-y-1">
				<Label htmlFor="rotation" className="text-xs">
					Rotation
				</Label>
				<Input
					id="rotation"
					type="number"
					value={Math.round(element.rotation)}
					onChange={(e) => handleRotationChange(e.target.value)}
					className="h-7 text-xs"
				/>
			</div>

			{/* Opacity */}
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">Opacity</span>
					<span className="text-xs text-muted-foreground">
						{Math.round(element.opacity * 100)}%
					</span>
				</div>
				<Slider
					value={[Math.round(element.opacity * 100)]}
					min={0}
					max={100}
					step={1}
					onValueChange={handleOpacityChange}
					aria-label="Opacity"
				/>
			</div>
		</div>
	);
}

// ── Style Section ──

function StyleSection({
	element,
	onUpdate,
}: {
	element: SceneElement;
	onUpdate: (id: string, updates: Partial<SceneElement>) => void;
}) {
	const handleFillChange = useCallback(
		(value: string) => {
			onUpdate(element.id, {
				style: { ...element.style, fill: value },
			});
		},
		[element.id, element.style, onUpdate],
	);

	const handleStrokeChange = useCallback(
		(value: string) => {
			onUpdate(element.id, {
				style: { ...element.style, stroke: value },
			});
		},
		[element.id, element.style, onUpdate],
	);

	const handleStrokeWidthChange = useCallback(
		(value: string) => {
			const num = Number(value);
			if (Number.isNaN(num) || num < 0) return;
			onUpdate(element.id, {
				style: { ...element.style, strokeWidth: num },
			});
		},
		[element.id, element.style, onUpdate],
	);

	const handleCornerRadiusChange = useCallback(
		(values: number[]) => {
			const value = values[0];
			if (value === undefined) return;
			onUpdate(element.id, {
				style: { ...element.style, cornerRadius: value },
			});
		},
		[element.id, element.style, onUpdate],
	);

	return (
		<div className="space-y-2">
			<h3 className="text-xs font-semibold text-muted-foreground">Style</h3>

			{/* Fill */}
			<div className="flex items-center gap-2">
				<span className="w-10 text-xs text-muted-foreground">Fill</span>
				<input
					type="color"
					value={element.style.fill}
					onChange={(e) => handleFillChange(e.target.value)}
					className="h-6 w-6 cursor-pointer rounded border-0"
					aria-label="Fill color"
				/>
				<Input
					type="text"
					value={element.style.fill}
					onChange={(e) => handleFillChange(e.target.value)}
					className="h-7 flex-1 font-mono text-xs"
					aria-label="Fill hex value"
				/>
			</div>

			{/* Stroke */}
			<div className="flex items-center gap-2">
				<span className="w-10 text-xs text-muted-foreground">Stroke</span>
				<input
					type="color"
					value={element.style.stroke}
					onChange={(e) => handleStrokeChange(e.target.value)}
					className="h-6 w-6 cursor-pointer rounded border-0"
					aria-label="Stroke color"
				/>
				<Input
					type="text"
					value={element.style.stroke}
					onChange={(e) => handleStrokeChange(e.target.value)}
					className="h-7 flex-1 font-mono text-xs"
					aria-label="Stroke hex value"
				/>
			</div>

			{/* Stroke Width */}
			<div className="flex items-center gap-2">
				<span className="w-16 text-xs text-muted-foreground">Width</span>
				<Input
					type="number"
					value={element.style.strokeWidth}
					onChange={(e) => handleStrokeWidthChange(e.target.value)}
					className="h-7 text-xs"
					min={0}
					aria-label="Stroke width"
				/>
			</div>

			{/* Corner Radius */}
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">Radius</span>
					<span className="text-xs text-muted-foreground">{element.style.cornerRadius}px</span>
				</div>
				<Slider
					value={[element.style.cornerRadius]}
					min={0}
					max={50}
					step={1}
					onValueChange={handleCornerRadiusChange}
					aria-label="Corner radius"
				/>
			</div>
		</div>
	);
}
