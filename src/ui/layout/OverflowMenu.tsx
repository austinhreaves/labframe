import { useEffect, useRef } from 'react';
import { Check, MoreHorizontal } from 'lucide-react';

import { Icon } from '@/ui/primitives/Icon';

export type OverflowItem = {
  label: string;
  onSelect: () => void;
};

export type OverflowRadioGroup = {
  /** Group heading, e.g. "View". */
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
};

type Props = {
  items: OverflowItem[];
  /** Optional single-select group rendered above the action items (e.g. View). */
  radioGroup?: OverflowRadioGroup;
  /** Accessible name for the trigger. */
  label?: string;
};

/**
 * Pass 4: the toolbar `...` overflow that folds low-priority chrome. A native
 * `<details>` popover, matching the TableOfContents idiom. The sticky header
 * sets `overflow-x: clip`, which leaves vertical overflow visible, so the
 * right-aligned panel can open downward out of the bar. It can lead with a
 * single-select radio group (the View switcher) above the plain action items.
 */
export function OverflowMenu({ items, radioGroup, label = 'More options' }: Props) {
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
      <div className="overflow-menu-panel">
        {radioGroup ? (
          <div className="overflow-menu-group" role="group" aria-label={radioGroup.label}>
            <p className="overflow-menu-group-label">{radioGroup.label}</p>
            {radioGroup.options.map((option) => {
              const selected = option.value === radioGroup.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    close();
                    radioGroup.onSelect(option.value);
                  }}
                >
                  <span className="overflow-menu-check" aria-hidden="true">
                    {selected ? <Icon icon={Check} size={14} /> : null}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <ul className="overflow-menu-list" role="menu">
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
      </div>
    </details>
  );
}
