import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Components } from 'react-markdown';

type MarkdownBlockProps = {
  markdown: string;
};

const instructionSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'sub', 'sup'],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', 'language-math', 'math-inline', 'math-display'],
    ],
  },
};

const CALLOUT_PATTERN = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*\n?/i;

// remark-math only treats `$$...$$` as *display* math when the delimiters sit on
// their own lines. Lab content authors display equations on a single line
// (`$$ ... $$`), which remark-math parses as *inline* math; KaTeX then rejects
// display-only commands like `\tag`, leaking them as raw red text. Expand any line
// that is wholly a `$$...$$` block into the multiline form before parsing so it
// renders as a proper display equation.
const DISPLAY_MATH_LINE = /^[ \t]*\$\$(.+?)\$\$[ \t]*$/gm;

function normalizeDisplayMath(markdown: string): string {
  return markdown.replace(DISPLAY_MATH_LINE, (_full, body: string) => `$$\n${body.trim()}\n$$`);
}

function calloutVariant(label: string): string {
  switch (label.toUpperCase()) {
    case 'TIP':
      return 'markdown-callout-tip';
    case 'WARNING':
      return 'markdown-callout-warning';
    case 'IMPORTANT':
      return 'markdown-callout-important';
    case 'CAUTION':
      return 'markdown-callout-caution';
    default:
      return 'markdown-callout-note';
  }
}

const markdownComponents: Components = {
  blockquote({ children }) {
    const flat = Array.isArray(children) ? children : [children];
    const firstChild = flat[0];
    const firstParagraph =
      firstChild && typeof firstChild === 'object' && 'props' in firstChild
        ? (firstChild.props as { children?: ReactNode }).children
        : null;
    const firstText =
      typeof firstParagraph === 'string'
        ? firstParagraph
        : Array.isArray(firstParagraph) && typeof firstParagraph[0] === 'string'
          ? firstParagraph[0]
          : null;
    const match = firstText ? firstText.match(CALLOUT_PATTERN) : null;
    if (!match) {
      return <blockquote>{children}</blockquote>;
    }
    const label = (match[1] ?? 'NOTE').toUpperCase();
    const nextFirstText = firstText?.replace(CALLOUT_PATTERN, '').trimStart() ?? '';
    let normalizedChildren = children;
    if (
      nextFirstText !== firstText &&
      firstChild &&
      typeof firstChild === 'object' &&
      'props' in firstChild
    ) {
      const patchedFirst = {
        ...firstChild,
        props: {
          ...(firstChild.props as Record<string, unknown>),
          children: nextFirstText,
        },
      } as unknown as ReactNode;
      normalizedChildren = [patchedFirst, ...flat.slice(1)];
    }
    return (
      <aside className={`markdown-callout ${calloutVariant(label)}`}>
        <span className="markdown-callout-title">{label}</span>
        <div>{normalizedChildren}</div>
      </aside>
    );
  },
};

export function MarkdownBlock({ markdown }: MarkdownBlockProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeSanitize, instructionSchema], rehypeKatex]}
      components={markdownComponents}
    >
      {normalizeDisplayMath(markdown)}
    </ReactMarkdown>
  );
}

export default MarkdownBlock;
