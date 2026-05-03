import type { LucideIcon, LucideProps } from 'lucide-react';

type IconProps = Omit<LucideProps, 'size' | 'strokeWidth'> & {
  icon: LucideIcon;
  size?: number;
};

export function Icon({ icon: LucideComponent, size = 18, 'aria-label': ariaLabel, ...rest }: IconProps) {
  const decorative = !ariaLabel;
  return (
    <LucideComponent
      size={size}
      strokeWidth={1.5}
      aria-hidden={decorative}
      role={decorative ? 'presentation' : 'img'}
      {...(!decorative ? { 'aria-label': ariaLabel } : {})}
      {...rest}
    />
  );
}
