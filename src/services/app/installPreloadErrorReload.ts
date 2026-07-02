const RELOAD_SENTINEL_KEY = 'labframe.preload-reload';

/**
 * Recover from stale-deploy chunk failures.
 *
 * The PDF export and draft paths lazily import hashed chunks (render, fonts,
 * @react-pdf/renderer). After a redeploy, Vercel serves only the newest build,
 * so an already-open tab requesting an old chunk hash 404s and the import
 * rejects with "Failed to fetch dynamically imported module". Vite fires
 * `vite:preloadError` for exactly this case; reloading pulls a fresh index.html
 * with the current chunk hashes.
 *
 * Worksheet state autosaves to IndexedDB, so the reload is non-destructive; the
 * student re-clicks export afterward. A sessionStorage sentinel caps this at one
 * reload so a genuinely broken deploy or an offline client cannot loop.
 */
export function installPreloadErrorReload(): void {
  window.addEventListener('vite:preloadError', (event) => {
    // Stop Vite from also throwing the unhandled rejection we are handling here.
    event.preventDefault();

    let alreadyReloaded = false;
    try {
      alreadyReloaded = sessionStorage.getItem(RELOAD_SENTINEL_KEY) === '1';
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_SENTINEL_KEY, '1');
      }
    } catch {
      // sessionStorage can throw in private-mode / storage-disabled contexts;
      // fall through and reload once without loop protection.
    }

    if (!alreadyReloaded) {
      window.location.reload();
    }
  });

  // A successful load means chunks resolved; clear the sentinel so a future
  // stale-deploy event is allowed to trigger its own single reload.
  window.addEventListener('load', () => {
    try {
      sessionStorage.removeItem(RELOAD_SENTINEL_KEY);
    } catch {
      // ignore
    }
  });
}
