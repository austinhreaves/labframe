type ProgressProps = {
  value: number;
  max: number;
  label?: string;
  size?: 'sm' | 'md';
};

export function Progress({ value, max, label, size = 'sm' }: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const clampedValue = Math.max(0, Math.min(value, safeMax));
  const percent = (clampedValue / safeMax) * 100;
  return (
    <div className="progress" data-size={size}>
      {label ? <span className="progress-label">{label}</span> : null}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
