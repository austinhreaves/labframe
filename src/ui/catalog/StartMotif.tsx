/**
 * Compact start-screen header motif: a charge dipole (+ ink, - spark) with two
 * field-line curves, one dashed connector animating from + to -, and a slow
 * amber sine drifting left. Decorative only (aria-hidden). Colors come from
 * theme tokens via CSS custom properties; both ambient animations live in
 * main.css and pause under prefers-reduced-motion.
 *
 * The sine path spans one full wavelength (64px) beyond each edge of the
 * viewBox so the -64px waveMove translate loops with no visible jump. If the
 * wavelength changes, keep the translate equal to exactly one wavelength.
 */
export function StartMotif() {
  return (
    <svg
      className="start-motif"
      viewBox="0 0 220 92"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id="start-motif-arrow"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path className="start-motif-arrowhead" d="M 0 0 L 8 4 L 0 8 Z" />
        </marker>
      </defs>

      {/* Field-line curves between the charges */}
      <g className="start-motif-field">
        <path d="M 62 24 C 90 4, 138 4, 166 24" />
        <path d="M 62 44 C 90 64, 138 64, 166 44" />
      </g>

      {/* Dashed connector animating from + to -, arrowhead at the - end */}
      <path className="start-motif-dash" d="M 66 34 L 148 34" markerEnd="url(#start-motif-arrow)" />

      {/* Charges: + ink (accent), - spark (amber) */}
      <g>
        <circle className="start-motif-halo-pos" cx="48" cy="34" r="20" />
        <circle className="start-motif-charge-pos" cx="48" cy="34" r="13" />
        <path className="start-motif-glyph-pos" d="M 42.5 34 H 53.5 M 48 28.5 V 39.5" />
      </g>
      <g>
        <circle className="start-motif-halo-neg" cx="172" cy="34" r="20" />
        <circle className="start-motif-charge-neg" cx="172" cy="34" r="13" />
        <path className="start-motif-glyph-neg" d="M 166.5 34 H 177.5" />
      </g>

      {/* Slow sine drift, one wavelength (64px) per loop */}
      <g className="start-motif-wave-clip">
        <path
          className="start-motif-wave"
          d="M -60 76 Q -44 62 -28 76 T 4 76 T 36 76 T 68 76 T 100 76 T 132 76 T 164 76 T 196 76 T 228 76 T 260 76 T 292 76"
        />
      </g>
    </svg>
  );
}
