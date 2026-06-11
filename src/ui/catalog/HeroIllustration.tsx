/**
 * Hand-authored hero art: a charge dipole with field lines, a dimension
 * callout for the separation r, and a sine trace, drawn in the "ink and
 * graph" style. Decorative only (aria-hidden). All colors come from theme
 * tokens via CSS custom properties; the draw-in animation lives in main.css
 * and is disabled under prefers-reduced-motion.
 */
export function HeroIllustration() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 560 372"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ruler ticks along the bottom edge */}
      <g className="hero-art-ruler">
        {Array.from({ length: 19 }, (_, i) => {
          const x = 28 + i * 28;
          const major = i % 4 === 0;
          return <line key={x} x1={x} y1={major ? 354 : 358} x2={x} y2={364} />;
        })}
      </g>

      {/* Field lines: + at (150,130), - at (410,130) */}
      <g className="hero-art-field">
        <path
          className="hero-draw"
          pathLength={1}
          d="M 180 130 L 380 130"
          style={{ animationDelay: '120ms' }}
        />
        <path
          className="hero-draw"
          pathLength={1}
          d="M 174 116 C 222 74, 338 74, 386 116"
          style={{ animationDelay: '220ms' }}
        />
        <path
          className="hero-draw"
          pathLength={1}
          d="M 174 144 C 222 186, 338 186, 386 144"
          style={{ animationDelay: '260ms' }}
        />
        <path
          className="hero-draw hero-art-field-far"
          pathLength={1}
          d="M 166 110 C 215 20, 345 20, 394 110"
          style={{ animationDelay: '340ms' }}
        />
        <path
          className="hero-draw hero-art-field-far"
          pathLength={1}
          d="M 166 150 C 215 240, 345 240, 394 150"
          style={{ animationDelay: '380ms' }}
        />
      </g>
      <g className="hero-art-escape">
        <path
          className="hero-draw"
          pathLength={1}
          d="M 128 118 C 92 98, 62 88, 28 80"
          style={{ animationDelay: '460ms' }}
        />
        <path
          className="hero-draw"
          pathLength={1}
          d="M 128 142 C 92 162, 62 172, 28 180"
          style={{ animationDelay: '500ms' }}
        />
        <path
          className="hero-draw"
          pathLength={1}
          d="M 432 118 C 468 98, 498 88, 532 80"
          style={{ animationDelay: '540ms' }}
        />
        <path
          className="hero-draw"
          pathLength={1}
          d="M 432 142 C 468 162, 498 172, 532 180"
          style={{ animationDelay: '580ms' }}
        />
      </g>

      {/* Direction arrows on the inner field lines */}
      <g className="hero-art-arrows">
        <path
          className="hero-pop"
          d="M 272 124 L 286 130 L 272 136 Z"
          style={{ animationDelay: '700ms' }}
        />
        <path
          className="hero-pop"
          d="M 272 78.5 L 286 84.5 L 272 90.5 Z"
          style={{ animationDelay: '760ms' }}
        />
        <path
          className="hero-pop"
          d="M 272 169.5 L 286 175.5 L 272 181.5 Z"
          style={{ animationDelay: '820ms' }}
        />
      </g>

      {/* Dimension callout for the separation r */}
      <g className="hero-art-measure hero-pop" style={{ animationDelay: '880ms' }}>
        <line x1="150" y1="164" x2="150" y2="252" />
        <line x1="410" y1="164" x2="410" y2="252" />
        <line className="hero-art-measure-line" x1="158" y1="246" x2="402" y2="246" />
        <path className="hero-art-measure-arrow" d="M 150 246 L 161 241.5 L 161 250.5 Z" />
        <path className="hero-art-measure-arrow" d="M 410 246 L 399 241.5 L 399 250.5 Z" />
        <text x="280" y="238" textAnchor="middle">
          r
        </text>
      </g>

      {/* Charges */}
      <g className="hero-pop" style={{ animationDelay: '60ms' }}>
        <circle className="hero-art-halo-pos" cx="150" cy="130" r="40" />
        <circle className="hero-art-charge-pos" cx="150" cy="130" r="26" />
        <path className="hero-art-glyph-pos" d="M 140 130 H 160 M 150 120 V 140" />
      </g>
      <g className="hero-pop" style={{ animationDelay: '140ms' }}>
        <circle className="hero-art-halo-neg" cx="410" cy="130" r="40" />
        <circle className="hero-art-charge-neg" cx="410" cy="130" r="26" />
        <path className="hero-art-glyph-neg" d="M 400 130 H 420" />
      </g>

      {/* Sine trace */}
      <path
        className="hero-draw hero-art-wave"
        pathLength={1}
        style={{ animationDelay: '640ms', animationDuration: '1100ms' }}
        d="M 28 312 C 43.3 299.4, 54.7 290, 70 290 C 85.3 290, 96.7 299.4, 112 312 C 127.3 324.6, 138.7 334, 154 334 C 169.3 334, 180.7 324.6, 196 312 C 211.3 299.4, 222.7 290, 238 290 C 253.3 290, 264.7 299.4, 280 312 C 295.3 324.6, 306.7 334, 322 334 C 337.3 334, 348.7 324.6, 364 312 C 379.3 299.4, 390.7 290, 406 290 C 421.3 290, 432.7 299.4, 448 312 C 463.3 324.6, 474.7 334, 490 334 C 505.3 334, 516.7 324.6, 532 312"
      />
    </svg>
  );
}

/** Small "wave in a frame" logo mark used in headers and the footer. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="logo-mark-tile" x="1" y="1" width="22" height="22" rx="6" />
      <path
        className="logo-mark-wave"
        d="M 5 12 C 6.8 7.6, 9.2 7.6, 11 12 C 12.8 16.4, 15.2 16.4, 17 12"
      />
      <circle className="logo-mark-dot" cx="19.2" cy="9.4" r="1.6" />
    </svg>
  );
}
