import React from 'react';
import { Activity, CheckCircle, Clock, type LucideIcon } from 'lucide-react';
import { Card } from '../common/Card';
import styles from './QuickStatsGrid.module.css';
import { quickStats } from '../../data/mockData';
import type { QuickStat } from '../../types/dashboard';

const iconComponents: Record<string, LucideIcon> = {
  Activity,
  CheckCircle,
  Clock,
};

const iconStyles: Record<string, string> = {
  primary: styles.iconPrimary,
  success: styles.iconSuccess,
  secondary: styles.iconSecondary,
};

export const QuickStatsGrid: React.FC = () => {
  return (
    <section className={styles.grid} aria-label="快速统计">
      {quickStats.map((stat: QuickStat) => {
        const IconComponent = iconComponents[stat.icon];
        
        return (
          <Card key={stat.id} className={styles.statCard}>
            <div className={styles.statHead}>
              <span className={`${styles.statIcon} ${iconStyles[stat.variant]}`} aria-hidden="true">
                {IconComponent && <IconComponent size={22} />}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statUnit}>{stat.unit}</span>
            </div>
            <span className={styles.statCaption}>{stat.caption}</span>
          </Card>
        );
      })}
    </section>
  );
};
