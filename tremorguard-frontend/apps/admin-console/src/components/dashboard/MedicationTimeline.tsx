import React, { useCallback } from 'react';
import { Check, Circle } from 'lucide-react';
import { Card } from '../common/Card';
import styles from './MedicationTimeline.module.css';
import { useDashboardStore } from '../../store/dashboardStore';

export const MedicationTimeline: React.FC = () => {
  const { medications, markMedicationTaken } = useDashboardStore();

  const handleNodeClick = useCallback(
    (id: string, status: string) => {
      if (status === 'pending') {
        markMedicationTaken(id);
      }
    },
    [markMedicationTaken]
  );

  return (
    <Card className={styles.container} aria-label="今日用药">
      <div className={styles.header}>
        <h2 className={styles.title}>今日用药</h2>
        <span className={styles.compliance}>依从率 92%</span>
      </div>

      <div className={styles.timeline}>
        {medications.map((med, index) => (
          <React.Fragment key={med.id}>
            <div className={styles.node}>
              <button
                className={`${styles.nodeBtn} ${
                  med.status === 'done'
                    ? styles.nodeBtnDone
                    : med.status === 'pending'
                    ? styles.nodeBtnPending
                    : styles.nodeBtnFuture
                }`}
                onClick={() => handleNodeClick(med.id, med.status)}
                aria-label={`${med.time} ${med.name} ${
                  med.status === 'done' ? '已服用' : med.status === 'pending' ? '待服用' : '未到时间'
                }`}
              >
                {med.status === 'done' ? (
                  <Check size={20} strokeWidth={3} />
                ) : med.status === 'pending' ? (
                  <Circle size={16} fill="var(--tg-primary)" strokeWidth={0} />
                ) : (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--tg-border)',
                      display: 'inline-block',
                    }}
                  />
                )}
              </button>
              <span
                className={`${styles.time} ${
                  med.status === 'pending' ? styles.timeActive : ''
                }`}
              >
                {med.time}
              </span>
              <span
                className={`${styles.status} ${
                  med.status === 'pending'
                    ? styles.statusActive
                    : med.status === 'future'
                    ? styles.statusMuted
                    : ''
                }`}
              >
                {med.status === 'done' ? '已服' : med.status === 'pending' ? '待服' : '未到'}
              </span>
            </div>
            {index < medications.length - 1 && (
              <div
                className={`${styles.line} ${
                  medications[index + 1].status === 'done' || med.status === 'done'
                    ? styles.lineDone
                    : ''
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};
