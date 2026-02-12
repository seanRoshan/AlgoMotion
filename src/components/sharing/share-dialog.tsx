/**
 * Share dialog for toggling public access and copying share link.
 *
 * Spec reference: Section 6.9 (Shareable Link)
 */

'use client';

import { useCallback, useState } from 'react';

interface ShareDialogProps {
	projectId: string;
	projectName: string;
	isPublic: boolean;
	onTogglePublic: (isPublic: boolean) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
	projectId,
	projectName,
	isPublic,
	onTogglePublic,
	open,
	onOpenChange,
}: ShareDialogProps) {
	const [copied, setCopied] = useState(false);

	const shareUrl =
		typeof window !== 'undefined'
			? `${window.location.origin}/embed/${projectId}`
			: `/embed/${projectId}`;

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [shareUrl]);

	const handleToggle = useCallback(() => {
		onTogglePublic(!isPublic);
	}, [isPublic, onTogglePublic]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Share Project</h2>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						aria-label="Close"
						className="text-muted-foreground hover:text-foreground"
					>
						&times;
					</button>
				</div>

				<p className="text-sm text-muted-foreground mb-4">
					Share &ldquo;{projectName}&rdquo; with a public link.
				</p>

				{/* Public toggle */}
				<div className="flex items-center justify-between mb-4">
					<label htmlFor="public-toggle" className="text-sm">
						Make project public
					</label>
					<button
						id="public-toggle"
						type="button"
						role="switch"
						aria-checked={isPublic}
						onClick={handleToggle}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							isPublic ? 'bg-indigo-600' : 'bg-gray-600'
						}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
								isPublic ? 'translate-x-6' : 'translate-x-1'
							}`}
						/>
					</button>
				</div>

				{/* Share link */}
				{isPublic && (
					<div className="space-y-2">
						<label htmlFor="share-url" className="text-sm text-muted-foreground">
							Share link
						</label>
						<div className="flex gap-2">
							<input
								id="share-url"
								type="text"
								readOnly
								value={shareUrl}
								className="flex-1 rounded border border-border bg-muted px-3 py-1.5 text-sm"
							/>
							<button
								type="button"
								onClick={handleCopy}
								aria-label="Copy link"
								className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
							>
								{copied ? 'Copied!' : 'Copy'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
