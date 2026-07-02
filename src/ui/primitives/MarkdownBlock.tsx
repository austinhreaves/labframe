import ReactMarkdown from 'react-markdown';
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Components } from 'react-markdown';

type MarkdownBlockProps = {
  markdown: string;
  /**
   * Render a single newline as a hard line break (remark-breaks) instead of the
   * markdown default where a lone newline collapses to a space. Used for
   * free-form student answers (the equation editor); lab instructions keep the
   * default soft-wrap behaviour so authored markdown renders conventionally.
   */
  breaks?: boolean;
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
    // react-markdown's AST includes whitespace-only text nodes around block
    // children (e.g. the newline between `<blockquote>` and its `<p>`); skip
    // those to find the actual first paragraph and its real index.
    const firstChildIndex = flat.findIndex(
      (child) => !(typeof child === 'string' && child.trim() === ''),
    );
    const firstChild = firstChildIndex === -1 ? undefined : flat[firstChildIndex];
    const firstParagraphChildren = isValidElement(firstChild)
      ? (firstChild.props as { children?: ReactNode }).children
      : null;
    const paragraphFlat = Array.isArray(firstParagraphChildren)
      ? firstParagraphChildren
      : [firstParagraphChildren];
    const firstText = typeof paragraphFlat[0] === 'string' ? paragraphFlat[0] : null;
    const match = firstText ? firstText.match(CALLOUT_PATTERN) : null;
    if (!match || !isValidElement(firstChild) || !firstText) {
      return <blockquote>{children}</blockquote>;
    }
    const label = (match[1] ?? 'NOTE').toUpperCase();
    const nextFirstText = firstText.replace(CALLOUT_PATTERN, '').trimStart();
    const patchedFirst = cloneElement(
      firstChild as ReactElement,
      undefined,
      nextFirstText,
      ...paragraphFlat.slice(1),
    );
    // Drop the leading whitespace text node(s) before the paragraph and keep the
    // rest; this preserves react-markdown's element keys (avoiding duplicate-key
    // warnings) instead of re-emitting the whitespace siblings.
    const normalizedChildren = [patchedFirst, ...flat.slice(firstChildIndex + 1)];
    return (
      <aside className={`markdown-callout ${calloutVariant(label)}`}>
        <span className="markdown-callout-title">{label}</span>
        <div>{normalizedChildren}</div>
      </aside>
    );
  },
};

export function MarkdownBlock({ markdown, breaks = false }: MarkdownBlockProps) {
  const remarkPlugins = breaks ? [remarkGfm, remarkMath, remarkBreaks] : [remarkGfm, remarkMath];
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={[[rehypeSanitize, instructionSchema], rehypeKatex]}
      components={markdownComponents}
    >
      {normalizeDisplayMath(markdown)}
    </ReactMarkdown>
  );
}

export default MarkdownBlock;
