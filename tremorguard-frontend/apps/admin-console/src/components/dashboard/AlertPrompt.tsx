import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import styles from './AlertPrompt.module.css';
import { useDashboardStore } from '../../store/dashboardStore';

export const AlertPrompt: React.FC = () => {
  const { alerts } = useDashboardStore();
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  if (unacknowledgedCount === 0) return null;

  return (
    <div
      className={styles.alertCard}
      role="button"
      tabIndex={0}
      aria-label={`${unacknowledgedCount} 条未处理警报，点击查看详情`}
      onClick={() => {}}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
        }
      }}
    >
      <div className={styles.leftContent}>
        <AlertTriangle size={20} stroke="var(--tg-danger)" strokeWidth={2} />
        <span className={styles.alertText}>
          {unacknowledgedCount} 条未处理警报
        </span>
      </div>
      <ChevronRight size={20} stroke="var(--tg-danger)" strokeWidth={2} />
    </div>
  );
};
