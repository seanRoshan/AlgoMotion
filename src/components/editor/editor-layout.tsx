'use client';

import { useCallback, useEffect } from 'react';
import type { PanelSize } from 'react-resizable-panels';
import { usePanelRef } from 'react-resizable-panels';
import { PixiCanvas } from '@/components/canvas/pixi-canvas';
import { BottomPanel } from '@/components/panels/bottom-panel';
import { LeftPanel } from '@/components/panels/left-panel';
import { RightPanel } from '@/components/panels/right-panel';
import { MobileViewportWarning } from '@/components/ui/mobile-viewport-warning';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { usePlaybackAnnouncer } from '@/hooks/use-playback-announcer';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { useThemeSync } from '@/hooks/use-theme-sync';
import { useUIStore } from '@/lib/stores/ui-store';
import { CommandPalette } from './command-palette';
import { Toolbar } from './toolbar';

export function EditorLayout() {
	useGlobalShortcuts();
	useAutoSave();
	useThemeSync();
	usePlaybackAnnouncer();
	useServiceWorker();

	const leftRef = usePanelRef();
	const rightRef = usePanelRef();
	const bottomRef = usePanelRef();

	const panelSizes = useUIStore((s) => s.panelSizes);
	const lastPanelSizes = useUIStore((s) => s.lastPanelSizes);
	const panels = useUIStore((s) => s.panels);
	const setPanelSize = useUIStore((s) => s.setPanelSize);
	const setPanelVisible = useUIStore((s) => s.setPanelVisible);

	// Sync imperative panel collapse/expand with store visibility.
	// Use resize() with explicit percentage to guarantee the panel restores
	// to the correct size (expand() alone may restore to a stale 0 value).
	useEffect(() => {
		const panel = leftRef.current;
		if (!panel) return;
		if (panels.left && panel.isCollapsed()) {
			panel.resize(`${lastPanelSizes.left}%`);
		} else if (!panels.left && !panel.isCollapsed()) {
			panel.collapse();
		}
	}, [panels.left, lastPanelSizes.left, leftRef]);

	useEffect(() => {
		const panel = rightRef.current;
		if (!panel) return;
		if (panels.right && panel.isCollapsed()) {
			panel.resize(`${lastPanelSizes.right}%`);
		} else if (!panels.right && !panel.isCollapsed()) {
			panel.collapse();
		}
	}, [panels.right, lastPanelSizes.right, rightRef]);

	useEffect(() => {
		const panel = bottomRef.current;
		if (!panel) return;
		if (panels.bottom && panel.isCollapsed()) {
			panel.resize(`${lastPanelSizes.bottom}%`);
		} else if (!panels.bottom && !panel.isCollapsed()) {
			panel.collapse();
		}
	}, [panels.bottom, lastPanelSizes.bottom, bottomRef]);

	// Track resize and sync collapsed state back to store.
	// onResize fires on mount with prevPanelSize=undefined — skip that to avoid
	// persisting corrupted pixel-based values over the correct percentages.
	// IMPORTANT: Only update panelSizes when size > 0 to prevent saving 0 on collapse.
	const handleLeftResize = useCallback(
		(size: PanelSize, _id: string | number | undefined, prevSize: PanelSize | undefined) => {
			if (!prevSize) return; // Skip initial mount callback
			if (size.asPercentage > 0) {
				setPanelSize('left', size.asPercentage);
			}
			// Sync collapsed state from drag-to-collapse
			if (size.asPercentage === 0 && panels.left) setPanelVisible('left', false);
			else if (size.asPercentage > 0 && !panels.left) setPanelVisible('left', true);
		},
		[setPanelSize, setPanelVisible, panels.left],
	);

	const handleRightResize = useCallback(
		(size: PanelSize, _id: string | number | undefined, prevSize: PanelSize | undefined) => {
			if (!prevSize) return;
			if (size.asPercentage > 0) {
				setPanelSize('right', size.asPercentage);
			}
			if (size.asPercentage === 0 && panels.right) setPanelVisible('right', false);
			else if (size.asPercentage > 0 && !panels.right) setPanelVisible('right', true);
		},
		[setPanelSize, setPanelVisible, panels.right],
	);

	const handleBottomResize = useCallback(
		(size: PanelSize, _id: string | number | undefined, prevSize: PanelSize | undefined) => {
			if (!prevSize) return;
			if (size.asPercentage > 0) {
				setPanelSize('bottom', size.asPercentage);
			}
			if (size.asPercentage === 0 && panels.bottom) setPanelVisible('bottom', false);
			else if (size.asPercentage > 0 && !panels.bottom) setPanelVisible('bottom', true);
		},
		[setPanelSize, setPanelVisible, panels.bottom],
	);

	return (
		<main id="main-content" className="flex h-screen flex-col overflow-hidden">
			<OfflineIndicator />
			<Toolbar />
			<CommandPalette />
			<MobileViewportWarning />
			<ResizablePanelGroup orientation="horizontal" className="flex-1">
				<ResizablePanel
					id="left-panel"
					panelRef={leftRef}
					defaultSize={`${panelSizes.left}%`}
					minSize="12%"
					maxSize="28%"
					collapsible
					onResize={handleLeftResize}
					className="bg-card"
				>
					<LeftPanel />
				</ResizablePanel>

				<ResizableHandle withHandle />

				<ResizablePanel
					id="center-panel"
					defaultSize={`${100 - panelSizes.left - panelSizes.right}%`}
				>
					<ResizablePanelGroup orientation="vertical">
						<ResizablePanel
							id="canvas-panel"
							defaultSize={`${100 - panelSizes.bottom}%`}
							minSize="30%"
						>
							<PixiCanvas />
						</ResizablePanel>

						<ResizableHandle withHandle />

						<ResizablePanel
							id="bottom-panel"
							panelRef={bottomRef}
							defaultSize={`${panelSizes.bottom}%`}
							minSize="10%"
							maxSize="60%"
							collapsible
							onResize={handleBottomResize}
							className="bg-card"
						>
							<BottomPanel />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>

				<ResizableHandle withHandle />

				<ResizablePanel
					id="right-panel"
					panelRef={rightRef}
					defaultSize={`${panelSizes.right}%`}
					minSize="14%"
					maxSize="30%"
					collapsible
					onResize={handleRightResize}
					className="bg-card"
				>
					<RightPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</main>
	);
}
