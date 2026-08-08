import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  pressable?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  pressable = false,
  onClick,
  className = '',
  ariaLabel,
}) => {
  const classes = [
    styles.card,
    pressable ? styles.pressable : '',
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </article>
  );
};
