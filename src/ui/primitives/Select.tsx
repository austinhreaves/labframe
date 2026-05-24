import { ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  invalid?: boolean;
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  size = 'md',
  invalid,
  name,
  ...aria
}: SelectProps) {
  return (
    <span className="select" data-size={size} data-invalid={invalid || undefined}>
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby']}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="select-chevron" />
    </span>
  );
}
