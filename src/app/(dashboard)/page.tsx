import { FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Welcome to AlgoMotion</h1>
					<p className="text-muted-foreground">
						Create interactive algorithm and data structure animations
					</p>
				</div>
				<Button asChild>
					<Link href="/editor/new">New Project</Link>
				</Button>
			</div>
			<div className="rounded-lg border">
				<EmptyState
					icon={FolderOpen}
					title="No projects yet"
					description="Create your first animation to get started"
					className="py-16"
				/>
			</div>
		</div>
	);
}
