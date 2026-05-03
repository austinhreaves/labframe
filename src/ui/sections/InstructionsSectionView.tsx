import type { InstructionsSection } from '@/domain/schema';
import { SectionPointsCaption } from '@/ui/sections/SectionPointsCaption';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

type Props = {
  section: InstructionsSection;
};

const instructionSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'sub', 'sup'],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    code: [...(defaultSchema.attributes?.code ?? []), ['className', 'language-math', 'math-inline', 'math-display']],
  },
};

export function InstructionsSectionView({ section }: Props) {
  return (
    <section className="section section-instructions">
      <SectionPointsCaption points={section.points} />
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, instructionSchema], rehypeKatex]}
      >
        {section.html}
      </ReactMarkdown>
    </section>
  );
}
