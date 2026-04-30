type LayoutMode = 'side' | 'tabs';

type Props = {
  layout: LayoutMode;
  onChange: (layout: LayoutMode) => void;
};

export function LayoutToggle({ layout, onChange }: Props) {
  return (
    <div className="layout-toggle">
      <button type="button" onClick={() => onChange('side')} aria-pressed={layout === 'side'}>
        Side by side
      </button>
      <button type="button" onClick={() => onChange('tabs')} aria-pressed={layout === 'tabs'}>
        Tabs
      </button>
    </div>
  );
}
