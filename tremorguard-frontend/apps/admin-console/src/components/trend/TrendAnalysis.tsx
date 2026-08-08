import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Toggle } from '../common/Toggle';
import { SegmentedControl } from '../common/SegmentedControl';
import { useResponsive } from '../../hooks/useResponsive';
import { TremorChart } from './TremorChart';
import { trendStats, anomalyEvents } from '../../data/mockData';
import type { TrendStat, AnomalyEvent } from '../../types/dashboard';
import styles from './TrendAnalysis.module.css';

const mobileOptions = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'quarter', label: '3月' },
];

const desktopOptions = [
  { id: 'day', label: '今日' },
  { id: 'week', label: '7天' },
  { id: 'month', label: '30天' },
  { id: 'quarter', label: '90天' },
];

const variantColor: Record<TrendStat['variant'], string> = {
  ink: 'var(--tg-ink)',
  accent: 'var(--tg-accent)',
  success: 'var(--tg-success)',
  warning: 'var(--tg-warning)',
  danger: 'var(--tg-danger)',
};

export const TrendAnalysis: React.FC = () => {
  const { isDesktop } = useResponsive();
  const [range, setRange] = useState<string>('day');
  const [medOverlay, setMedOverlay] = useState<boolean>(true);

  const options = isDesktop ? desktopOptions : mobileOptions;
  const segVariant = isDesktop ? 'pill' : 'container';

  return (
    <div className={styles.page}>
      {/* Block 1: 时间范围分段控件 */}
      <section className={styles.block}>
        <SegmentedControl
          options={options}
          value={range}
          onChange={setRange}
          ariaLabel="时间范围"
          variant={segVariant}
        />
      </section>

      {/* Block 2: 振幅趋势图卡片 */}
      <section className={styles.block}>
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <h2 className={styles.chartTitle}>振幅趋势</h2>
              <span className={styles.chartSubtitle}>单位 g · 0:00 – 24:00</span>
            </div>
            <div className={styles.chartToggle}>
              <span className={styles.chartToggleLabel}>用药叠加</span>
              <Toggle
                checked={medOverlay}
                onChange={setMedOverlay}
                ariaLabel="切换用药叠加显示"
              />
            </div>
          </div>
          <TremorChart medOverlay={medOverlay} />
        </Card>
      </section>

      {/* Block 3: 统计概览网格 */}
      <section className={styles.block}>
        <div className={styles.statsGrid}>
          {trendStats.map((stat: TrendStat) => (
            <div
              key={stat.id}
              className={isDesktop ? styles.statCard : styles.metricCard}
            >
              <span className={styles.statLabel}>{stat.label}</span>
              <div className={styles.statValueRow}>
                <span
                  className={
                    isDesktop ? styles.statValueDesktop : styles.statValueMobile
                  }
                  style={{ color: variantColor[stat.variant] }}
                >
                  {stat.value}
                </span>
                <span className={styles.statUnit}>{stat.unit}</span>
              </div>
              {isDesktop && stat.trend && (
                <span className={styles.statTrend}>{stat.trend}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Block 4: 异常事件列表 */}
      <section className={styles.block}>
        <div className={styles.eventsHeader}>
          <h2 className={styles.eventsTitle}>异常事件</h2>
          <span className={styles.eventsCount}>
            今日 {anomalyEvents.length} 条
          </span>
        </div>
        {isDesktop ? (
          <div className={styles.eventsListDesktop}>
            {anomalyEvents.map((evt: AnomalyEvent) => (
              <div key={evt.id} className={styles.eventRow}>
                <div className={styles.eventMain}>
                  <span className={styles.eventTime}>{evt.time}</span>
                  <Badge variant={evt.badgeVariant}>{evt.badge}</Badge>
                  <span className={styles.eventDesc}>{evt.desc}</span>
                </div>
                <div className={styles.eventRight}>
                  <span className={styles.eventValue}>{evt.value}</span>
                  <ChevronRight size={18} className={styles.eventChevron} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.eventsListMobile}>
            {anomalyEvents.map((evt: AnomalyEvent) => (
              <Card key={evt.id} pressable className={styles.eventCardMobile}>
                <div className={styles.eventCardTop}>
                  <span className={styles.eventTime}>{evt.time}</span>
                  <Badge variant={evt.badgeVariant}>{evt.badge}</Badge>
                  <span className={styles.eventValueMobile}>{evt.value}</span>
                  <ChevronRight size={18} className={styles.eventChevron} />
                </div>
                <span className={styles.eventDescMobile}>{evt.desc}</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
