'use client';

import { useEffect, useRef } from 'react';

export function PixiCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Pixi.js Application will be initialized here in Issue #4
		// This is the imperative mount point — no React reconciler for canvas
	}, []);

	return (
		<main
			ref={containerRef}
			className="relative h-full w-full bg-[hsl(220,14%,10%)]"
			aria-label="Canvas workspace"
		>
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-muted-foreground">Canvas</p>
					<p className="text-xs text-muted-foreground/50">Pixi.js workspace (Issue #4)</p>
				</div>
			</div>
		</main>
	);
}
