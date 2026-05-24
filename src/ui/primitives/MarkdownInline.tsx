import { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Components } from 'react-markdown';

const inlineSchema = {
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

const passthrough = ({ children }: { children?: React.ReactNode }) => (
  <Fragment>{children}</Fragment>
);

const inlineComponents: Components = {
  p: passthrough,
  h1: passthrough,
  h2: passthrough,
  h3: passthrough,
  h4: passthrough,
  h5: passthrough,
  h6: passthrough,
  ul: passthrough,
  ol: passthrough,
  li: passthrough,
  blockquote: passthrough,
  pre: passthrough,
  hr: () => null,
};

type MarkdownInlineProps = {
  markdown: string;
};

export function MarkdownInline({ markdown }: MarkdownInlineProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeSanitize, inlineSchema], rehypeKatex]}
      components={inlineComponents}
    >
      {markdown}
    </ReactMarkdown>
  );
}

export default MarkdownInline;
