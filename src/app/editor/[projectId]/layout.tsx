import type { ReactNode } from 'react';
import { DesktopOnlyGate } from '@/components/shared/desktop-only-gate';

export default function EditorLayout({ children }: { children: ReactNode }) {
	return <DesktopOnlyGate>{children}</DesktopOnlyGate>;
}
