import React from 'react';
import styles from './Dashboard.module.css';
import { TremorStatusCard } from './TremorStatusCard';
import { AIInsightCard } from './AIInsightCard';
import { AlertPrompt } from './AlertPrompt';
import { MedicationTimeline } from './MedicationTimeline';
import { QuickStatsGrid } from './QuickStatsGrid';

export const Dashboard: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.row1}>
        <TremorStatusCard />
        <div className={styles.row1Right}>
          <AIInsightCard />
          <AlertPrompt />
        </div>
      </div>

      <div className={styles.row2}>
        <MedicationTimeline />
      </div>

      <div className={styles.row3}>
        <QuickStatsGrid />
      </div>
    </div>
  );
};
