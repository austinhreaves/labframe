import type { Course, Lab, LabAnswers } from '@/domain/schema';

type RenderPDFArgs = {
  lab: Lab;
  answers: LabAnswers;
  course: Course;
  signature: string;
  signedAt: number;
};

export async function renderPDF(args: RenderPDFArgs): Promise<Uint8Array> {
  const [{ pdf }, { LabReportDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/services/pdf/Document'),
  ]);
  const instance = pdf(
    <LabReportDocument
      lab={args.lab}
      answers={args.answers}
      course={args.course}
      signature={args.signature}
      signedAt={args.signedAt}
    />,
  );
  const blob = await instance.toBlob();
  const buffer = await new Response(blob).arrayBuffer();
  return new Uint8Array(buffer);
}
