import { Settings } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = {
	title: 'Settings — AlgoMotion',
	description: 'Manage your AlgoMotion account and preferences.',
};

export default function SettingsPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold">Settings</h1>
				<p className="text-muted-foreground">Manage your account and preferences</p>
			</div>
			<div className="rounded-lg border">
				<EmptyState
					icon={Settings}
					title="Settings coming soon"
					description="Account management and preferences"
					className="py-16"
				/>
			</div>
		</div>
	);
}
