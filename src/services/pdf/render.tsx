import type { Course, Lab, LabAnswers } from '@/domain/schema';

type RenderPDFArgs = {
  lab: Lab;
  answers: LabAnswers;
  course: Course;
} & ({ mode: 'signed'; signature: string; signedAt: number } | { mode: 'draft' });

export async function renderPDF(args: RenderPDFArgs): Promise<Uint8Array> {
  const [{ pdf }, { LabReportDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/services/pdf/Document'),
  ]);
  const document =
    args.mode === 'signed' ? (
      <LabReportDocument lab={args.lab} answers={args.answers} course={args.course} mode="signed" signature={args.signature} signedAt={args.signedAt} />
    ) : (
      <LabReportDocument lab={args.lab} answers={args.answers} course={args.course} mode="draft" />
    );
  const instance = pdf(document);
  const blob = await instance.toBlob();
  const buffer = await new Response(blob).arrayBuffer();
  return new Uint8Array(buffer);
}
