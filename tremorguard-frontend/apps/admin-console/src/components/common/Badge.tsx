import React from 'react';

type BadgeVariant = 'on' | 'off' | 'danger' | 'info' | 'accent' | 'success' | 'warning';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  on: { background: 'var(--tg-success-light)', color: 'var(--tg-success)' },
  off: { background: 'var(--tg-warning-light)', color: 'var(--tg-warning)' },
  danger: { background: 'var(--tg-danger-light)', color: 'var(--tg-danger)' },
  info: { background: 'var(--tg-secondary-light)', color: 'var(--tg-secondary)' },
  accent: { background: 'var(--tg-accent-light)', color: 'var(--tg-accent)' },
  success: { background: 'var(--tg-success-light)', color: 'var(--tg-success)' },
  warning: { background: 'var(--tg-warning-light)', color: 'var(--tg-warning)' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'on',
  className = '',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: '2px var(--space-sm)',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <span
      className={className}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {children}
    </span>
  );
};
