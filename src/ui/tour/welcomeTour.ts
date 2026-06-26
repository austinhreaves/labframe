import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// Shared pieces of the onboarding tour (Track S of
// docs/specs/ONBOARDING_COURSE_SCOPING_SPEC.md). The tour is two independent
// driver.js instances coordinated by a `?tour=1` URL flag and localStorage:
// Phase A runs on the splash at `/` (see Catalog.tsx) and Phase B runs on the
// demo lab at `/welcome` (see LabPage.tsx). This module holds the bits both
// phases share: storage keys, the platform-specific screenshot hint, the Phase
// B step list, and the deposit logic that decides where the student lands.

export { driver };

/** The demo lab id. Phase B only auto-starts on this lab. */
export const WELCOME_LAB_ID = 'welcome-intro';

export const ONBOARDED_STORAGE_KEY = 'labframe:onboarded';
export const COURSE_STORAGE_KEY = 'labframe:course';
// Set only by the refresher button so the deposit can return the student to the
// lab they were on. Absent means a first-run deposit (land on the course page).
export const TOUR_RETURN_STORAGE_KEY = 'labframe:tour-return';

function safeGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore quota/private-mode write errors; the tour is best-effort.
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }
}

export function isOnboarded(): boolean {
  return safeGet(ONBOARDED_STORAGE_KEY) === '1';
}

/**
 * Mark the student as having seen the tour at least once. Set on completion,
 * Skip tutorial, an Esc-dismiss mid-tour, or dismissing the deep-link toast.
 * Note: localStorage is per-browser, so a new device or incognito window
 * resurfaces the splash. That is consistent with the app's per-browser storage
 * model (the FERPA copy already says work lives in one browser) and accepted.
 */
export function setOnboarded(): void {
  safeSet(ONBOARDED_STORAGE_KEY, '1');
}

export function getPinnedCourseId(): string | null {
  return safeGet(COURSE_STORAGE_KEY);
}

export function stashTourReturn(url: string): void {
  safeSet(TOUR_RETURN_STORAGE_KEY, url);
}

function takeTourReturn(): string | null {
  const value = safeGet(TOUR_RETURN_STORAGE_KEY);
  if (value) {
    safeRemove(TOUR_RETURN_STORAGE_KEY);
  }
  return value;
}

/**
 * The platform-specific screenshot shortcut shown in Phase B step B4. Detected
 * from navigator hints. iPadOS 13+ reports a desktop-class platform, so check
 * touch points to tell an iPad apart from a Mac.
 */
export function screenshotHint(): string {
  if (typeof navigator === 'undefined') {
    return 'Win + Shift + S';
  }
  const ua = navigator.userAgent ?? '';
  const platform = navigator.platform ?? '';
  const isIpad = /iPad/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIpad) {
    return 'Side button + Volume Up';
  }
  if (/Mac/.test(platform) || /Mac/.test(ua)) {
    return 'Cmd + Shift + 4';
  }
  return 'Win + Shift + S';
}

/** The seven Phase B steps. All anchors are guaranteed present on the demo lab. */
export function buildPhaseBSteps(): DriveStep[] {
  return [
    {
      element: '.lab-shell',
      popover: {
        title: 'One page',
        description: 'Everything is on one page: the simulation and your worksheet side by side.',
      },
    },
    {
      element: '.simulation-pane',
      popover: {
        title: 'Run the simulation',
        description: 'Run the simulation here. Drag sliders, adjust parameters, take measurements.',
      },
    },
    {
      element: '.worksheet-pane',
      popover: {
        title: 'Answer the prompts',
        description:
          'Answer the prompts here. Depending on the question, you can type, sketch a diagram, or upload a photo.',
      },
    },
    {
      element: '[data-field-id="screenshot-demo"]',
      popover: {
        title: 'Screenshots',
        description: `When a question asks for a screenshot of the sim, capture it and upload it here. On this device: ${screenshotHint()}.`,
      },
    },
    {
      element: '.lab-save-status',
      popover: {
        title: 'Saved automatically',
        description:
          'Your answers save automatically in this browser. No account needed. Use Save draft to download a backup PDF.',
      },
    },
    {
      element: '[data-tour="export-pdf"]',
      popover: {
        title: 'Export your report',
        description:
          'When you are done, accept the integrity agreement and export your signed PDF here.',
      },
    },
    {
      popover: {
        title: 'Last step',
        description:
          'Upload that PDF to the matching Canvas assignment. LabFrame does not submit for you.',
      },
    },
  ];
}

/**
 * Where the tour lands the student after Phase B. The refresher stashes a return
 * URL, so its presence routes back to the lab they were on; otherwise this is a
 * first-run deposit and the student lands on their scoped course page.
 */
export function depositAfterTour(navigate: (to: string) => void): void {
  const ret = takeTourReturn();
  if (ret) {
    navigate(ret);
    return;
  }
  const pinned = getPinnedCourseId();
  navigate(pinned ? `/c/${pinned}` : '/');
}
