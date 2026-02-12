import { LayoutTemplate } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = {
	title: 'Templates — AlgoMotion',
	description: 'Browse algorithm and data structure animation templates.',
};

export default function TemplatesPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold">Templates</h1>
				<p className="text-muted-foreground">
					Start from a pre-built algorithm or data structure template
				</p>
			</div>
			<div className="rounded-lg border">
				<EmptyState
					icon={LayoutTemplate}
					title="Templates coming soon"
					description="Pre-built algorithm and data structure animation templates"
					className="py-16"
				/>
			</div>
		</div>
	);
}
