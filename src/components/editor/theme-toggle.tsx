'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/lib/stores/ui-store';
import type { ThemePreference } from '@/types';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon },
	{ value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle() {
	const { setTheme: setNextTheme, resolvedTheme } = useTheme();
	const setStoreTheme = useUIStore((s) => s.setTheme);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	function handleSelect(theme: ThemePreference) {
		setStoreTheme(theme);
		setNextTheme(theme);
	}

	// Render Sun during SSR to avoid hydration mismatch (resolvedTheme is undefined server-side)
	const CurrentIcon = mounted && resolvedTheme === 'dark' ? Moon : Sun;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle theme">
					<CurrentIcon className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
					<DropdownMenuItem key={value} onSelect={() => handleSelect(value)}>
						<Icon className="mr-2 h-4 w-4" />
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
