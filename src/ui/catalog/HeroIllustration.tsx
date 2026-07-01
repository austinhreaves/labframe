/**
 * The large "ink and graph" catalog hero that used to live here was superseded
 * by the compact start-screen motif (src/ui/catalog/StartMotif.tsx) when the
 * start screen replaced the catalog grid; only the logo mark remains.
 */

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
