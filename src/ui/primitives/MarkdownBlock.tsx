import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

type MarkdownBlockProps = {
  markdown: string;
};

const instructionSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'sub', 'sup'],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    code: [...(defaultSchema.attributes?.code ?? []), ['className', 'language-math', 'math-inline', 'math-display']],
  },
};

export function MarkdownBlock({ markdown }: MarkdownBlockProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeSanitize, instructionSchema], rehypeKatex]}>
      {markdown}
    </ReactMarkdown>
  );
}

export default MarkdownBlock;
