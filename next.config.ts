import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
	reactCompiler: true,
	allowedDevOrigins: ['192.168.2.13'],
	headers: async () => [
		{
			source: '/embed/:path*',
			headers: [
				{ key: 'X-Frame-Options', value: 'ALLOWALL' },
				{ key: 'Content-Security-Policy', value: 'frame-ancestors *' },
			],
		},
	],
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
	silent: true,
});
