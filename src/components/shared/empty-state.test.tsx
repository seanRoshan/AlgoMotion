import { render, screen } from '@testing-library/react';
import { Blocks } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
	it('renders title and description', () => {
		render(<EmptyState icon={Blocks} title="No items" description="Add items to get started" />);
		expect(screen.getByText('No items')).toBeInTheDocument();
		expect(screen.getByText('Add items to get started')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(
			<EmptyState icon={Blocks} title="Test" description="Test" className="py-16" />,
		);
		expect(container.firstChild).toHaveClass('py-16');
	});
});
