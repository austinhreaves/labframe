import { PDFDocument, StandardFonts, type PDFPage } from 'pdf-lib';

type SealArgs = {
  canonical: string;
  signature: string;
  signedAt: number;
  title: string;
};

function drawFooter(page: PDFPage, text: string): void {
  const { width } = page.getSize();
  page.drawText(text, {
    x: 24,
    y: 14,
    size: 9,
  });
  page.drawLine({
    start: { x: 24, y: 28 },
    end: { x: width - 24, y: 28 },
    thickness: 0.5,
  });
}

export async function sealPDF(inputBytes: Uint8Array, args: SealArgs): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(inputBytes);
  pdfDoc.setTitle(args.title);
  pdfDoc.setProducer('LabFrame');
  pdfDoc.setCreator('LabFrame');
  pdfDoc.setSubject('Signed Lab Report');
  pdfDoc.setKeywords(['lab-report', 'signed', args.signature.slice(0, 8)]);
  pdfDoc.setCreationDate(new Date(args.signedAt));
  pdfDoc.setModificationDate(new Date(args.signedAt));

  await pdfDoc.embedFont(StandardFonts.Helvetica);
  const footer = `Signed: ${new Date(args.signedAt).toISOString()} - ${args.signature.slice(0, 8)}`;
  for (const page of pdfDoc.getPages()) {
    drawFooter(page, footer);
  }

  await pdfDoc.attach(args.canonical, 'lab.json', {
    mimeType: 'application/json',
    description: 'Canonical signed lab answers',
    creationDate: new Date(args.signedAt),
    modificationDate: new Date(args.signedAt),
  });

  const outputBytes = await pdfDoc.save({
    useObjectStreams: false,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  return outputBytes;
}
