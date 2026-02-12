import type { Metadata } from 'next';
import { EditorLayout } from '@/components/editor/editor-layout';

export const metadata: Metadata = {
	title: 'Editor — AlgoMotion',
	description: 'Create and edit algorithm animations.',
};

export default function EditorPage() {
	return <EditorLayout />;
}
