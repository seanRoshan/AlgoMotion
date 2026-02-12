import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
	silent: true,
	disableLogger: true,
});
