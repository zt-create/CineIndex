interface SpinnerProps {
  label?: string;
}

/** 加载占位。 */
export function Spinner({ label = '加载中…' }: SpinnerProps) {
  return (
    <p className="spinner" role="status" aria-live="polite">
      <span className="spinner__dot" aria-hidden="true" />
      {label}
    </p>
  );
}
