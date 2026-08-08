import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ResponseCurve } from './ResponseCurve';
import styles from './MedicationDetail.module.css';
import {
  medicationRegimen,
  medTimeline,
  compliance30Days,
  medChangeHistory,
} from '../../data/mockData';
import { useResponsive } from '../../hooks/useResponsive';
import type { MedTimelineStatus, MedChangeRecord } from '../../types/dashboard';

const metaItems = [
  { label: '频率', value: medicationRegimen.frequency },
  { label: '给药途径', value: medicationRegimen.route },
  { label: '生效日期', value: medicationRegimen.effectiveDate, mono: true },
  { label: '处方医生', value: medicationRegimen.doctor },
];

export const MedicationDetail: React.FC = () => {
  const { isDesktop } = useResponsive();
  const [timeline, setTimeline] = useState(medTimeline);

  const handleConfirm = (id: string) => {
    setTimeline((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'done' as MedTimelineStatus } : m))
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.row1}>
        {/* 区块1：当前用药方案 */}
        <Card className={styles.card}>
          <div className={styles.regimenTop}>
            <div className={styles.regimenTitle}>
              <h2 className={styles.regimenName}>{medicationRegimen.name}</h2>
              <p
                className={styles.regimenDose}
                style={{ fontSize: isDesktop ? 'var(--text-display)' : 'var(--text-h3)' }}
              >
                {medicationRegimen.dosage}
              </p>
              <p className={styles.regimenFreq}>{medicationRegimen.frequency}</p>
            </div>
            <Badge variant={medicationRegimen.badgeVariant}>{medicationRegimen.badgeLabel}</Badge>
          </div>

          {isDesktop && (
            <div className={styles.regimenMeta}>
              {metaItems.map((item) => (
                <div key={item.label} className={styles.metaItem}>
                  <span className={styles.metaLabel}>{item.label}</span>
                  <p
                    className={styles.metaValue}
                    style={{ fontFamily: item.mono ? 'var(--font-mono)' : undefined }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className={styles.regimenTiming}>
            <span className={styles.timingLabel}>服药时间</span>
            <div className={styles.timingPills}>
              {medicationRegimen.timings.map((t) => (
                <span
                  key={t}
                  className={`${styles.timingPill} ${
                    t === medicationRegimen.currentTiming ? styles.timingPillCurrent : ''
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* 区块2：今日用药时间轴 */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>今日用药时间轴</h3>
            {isDesktop && <span className={styles.cardSubtitle}>2026-07-25 · 共 4 次</span>}
          </div>

          <div className={styles.timeline}>
            {timeline.map((item, idx) => (
              <div key={item.id} className={styles.timelineItem}>
                <div className={styles.timelineRail}>
                  <span
                    className={`${styles.timelineDot} ${styles[`dot_${item.status}`]}`}
                    aria-hidden="true"
                  />
                  {idx < timeline.length - 1 && <span className={styles.timelineLine} />}
                </div>
                <div
                  className={`${styles.timelineCard} ${styles[`card_${item.status}`]}`}
                >
                  <div className={styles.timelineCardTop}>
                    <span className={styles.timelineTime}>{item.time}</span>
                    {item.status === 'done' && <Badge variant="on">已确认</Badge>}
                    {item.status === 'pending' && <Badge variant="on">待确认</Badge>}
                    {item.status === 'future' && <span className={styles.futureLabel}>未到</span>}
                    <span className={styles.timelineMed}>
                      {item.name} {item.dosage}
                    </span>
                  </div>
                  {item.status === 'pending' && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleConfirm(item.id)}
                      className={styles.confirmBtn}
                    >
                      确认服药
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.row1}>
        {/* 区块3：响应曲线 */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>响应曲线 · 15:00 用药</h3>
              <span className={styles.cardSubtitle}>用药后 120 分钟振幅变化</span>
            </div>
          </div>
          <ResponseCurve />
        </Card>

        {/* 区块4：依从性统计 */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>依从性统计</h3>
              {isDesktop && <span className={styles.cardSubtitle}>近 30 天用药依从数据</span>}
            </div>
          </div>
          <div className={styles.complianceRow}>
            <div className={styles.donutWrap}>
              <svg viewBox="0 0 120 120" className={styles.donut} aria-label="7天依从率 92%">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--tg-surface-2)" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--tg-success)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="289.03 314.16"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className={styles.donutCenter}>
                <span className={styles.donutValue}>92%</span>
                <span className={styles.donutLabel}>7天依从</span>
              </div>
            </div>
            <div className={styles.barsWrap}>
              <div className={styles.barsTop}>
                <span className={styles.barsCaption}>30天趋势</span>
                <span className={styles.barsAvg}>平均 90%</span>
              </div>
              <svg viewBox="0 0 125 105" className={styles.bars} preserveAspectRatio="none" aria-label="30天依从率柱状图">
                {compliance30Days.map((v, i) => {
                  const h = (v / 100) * 80;
                  const isToday = i === compliance30Days.length - 2;
                  return (
                    <rect
                      key={i}
                      x={i * 4 + 1}
                      y={85 - h}
                      width="3"
                      height={h}
                      rx="1"
                      fill={isToday ? 'var(--tg-success)' : 'var(--tg-primary)'}
                    />
                  );
                })}
              </svg>
              <div className={styles.barsBottom}>
                <span>30天前</span>
                <span>今天</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 区块5：方案变更记录 */}
      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>方案变更记录</h3>
            <span className={styles.cardSubtitle}>完整用药调整历史 · 共 3 次变更</span>
          </div>
          {isDesktop && (
            <button className={styles.exportBtn} type="button">
              <Download size={14} /> 导出
            </button>
          )}
        </div>

        {isDesktop ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>类型</th>
                  <th>变更内容</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {medChangeHistory.map((rec: MedChangeRecord) => (
                  <tr key={rec.id}>
                    <td className={styles.cellDate}>{rec.date}</td>
                    <td>
                      <Badge variant={rec.typeVariant === 'muted' ? 'off' : rec.typeVariant}>
                        {rec.typeLabel}
                      </Badge>
                    </td>
                    <td>
                      {rec.from && <span className={styles.cellFrom}>{rec.from} → </span>}
                      <span className={styles.cellTo}>{rec.to}</span>
                    </td>
                    <td className={styles.cellNote}>{rec.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.changeList}>
            {medChangeHistory.map((rec) => (
              <div key={rec.id} className={styles.changeItem}>
                <div className={styles.changeItemTop}>
                  <span className={styles.cellDate}>{rec.date}</span>
                  <Badge variant={rec.typeVariant === 'muted' ? 'off' : rec.typeVariant}>
                    {rec.typeLabel}
                  </Badge>
                </div>
                <div className={styles.changeItemContent}>
                  {rec.from && <span className={styles.cellFrom}>{rec.from} → </span>}
                  <span className={styles.cellTo}>{rec.to}</span>
                </div>
                <p className={styles.cellNote}>{rec.note}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
