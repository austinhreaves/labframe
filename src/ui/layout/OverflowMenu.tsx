import { useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Icon } from '@/ui/primitives/Icon';

export type OverflowItem = {
  label: string;
  onSelect: () => void;
};

type Props = {
  items: OverflowItem[];
  /** Accessible name for the trigger. */
  label?: string;
};

/**
 * Pass 4: the toolbar `...` overflow that folds low-priority chrome (About,
 * Take the tour). A native `<details>` popover, matching the TableOfContents
 * idiom. The sticky header sets `overflow-x: clip`, which leaves vertical
 * overflow visible, so the right-aligned panel can open downward out of the bar.
 */
export function OverflowMenu({ items, label = 'More options' }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!details.open) {
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
  }, []);

  const close = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef} className="overflow-menu">
      <summary aria-label={label}>
        <Icon icon={MoreHorizontal} size={18} />
      </summary>
      <ul className="overflow-menu-panel" role="menu">
        {items.map((item) => (
          <li key={item.label} role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
