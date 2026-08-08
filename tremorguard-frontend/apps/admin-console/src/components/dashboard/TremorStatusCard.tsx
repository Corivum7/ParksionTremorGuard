import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { StatusDot } from '../common/StatusDot';
import styles from './TremorStatusCard.module.css';
import { useDashboardStore } from '../../store/dashboardStore';

export const TremorStatusCard: React.FC = () => {
  const { tremorData } = useDashboardStore();

  const sparklinePath = generateSparklinePath(tremorData.hourlyData);
  const sparklineAreaPath = generateSparklineArea(tremorData.hourlyData);

  return (
    <Card
      className={styles.heroCard}
      pressable
      ariaLabel="震颤状态详情"
    >
      <div className={styles.headerRow}>
        <div className={styles.statusGroup}>
          <Badge variant="on">ON 状态</Badge>
          <StatusDot variant="success" />
        </div>
        <span className={styles.peakInfo}>
          峰值 {tremorData.peakTime} · {tremorData.peakAmplitude}g
        </span>
      </div>

      <div>
        <div className={styles.amplitudeRow}>
          <span className={styles.amplitudeValue}>
            {tremorData.averageAmplitude.toFixed(2)}
          </span>
          <span className={styles.amplitudeUnit}>{tremorData.unit}</span>
        </div>
        <span className={styles.amplitudeCaption}>
          平均振幅 · 最后更新 {tremorData.lastUpdated}
        </span>
      </div>

      <svg
        className={styles.sparkline}
        viewBox="0 0 340 60"
        preserveAspectRatio="none"
        role="img"
        aria-label="24小时震颤振幅趋势图"
      >
        <line x1="85" y1="0" x2="85" y2="60" stroke="var(--tg-secondary)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        <line x1="143" y1="0" x2="143" y2="60" stroke="var(--tg-secondary)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        <line x1="197" y1="0" x2="197" y2="60" stroke="var(--tg-secondary)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        <line x1="255" y1="0" x2="255" y2="60" stroke="var(--tg-secondary)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        
        <path d={sparklineAreaPath} fill="var(--tg-primary)" opacity="0.1" />
        <path
          d={sparklinePath}
          fill="none"
          stroke="var(--tg-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        <circle cx="198" cy="18" r="3" fill="var(--tg-danger)" />
      </svg>

      <div className={styles.axisRow}>
        <span className={styles.axisLabel}>00:00</span>
        <span className={styles.axisLabel}>24:00</span>
      </div>
    </Card>
  );
};

function generateSparklinePath(data: number[]): string {
  const width = 340;
  const height = 60;
  const maxVal = Math.max(...data);
  const step = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const y = height - (val / maxVal) * (height - 10) - 5;
    return { x, y };
  });

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  return path;
}

function generateSparklineArea(data: number[]): string {
  const linePath = generateSparklinePath(data);
  return `${linePath} L 340,60 L 0,60 Z`;
}
