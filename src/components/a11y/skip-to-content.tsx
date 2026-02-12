/**
 * Skip navigation link for keyboard users.
 *
 * Visually hidden until focused via Tab key, then appears
 * at top of page allowing users to bypass navigation.
 *
 * Spec reference: Section 11 (Accessibility Requirements)
 */

export function SkipToContent() {
	return (
		<a
			href="#main-content"
			className="fixed top-0 left-0 z-[9999] -translate-y-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-transform focus:translate-y-0"
		>
			Skip to main content
		</a>
	);
}
