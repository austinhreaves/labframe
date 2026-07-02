import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MarkdownBlock from '@/ui/primitives/MarkdownBlock';

describe('MarkdownBlock callouts', () => {
  it('renders a single-line NOTE blockquote as a callout', () => {
    render(<MarkdownBlock markdown={'> [!NOTE]\n> Just one line.'} />);
    expect(screen.getByText('NOTE')).toBeInTheDocument();
    expect(screen.queryByText(/\[!NOTE\]/)).not.toBeInTheDocument();
  });

  it('renders a multi-line NOTE blockquote (soft break) as a callout', () => {
    render(
      <MarkdownBlock
        markdown={'> [!NOTE]\n> An *insulator* near a charged object rearranges too.'}
      />,
    );
    expect(screen.getByText('NOTE')).toBeInTheDocument();
    expect(screen.queryByText(/\[!NOTE\]/)).not.toBeInTheDocument();
  });
});
