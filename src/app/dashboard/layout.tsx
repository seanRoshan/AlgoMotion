import type { ReactNode } from 'react';
import { AppLogo } from '@/components/shared/app-logo';

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen">
			<header className="flex h-14 items-center border-b px-6">
				<AppLogo />
				<nav className="ml-8 flex items-center gap-6">
					<span className="text-sm font-medium">Dashboard</span>
					<span className="text-sm text-muted-foreground">Templates</span>
					<span className="text-sm text-muted-foreground">Settings</span>
				</nav>
			</header>
			<main className="mx-auto max-w-6xl p-6">{children}</main>
		</div>
	);
}
