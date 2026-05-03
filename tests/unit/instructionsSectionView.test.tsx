import { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { InstructionsSection } from '@/domain/schema';
import { InstructionsSectionView } from '@/ui/sections/InstructionsSectionView';

describe('InstructionsSectionView', () => {
  it('renders markdown blocks including inline math', async () => {
    const section: InstructionsSection = {
      kind: 'instructions',
      html: ['## Header', '**bold** text', '- item one', '- item two', 'inline math: $x^2 + 1$'].join('\n\n'),
    };

    const { container } = render(
      <Suspense fallback={null}>
        <InstructionsSectionView section={section} />
      </Suspense>,
    );
    expect(await screen.findByRole('heading', { level: 2, name: 'Header' })).toBeInTheDocument();
    expect(await screen.findByText('bold')).toBeInTheDocument();
    expect(await screen.findByText('item one')).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('.katex')).toBeTruthy();
    });
  });

  it('sanitizes hostile html fixture content', async () => {
    const section: InstructionsSection = {
      kind: 'instructions',
      html: [
        '## hostile',
        '<script>alert(1)</script>',
        '<iframe src="https://example.com"></iframe>',
        '<a href="javascript:alert(2)" onclick="alert(3)">link</a>',
      ].join('\n\n'),
    };

    const { container } = render(
      <Suspense fallback={null}>
        <InstructionsSectionView section={section} />
      </Suspense>,
    );
    await screen.findByRole('heading', { level: 2, name: 'hostile' });
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });
});
