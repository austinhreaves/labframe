import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Lab } from '@/domain/schema';
import { TableOfContents } from '@/ui/layout/TableOfContents';

const observe = vi.fn();
const disconnect = vi.fn();

class MockIntersectionObserver {
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);

  constructor() {
    // no-op
  }
}

const tocFixtureLab: Lab = {
  id: 'toc-fixture',
  title: 'TOC fixture',
  description: 'test',
  category: 'Physics',
  simulations: {
    sim: {
      title: 'Sim',
      url: 'https://example.com',
    },
  },
  sections: [
    { kind: 'instructions', html: '## Setup\nfoo' },
    { kind: 'instructions', html: '# Big heading\nfoo' },
    { kind: 'instructions', html: '## Hidden\nfoo', tocHidden: true },
    { kind: 'objective', fieldId: 'obj', rows: 2 },
    { kind: 'measurement', fieldId: 'm1', label: 'M1' },
    {
      kind: 'dataTable',
      tableId: 't1',
      rowCount: 1,
      tocLabel: 'Trial data',
      columns: [{ id: 'c', label: 'C', kind: 'input' }],
    },
  ],
};

describe('TableOfContents', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    observe.mockClear();
    disconnect.mockClear();
    scrollIntoView.mockClear();
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: MockIntersectionObserver,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    window.history.replaceState(null, '', '/');
  });

  it('popover closed by default; opens on summary; lists major sections in order; click scrolls and sets hash', () => {
    const { container } = render(
      <div>
        <TableOfContents sections={tocFixtureLab.sections} />
        {tocFixtureLab.sections.map((section, index) => (
          <div key={`${section.kind}-${index}`} id={`section-${index}`} data-testid={`anchor-${index}`}>
            {section.kind}
          </div>
        ))}
      </div>,
    );

    const details = container.querySelector('details.table-of-contents-popover');
    expect(details).toBeTruthy();
    expect(details).not.toHaveAttribute('open');

    fireEvent.click(screen.getByText('Sections'));
    expect(details).toHaveAttribute('open');

    const nav = details!.querySelector('nav.table-of-contents-popover-panel');
    expect(nav).toBeTruthy();
    const items = within(nav as HTMLElement).getAllByRole('listitem', { hidden: true });
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Setup');
    expect(items[1]).toHaveTextContent('Objective');
    expect(items[2]).toHaveTextContent('Trial data');

    const setupLink = (nav as HTMLElement).querySelector('a[href="#section-0"]');
    expect(setupLink).toBeTruthy();
    fireEvent.click(setupLink!);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('#section-0');
  });

  it('closes popover when clicking outside the details element', async () => {
    const { container } = render(
      <div>
        <button type="button" data-testid="outside">
          outside
        </button>
        <TableOfContents sections={tocFixtureLab.sections} />
      </div>,
    );

    const details = container.querySelector('details.table-of-contents-popover');
    expect(details).toBeTruthy();

    fireEvent.click(screen.getByText('Sections'));
    expect(details).toHaveAttribute('open');

    await waitFor(() => expect(details!.querySelector('nav.table-of-contents-popover-panel')).toBeTruthy());
    fireEvent.pointerDown(screen.getByTestId('outside'));
    await waitFor(() => expect(details).not.toHaveAttribute('open'));
  });
});
