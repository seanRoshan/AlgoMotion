import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
	title: 'Sign In — AlgoMotion',
	description: 'Sign in to your AlgoMotion account.',
};

export default function LoginPage() {
	return <LoginForm />;
}
