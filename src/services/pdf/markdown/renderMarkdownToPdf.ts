import { createElement } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from '@react-pdf/renderer';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';

import { latexToUnicode } from '@/services/pdf/markdown/latexToUnicode';

type MdNode = {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  start?: number;
  url?: string;
  children?: MdNode[];
};

type ImportMetaWithOptionalEnv = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

const headingSizes: Record<number, number> = {
  1: 18,
  2: 14,
  3: 12,
  4: 11,
  5: 10,
  6: 10,
};

const styles = {
  paragraph: { marginBottom: 4 },
  heading: { marginTop: 6, marginBottom: 4, fontWeight: 700 as const },
  strong: { fontWeight: 700 as const },
  emphasis: { fontStyle: 'italic' as const },
  inlineCode: { fontFamily: 'Courier', fontSize: 9 },
  codeBlockContainer: { marginTop: 2, marginBottom: 6, backgroundColor: '#f5f5f5', padding: 4 },
  codeBlockText: { fontFamily: 'Courier', fontSize: 9 },
  list: { marginBottom: 6 },
  listItem: { marginBottom: 2 },
  blockquote: { borderLeftWidth: 1.5, borderLeftColor: '#999', paddingLeft: 6, marginBottom: 6 },
  thematicBreak: { borderBottomWidth: 0.5, borderBottomColor: '#999', marginTop: 6, marginBottom: 6 },
  table: { marginTop: 4, marginBottom: 6, borderWidth: 0.5, borderColor: '#777' },
  tableRow: { flexDirection: 'row' as const, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  tableCell: { flex: 1, padding: 3, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  tableHeaderCell: { fontWeight: 700 as const },
  inlineMath: { fontFamily: 'Courier', fontSize: 9 },
  mathBlock: { fontFamily: 'Courier', fontSize: 9, marginBottom: 6 },
};

let warnedBlockMathFallback = false;

function isDev(): boolean {
  return Boolean((import.meta as ImportMetaWithOptionalEnv).env?.DEV);
}

function warnBlockMathFallbackOnce(): void {
  if (!isDev() || warnedBlockMathFallback) {
    return;
  }
  warnedBlockMathFallback = true;
  console.warn('[pdf-markdown] Block math fallback active; rendering raw LaTeX in monospace.');
}

function nodeChildren(node: MdNode): MdNode[] {
  return Array.isArray(node.children) ? node.children : [];
}

function flattenToText(nodes: MdNode[]): string {
  return nodes
    .map((child) => {
      if (child.type === 'text' || child.type === 'inlineCode' || child.type === 'html') {
        return child.value ?? '';
      }
      if (child.type === 'inlineMath') {
        return latexToUnicode(child.value ?? '');
      }
      if (child.type === 'break') {
        return '\n';
      }
      return flattenToText(nodeChildren(child));
    })
    .join('');
}

function renderInlineNodes(nodes: MdNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-inline-${index}`;
    if (node.type === 'text') {
      return createElement(Text, { key }, node.value ?? '');
    }
    if (node.type === 'strong') {
      return createElement(Text, { key, style: styles.strong }, renderInlineNodes(nodeChildren(node), key));
    }
    if (node.type === 'emphasis') {
      return createElement(Text, { key, style: styles.emphasis }, renderInlineNodes(nodeChildren(node), key));
    }
    if (node.type === 'inlineCode') {
      return createElement(Text, { key, style: styles.inlineCode }, node.value ?? '');
    }
    if (node.type === 'inlineMath') {
      return createElement(Text, { key, style: styles.inlineMath }, latexToUnicode(node.value ?? ''));
    }
    if (node.type === 'link') {
      const label = flattenToText(nodeChildren(node));
      const href = node.url ?? '';
      const suffix = href ? ` (${href})` : '';
      return createElement(Text, { key }, `${label}${suffix}`);
    }
    if (node.type === 'break') {
      return createElement(Text, { key }, '\n');
    }
    if (node.type === 'html') {
      return createElement(Text, { key }, node.value ?? '');
    }
    if (node.type === 'delete') {
      return createElement(Text, { key }, renderInlineNodes(nodeChildren(node), key));
    }
    return createElement(Text, { key }, flattenToText([node]));
  });
}

function renderListItem(item: MdNode, itemPrefix: string, bulletPrefix: string): ReactNode {
  const blocks = nodeChildren(item);
  const firstParagraph = blocks.find((child) => child.type === 'paragraph');
  const firstParagraphText = firstParagraph ? flattenToText(nodeChildren(firstParagraph)) : '';
  const remainingBlocks = blocks.filter((child) => child !== firstParagraph);
  return createElement(
    View,
    { key: itemPrefix, style: styles.listItem },
    createElement(Text, null, `${bulletPrefix}${firstParagraphText}`),
    ...remainingBlocks.map((child, index) => renderBlockNode(child, `${itemPrefix}-nested-${index}`)),
  );
}

function renderTableNode(node: MdNode, keyPrefix: string): ReactNode {
  const rows = nodeChildren(node);
  return createElement(
    View,
    { key: keyPrefix, style: styles.table },
    ...rows.map((row, rowIndex) => {
      const cells = nodeChildren(row);
      return createElement(
        View,
        { key: `${keyPrefix}-row-${rowIndex}`, style: styles.tableRow },
        ...cells.map((cell, cellIndex) =>
          createElement(
            Text,
            {
              key: `${keyPrefix}-row-${rowIndex}-cell-${cellIndex}`,
              style: rowIndex === 0 ? { ...styles.tableCell, ...styles.tableHeaderCell } : styles.tableCell,
            },
            flattenToText(nodeChildren(cell)),
          ),
        ),
      );
    }),
  );
}

function renderBlockNode(node: MdNode, keyPrefix: string): ReactNode | null {
  if (node.type === 'paragraph') {
    return createElement(Text, { key: keyPrefix, style: styles.paragraph }, renderInlineNodes(nodeChildren(node), keyPrefix));
  }
  if (node.type === 'heading') {
    const depth = node.depth ?? 6;
    return createElement(
      Text,
      { key: keyPrefix, style: { ...styles.heading, fontSize: headingSizes[depth] ?? 10 } },
      renderInlineNodes(nodeChildren(node), keyPrefix),
    );
  }
  if (node.type === 'list') {
    const ordered = Boolean(node.ordered);
    const start = node.start ?? 1;
    return createElement(
      View,
      { key: keyPrefix, style: styles.list },
      ...nodeChildren(node).map((item, index) => {
        const bulletPrefix = ordered ? `${start + index}. ` : '• ';
        return renderListItem(item, `${keyPrefix}-item-${index}`, bulletPrefix);
      }),
    );
  }
  if (node.type === 'code') {
    return createElement(
      View,
      { key: keyPrefix, style: styles.codeBlockContainer },
      createElement(Text, { style: styles.codeBlockText }, node.value ?? ''),
    );
  }
  if (node.type === 'blockquote') {
    return createElement(
      View,
      { key: keyPrefix, style: styles.blockquote },
      ...nodeChildren(node).map((child, index) => renderBlockNode(child, `${keyPrefix}-quote-${index}`)),
    );
  }
  if (node.type === 'thematicBreak') {
    return createElement(View, { key: keyPrefix, style: styles.thematicBreak });
  }
  if (node.type === 'table') {
    return renderTableNode(node, keyPrefix);
  }
  if (node.type === 'math') {
    // Block math visual layout is intentionally deferred; we render raw source as deterministic monospace fallback.
    warnBlockMathFallbackOnce();
    return createElement(Text, { key: keyPrefix, style: styles.mathBlock }, node.value ?? '');
  }
  if (node.type === 'html') {
    return createElement(Text, { key: keyPrefix, style: styles.paragraph }, node.value ?? '');
  }
  if (node.type === 'text') {
    return createElement(Text, { key: keyPrefix, style: styles.paragraph }, node.value ?? '');
  }
  const children = nodeChildren(node);
  if (children.length === 0) {
    return null;
  }
  return createElement(
    View,
    { key: keyPrefix },
    ...children.map((child, index) => renderBlockNode(child, `${keyPrefix}-child-${index}`)),
  );
}

export function renderMarkdownToPdf(markdownSource: string): ReactNode[] {
  const root = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(markdownSource) as MdNode;
  return nodeChildren(root)
    .map((node, index) => renderBlockNode(node, `md-block-${index}`))
    .filter((node): node is ReactNode => node !== null);
}
