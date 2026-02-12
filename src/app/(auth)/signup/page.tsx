import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
	title: 'Sign Up — AlgoMotion',
	description: 'Create your AlgoMotion account.',
};

export default function SignupPage() {
	return <SignupForm />;
}
