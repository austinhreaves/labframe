import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { Section } from '@/domain/schema';
import { buildTocEntries } from '@/domain/tocEntries';
import { Icon } from '@/ui/primitives/Icon';

type Props = {
  sections: Section[];
};

const PANEL_MARGIN_PX = 12;
const GAP_BELOW_TRIGGER_PX = 4;
const PANEL_MAX_REM = 22;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TableOfContents({ sections }: Props) {
  const tocEntries = useMemo(() => buildTocEntries(sections), [sections]);
  const tocIdSet = useMemo(() => new Set(tocEntries.map((entry) => entry.id)), [tocEntries]);

  const [activeId, setActiveId] = useState<string>(() => tocEntries[0]?.id ?? '');
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelLayout, setPanelLayout] = useState<{ left: number; top: number; width: number } | null>(null);

  useEffect(() => {
    if (tocEntries[0]?.id) {
      setActiveId(tocEntries[0].id);
    }
  }, [tocEntries]);

  useEffect(() => {
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && tocIdSet.has(id)) {
          setActiveId(id);
        }
      },
      {
        root: null,
        rootMargin: '-96px 0px -60% 0px',
        threshold: [0.1, 0.4, 0.7],
      },
    );

    for (let index = 0; index < sections.length; index += 1) {
      const target = document.getElementById(`section-${index}`);
      if (target) {
        observer.observe(target);
      }
    }

    return () => observer.disconnect();
  }, [sections, tocIdSet]);

  const layoutPanel = useCallback(() => {
    const details = detailsRef.current;
    const summary = summaryRef.current;
    if (!details?.open || !summary) {
      setPanelLayout(null);
      return;
    }

    // Measure the summary specifically — measuring the <details> element instead
    // would include the in-flow panel content while it's briefly inline (before
    // this effect promotes it to position: fixed), causing the panel to jump far
    // below the sticky header on first open.
    const rect = summary.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const preferredWidth = PANEL_MAX_REM * rootFontSize;
    const width = Math.min(preferredWidth, viewportWidth - 2 * PANEL_MARGIN_PX);
    const left = clamp(rect.left, PANEL_MARGIN_PX, viewportWidth - PANEL_MARGIN_PX - width);
    const top = rect.bottom + GAP_BELOW_TRIGGER_PX;

    setPanelLayout({ left, top, width });
  }, []);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) {
      return;
    }

    const onToggle = () => setMenuOpen(details.open);
    details.addEventListener('toggle', onToggle);
    return () => details.removeEventListener('toggle', onToggle);
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setPanelLayout(null);
      return;
    }
    layoutPanel();
  }, [layoutPanel, menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onViewportChange = () => layoutPanel();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [layoutPanel, menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && details.contains(target)) {
        return;
      }
      details.open = false;
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [menuOpen]);

  return (
    <details ref={detailsRef} className="table-of-contents-popover">
      <summary ref={summaryRef}>
        Sections
        <Icon icon={ChevronDown} size={14} className="icon-chevron" />
      </summary>
      <nav
        className="table-of-contents-popover-panel"
        aria-label="Table of contents"
        style={
          panelLayout
            ? {
                position: 'fixed',
                left: panelLayout.left,
                top: panelLayout.top,
                width: panelLayout.width,
                visibility: 'visible',
              }
            : { position: 'fixed', visibility: 'hidden', pointerEvents: 'none' }
        }
      >
        <ul>
          {tocEntries.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                title={entry.label}
                aria-current={activeId === entry.id ? 'location' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  const target = document.getElementById(entry.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.replaceState(null, '', `#${entry.id}`);
                  }
                }}
              >
                {entry.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
