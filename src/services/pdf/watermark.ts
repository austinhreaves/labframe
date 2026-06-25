// The diagonal page watermark is a single rotated line. react-pdf lays the text
// out within the page-width box *before* rotating it, so a long student name
// wraps to several rows that then overlap once rotated. Sizing the font to the
// string length keeps it on one row, and capping the name length keeps the font
// from shrinking below a readable size. The footer still carries the full name.

/** Largest watermark font; used for short strings. */
const MAX_WATERMARK_FONT = 60;
/** Smallest watermark font so long names stay legible. */
const MIN_WATERMARK_FONT = 22;
/** Target pre-rotation line width (pt), inside the A4 page width (~595pt). */
const TARGET_LINE_WIDTH = 540;
/** Rough average glyph advance as a fraction of font size for this text. */
const AVG_GLYPH_RATIO = 0.62;

/** Font size that keeps `text` on a single line within the page width. */
export function watermarkFontSize(text: string): number {
  const fitted = Math.floor(TARGET_LINE_WIDTH / (Math.max(text.length, 1) * AVG_GLYPH_RATIO));
  return Math.max(MIN_WATERMARK_FONT, Math.min(MAX_WATERMARK_FONT, fitted));
}

/** Caps the name used in the diagonal watermark (ellipsis when over `max`). */
export function truncateName(name: string, max = 28): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}
