import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { renderMarkdownToPdf } from '@/services/pdf/markdown/renderMarkdownToPdf';

function collectElements(node: unknown, bag: Array<{ props: Record<string, unknown> }> = []): Array<{ props: Record<string, unknown> }> {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectElements(child, bag);
    }
    return bag;
  }
  if (!isValidElement(node)) {
    return bag;
  }

  bag.push(node as { props: Record<string, unknown> });
  collectElements((node as { props: { children?: unknown } }).props.children, bag);
  return bag;
}

function collectText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((child) => collectText(child)).join('');
  }
  if (!isValidElement(node)) {
    return '';
  }
  return collectText((node as { props: { children?: unknown } }).props.children);
}

describe('renderMarkdownToPdf', () => {
  it('applies heading depth sizing for level-two headings', () => {
    const nodes = renderMarkdownToPdf('## Part 1');
    const elements = collectElements(nodes);
    const heading = elements.find((element) => {
      const style = element.props.style;
      return typeof style === 'object' && style !== null && (style as { fontSize?: number }).fontSize === 14;
    });
    expect(heading).toBeDefined();
    expect(collectText(heading)).toContain('Part 1');
  });

  it('renders bold spans and unordered list bullets', () => {
    const markdown = ['This has **bold** text.', '', '- one', '- two', '- three'].join('\n');
    const nodes = renderMarkdownToPdf(markdown);
    const elements = collectElements(nodes);

    const hasBold = elements.some((element) => {
      const style = element.props.style;
      return typeof style === 'object' && style !== null && (style as { fontWeight?: number }).fontWeight === 700;
    });

    expect(hasBold).toBe(true);
    const textDump = collectText(nodes);
    expect(textDump).toContain('• one');
    expect(textDump).toContain('• two');
    expect(textDump).toContain('• three');
  });

  it('converts inline math to unicode text', () => {
    const nodes = renderMarkdownToPdf('Compute $\\sin\\theta_i$ from the table.');
    const textDump = collectText(nodes);
    expect(textDump).toContain('sinθᵢ');
  });

  it('handles hostile script-like input without crashing', () => {
    const nodes = renderMarkdownToPdf('<script>alert(1)</script>');
    const textDump = collectText(nodes);
    expect(textDump).toContain('<script>alert(1)</script>');
  });

  it('renders github-style callout labels in PDF markdown', () => {
    const nodes = renderMarkdownToPdf('> [!WARNING]\n> Keep goggles on.');
    const textDump = collectText(nodes);
    expect(textDump).toContain('WARNING');
    expect(textDump).toContain('Keep goggles on.');
  });
});
