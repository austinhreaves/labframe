import { TEXT_SIZES, type TextSize } from '@/ui/viewSettings';

type Props = {
  value: TextSize;
  onChange: (size: TextSize) => void;
};

/** Pass 7: the worksheet Text size control (Aa S / M / L). */
export function TextSizeToggle({ value, onChange }: Props) {
  return (
    <div className="text-size-toggle" role="group" aria-label="Text size">
      <span className="text-size-toggle-icon" aria-hidden="true">
        Aa
      </span>
      {TEXT_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          aria-pressed={value === size}
          aria-label={`Text size ${size}`}
          onClick={() => onChange(size)}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
