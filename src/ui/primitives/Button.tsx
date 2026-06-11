import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Shows a spinner and ignores clicks while keeping the button focusable. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Square aspect for icon-only buttons; pair with an aria-label. */
  iconOnly?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    fullWidth = false,
    iconOnly = false,
    className,
    children,
    onClick,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : null,
    iconOnly ? 'btn-icon-only' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : leadingIcon}
      {children ? <span className="btn-label">{children}</span> : null}
      {trailingIcon}
    </button>
  );
});
