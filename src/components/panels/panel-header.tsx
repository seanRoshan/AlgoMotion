import { cn } from '@/lib/utils';

export function PanelHeader({
	title,
	className,
	children,
}: {
	title: string;
	className?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className={cn('flex h-8 shrink-0 items-center justify-between border-b px-3', className)}>
			<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
				{title}
			</span>
			{children && <div className="flex items-center gap-1">{children}</div>}
		</div>
	);
}
