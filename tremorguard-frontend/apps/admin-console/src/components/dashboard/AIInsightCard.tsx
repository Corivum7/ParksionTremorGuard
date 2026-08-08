import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from './AIInsightCard.module.css';
import { aiInsight } from '../../data/mockData';

export const AIInsightCard: React.FC = () => {
  return (
    <section className={styles.aiCard} aria-label="AI 洞察">
      <div className={styles.header}>
        <Sparkles size={28} stroke="var(--tg-primary-dark)" strokeWidth={2} />
        <span className={styles.title}>{aiInsight.title}</span>
      </div>
      <p className={styles.message}>{aiInsight.message}</p>
    </section>
  );
};
