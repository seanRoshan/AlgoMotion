import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppLogo({ className, linkTo = '/' }: { className?: string; linkTo?: string }) {
	return (
		<Link href={linkTo} className={cn('flex items-center gap-2', className)}>
			<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
				<span className="text-sm font-bold text-primary-foreground">A</span>
			</div>
			<span className="text-sm font-semibold tracking-tight">AlgoMotion</span>
		</Link>
	);
}
