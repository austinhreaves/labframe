import { Font } from '@react-pdf/renderer';

import dejaVuSans from './fonts/DejaVuSans.ttf';
import dejaVuSansBold from './fonts/DejaVuSans-Bold.ttf';
import dejaVuSansOblique from './fonts/DejaVuSans-Oblique.ttf';

/** Document font family for the exported PDF. */
export const PDF_FONT_FAMILY = 'DejaVu Sans';

let registered = false;

/**
 * Register the bundled DejaVu Sans family for PDF export.
 *
 * react-pdf's built-in standard-14 fonts (Helvetica/Courier) only cover Latin-1,
 * so any unicode the math converter emits beyond it (subscripts, most
 * superscripts, operators like the approximately-equal sign, Greek letters)
 * renders as missing or wrong glyphs. DejaVu Sans covers the full set. Loaded
 * only on the export path and registered once.
 */
export function registerPdfFonts(): void {
  if (registered) {
    return;
  }
  registered = true;
  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: dejaVuSans },
      { src: dejaVuSansBold, fontWeight: 700 },
      { src: dejaVuSansOblique, fontStyle: 'italic' },
    ],
  });
}
