import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { InstructionsSection } from '@/domain/schema';
import { InstructionsSectionView } from '@/ui/sections/InstructionsSectionView';

describe('InstructionsSectionView', () => {
  it('renders markdown blocks including inline math', () => {
    const section: InstructionsSection = {
      kind: 'instructions',
      html: ['## Header', '**bold** text', '- item one', '- item two', 'inline math: $x^2 + 1$'].join('\n\n'),
    };

    const { container } = render(<InstructionsSectionView section={section} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Header' })).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('item one')).toBeInTheDocument();
    expect(container.querySelector('.katex')).toBeTruthy();
  });

  it('sanitizes hostile html fixture content', () => {
    const section: InstructionsSection = {
      kind: 'instructions',
      html: [
        '## hostile',
        '<script>alert(1)</script>',
        '<iframe src="https://example.com"></iframe>',
        '<a href="javascript:alert(2)" onclick="alert(3)">link</a>',
      ].join('\n\n'),
    };

    const { container } = render(<InstructionsSectionView section={section} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });
});
