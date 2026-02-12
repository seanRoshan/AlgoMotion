import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ScreenReaderAnnouncer } from '@/components/a11y/screen-reader-announcer';
import { SkipToContent } from '@/components/a11y/skip-to-content';
import { Providers } from '@/components/shared/providers';
import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-jetbrains-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'AlgoMotion — Algorithm Animation Studio',
	description:
		'Interactive animation studio for creating, editing, and exporting visual explanations of algorithms, data structures, and CS concepts.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
				<SkipToContent />
				<Providers>
					<ScreenReaderAnnouncer />
					{children}
				</Providers>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
