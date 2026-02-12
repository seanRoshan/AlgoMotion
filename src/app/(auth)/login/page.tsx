export default function LoginPage() {
	return (
		<div className="space-y-4 text-center">
			<div className="flex justify-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
					<span className="text-xl font-bold text-primary-foreground">A</span>
				</div>
			</div>
			<h1 className="text-2xl font-semibold">Sign in to AlgoMotion</h1>
			<p className="text-sm text-muted-foreground">Authentication coming soon (Supabase Auth)</p>
		</div>
	);
}
