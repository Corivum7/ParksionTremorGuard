import React from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  hasNotification?: boolean;
  size?: number;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  ariaLabel,
  hasNotification = false,
  size = 44,
  className = '',
}) => {
  const buttonStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minHeight: 'var(--touch-min)',
  };

  return (
    <button
      className={`${styles.iconButton} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      style={buttonStyle}
    >
      {children}
      {hasNotification && <span className={styles.notifDot} aria-hidden="true" />}
    </button>
  );
};
