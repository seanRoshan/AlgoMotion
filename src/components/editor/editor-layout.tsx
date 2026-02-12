'use client';

import { PixiCanvas } from '@/components/canvas/pixi-canvas';
import { BottomPanel } from '@/components/panels/bottom-panel';
import { LeftPanel } from '@/components/panels/left-panel';
import { RightPanel } from '@/components/panels/right-panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Toolbar } from './toolbar';

export function EditorLayout() {
	return (
		<div className="flex h-screen flex-col overflow-hidden">
			<Toolbar />
			<ResizablePanelGroup orientation="horizontal" className="flex-1">
				<ResizablePanel
					id="left-panel"
					defaultSize={18}
					minSize={12}
					maxSize={28}
					collapsible
					className="bg-card"
				>
					<LeftPanel />
				</ResizablePanel>

				<ResizableHandle withHandle />

				<ResizablePanel id="center-panel" defaultSize={58}>
					<ResizablePanelGroup orientation="vertical">
						<ResizablePanel id="canvas-panel" defaultSize={65} minSize={30}>
							<PixiCanvas />
						</ResizablePanel>

						<ResizableHandle withHandle />

						<ResizablePanel
							id="bottom-panel"
							defaultSize={35}
							minSize={10}
							maxSize={60}
							collapsible
							className="bg-card"
						>
							<BottomPanel />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>

				<ResizableHandle withHandle />

				<ResizablePanel
					id="right-panel"
					defaultSize={20}
					minSize={14}
					maxSize={30}
					collapsible
					className="bg-card"
				>
					<RightPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
