import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

type CheckboxProps = {
  id?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  children: ReactNode;
};

export function Checkbox({ id, checked, onChange, disabled, invalid, children }: CheckboxProps) {
  return (
    <label className="checkbox" data-invalid={invalid || undefined} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="checkbox-box" aria-hidden="true">
        <Check className="checkbox-check" />
      </span>
      <span className="checkbox-label">{children}</span>
    </label>
  );
}
