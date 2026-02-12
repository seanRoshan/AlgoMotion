'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { MIN_DESKTOP_WIDTH } from '@/lib/constants';

export function DesktopOnlyGate({ children }: { children: ReactNode }) {
	const [isDesktop, setIsDesktop] = useState(true);

	useEffect(() => {
		const check = () => setIsDesktop(window.innerWidth >= MIN_DESKTOP_WIDTH);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	if (!isDesktop) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
					<span className="text-xl font-bold text-primary-foreground">A</span>
				</div>
				<h1 className="text-xl font-semibold">AlgoMotion</h1>
				<p className="max-w-sm text-muted-foreground">
					AlgoMotion is a desktop application. Please use a browser window at least 1024px wide.
				</p>
			</div>
		);
	}

	return <>{children}</>;
}
