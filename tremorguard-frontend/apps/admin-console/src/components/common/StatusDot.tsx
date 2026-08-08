import React from 'react';

type DotVariant = 'success' | 'warning' | 'danger' | 'primary';

interface StatusDotProps {
  variant?: DotVariant;
  size?: number;
  className?: string;
}

const variantColors: Record<DotVariant, string> = {
  success: 'var(--tg-success)',
  warning: 'var(--tg-warning)',
  danger: 'var(--tg-danger)',
  primary: 'var(--tg-primary)',
};

export const StatusDot: React.FC<StatusDotProps> = ({
  variant = 'success',
  size = 8,
  className = '',
}) => {
  const style: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: 'var(--radius-pill)',
    backgroundColor: variantColors[variant],
    display: 'inline-block',
    flexShrink: 0,
  };

  return <span className={className} style={style} aria-hidden="true" />;
};
