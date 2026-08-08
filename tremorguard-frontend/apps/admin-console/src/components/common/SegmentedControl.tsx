import React from 'react';
import styles from './SegmentedControl.module.css';

export interface SegOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  variant?: 'container' | 'pill';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  ariaLabel,
  variant = 'container',
}) => {
  return (
    <div
      className={`${styles.wrapper} ${variant === 'pill' ? styles.pillWrapper : ''}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.option} ${variant === 'pill' ? styles.pill : ''} ${
              isActive ? (variant === 'pill' ? styles.pillActive : styles.active) : ''
            }`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
