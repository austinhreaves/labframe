import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

type PrepareDraftPdfArgs = {
  title: string;
  /** Canonical LabDoc JSON for imported (authored) labs; embedded so a draft
   *  PDF is self-describing (and future restore-from-PDF can read it). */
  labDoc?: string;
};

export async function prepareDraftPdf(
  inputBytes: Uint8Array,
  args: PrepareDraftPdfArgs,
): Promise<Uint8Array> {
  if (!(inputBytes instanceof Uint8Array)) {
    throw new Error('Could not generate draft PDF (invalid render output). Try again.');
  }

  const pdfDoc = await PDFDocument.load(inputBytes);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  pdfDoc.setTitle(args.title);
  pdfDoc.setProducer('LabFrame');
  pdfDoc.setCreator('LabFrame');
  pdfDoc.setSubject('DRAFT - not for submission');
  pdfDoc.setKeywords(['lab-report', 'draft']);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const label = 'DRAFT';
    const fontSize = Math.min(width, height) * 0.18;
    const textWidth = helveticaBold.widthOfTextAtSize(label, fontSize);
    page.drawText(label, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font: helveticaBold,
      color: rgb(0.82, 0.1, 0.1),
      opacity: 0.14,
      rotate: degrees(35),
    });
  }

  if (args.labDoc) {
    const labDocBytes = new Uint8Array(await new Response(args.labDoc).arrayBuffer());
    await pdfDoc.attach(labDocBytes, 'lab.labframe.json', {
      mimeType: 'application/json',
      description: 'Authored lab definition (LabDoc)',
    });
  }

  const outputBytes = await pdfDoc.save({
    useObjectStreams: false,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  return outputBytes;
}
