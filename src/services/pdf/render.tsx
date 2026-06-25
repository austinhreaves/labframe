import type { Course, Lab, LabAnswers } from '@/domain/schema';

type RenderPDFArgs = {
  lab: Lab;
  answers: LabAnswers;
  course: Course;
  /** Image bytes as data URLs keyed by image id, for embedding in the PDF. */
  images?: Record<string, string> | undefined;
} & ({ mode: 'signed'; signature: string; signedAt: number } | { mode: 'draft' });

export async function renderPDF(args: RenderPDFArgs): Promise<Uint8Array> {
  const [{ pdf }, { LabReportDocument }, { registerPdfFonts }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/services/pdf/Document'),
    import('@/services/pdf/registerFonts'),
  ]);
  registerPdfFonts();
  const document =
    args.mode === 'signed' ? (
      <LabReportDocument lab={args.lab} answers={args.answers} course={args.course} imageData={args.images} mode="signed" signature={args.signature} signedAt={args.signedAt} />
    ) : (
      <LabReportDocument lab={args.lab} answers={args.answers} course={args.course} imageData={args.images} mode="draft" />
    );
  const instance = pdf(document);
  const blob = await instance.toBlob();
  const buffer = await new Response(blob).arrayBuffer();
  return new Uint8Array(buffer);
}
