import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
	icon: Icon,
	title,
	description,
	className,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	className?: string;
}) {
	return (
		<div
			className={cn('flex flex-col items-center justify-center gap-3 p-8 text-center', className)}
		>
			<Icon className="h-12 w-12 text-muted-foreground/50" />
			<div className="space-y-1">
				<p className="text-sm font-medium text-muted-foreground">{title}</p>
				<p className="text-xs text-muted-foreground/70">{description}</p>
			</div>
		</div>
	);
}
