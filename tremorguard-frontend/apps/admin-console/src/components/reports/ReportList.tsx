import React, { useState, useMemo } from 'react';
import {
  Calendar,
  BarChart3,
  FileText,
  AlertTriangle,
  Loader2,
  Eye,
  Share2,
  Check,
} from 'lucide-react';
import styles from './ReportList.module.css';
import { Badge } from '../common/Badge';
import { reportFilters, reports, generatingReport } from '../../data/mockData';
import { useResponsive } from '../../hooks/useResponsive';
import type { Report } from '../../types/dashboard';

const iconMap = {
  calendar: Calendar,
  barChart: BarChart3,
  fileText: FileText,
  alertTriangle: AlertTriangle,
} as const;

export const ReportList: React.FC = () => {
  const { isDesktop } = useResponsive();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredReports = useMemo(() => {
    if (activeFilter === 'all') return reports;
    return reports.filter((r) => r.type === activeFilter);
  }, [activeFilter]);

  return (
    <div className={styles.container}>
      {/* Block 1：筛选 Chip 条 */}
      <div className={styles.filterRow} role="tablist" aria-label="报告筛选">
        {reportFilters.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span className={styles.chipLabel}>{filter.label}</span>
              <span
                className={`${styles.chipCount} ${active ? styles.chipCountActive : ''}`}
              >
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Block 2：生成中横幅 */}
      <section
        className={styles.banner}
        aria-live="polite"
        aria-label="报告生成进度"
      >
        <div className={styles.bannerIcon} aria-hidden="true">
          <Loader2 size={22} strokeWidth={2.5} />
        </div>
        <div className={styles.bannerContent}>
          <div className={styles.bannerHeader}>
            <span className={styles.bannerText}>{generatingReport.text}</span>
            <span className={styles.bannerEta}>{generatingReport.eta}</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={generatingReport.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${generatingReport.progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Block 3：报告卡片网格 */}
      <div className={styles.grid}>
        {filteredReports.map((report) => (
          <ReportCardItem
            key={report.id}
            report={report}
            showActions={isDesktop}
          />
        ))}
      </div>

      {/* Block 4：底部 Footer（桌面独有） */}
      {isDesktop && (
        <footer className={styles.footer}>
          共 {reports.length} 份报告 · 最后更新 2026-07-24 14:30
        </footer>
      )}
    </div>
  );
};

const ReportCardItem: React.FC<{
  report: Report;
  showActions: boolean;
}> = ({ report, showActions }) => {
  const Icon = iconMap[report.icon];

  return (
    <article className={styles.reportCard}>
      <div className={styles.iconWrap} style={{ background: report.iconBg }}>
        <Icon size={22} stroke="#ffffff" strokeWidth={2} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{report.title}</h3>
          <Badge variant={report.typeVariant}>{report.typeLabel}</Badge>
        </div>
        <p className={styles.cardDate}>{report.date}</p>
        <p className={styles.cardMetrics}>{report.metrics}</p>
        {report.shared && (
          <div className={styles.sharedRow}>
            <Check size={14} stroke="var(--tg-success)" strokeWidth={2.5} />
            <span className={styles.sharedText}>已分享</span>
          </div>
        )}
        {!showActions && (
          <div className={styles.mobileLinks}>
            <button
              type="button"
              className={`${styles.textLink} ${styles.textLinkPrimary}`}
            >
              <Eye size={14} />
              <span>查看</span>
            </button>
            <button
              type="button"
              className={`${styles.textLink} ${styles.textLinkSecondary}`}
            >
              <Share2 size={14} />
              <span>分享</span>
            </button>
          </div>
        )}
      </div>

      {showActions && (
        <div className={styles.cardActions}>
          <button type="button" className={styles.viewBtn}>
            <Eye size={14} />
            <span>查看</span>
          </button>
          <button type="button" className={styles.shareBtn}>
            <Share2 size={14} />
            <span>分享</span>
          </button>
        </div>
      )}
    </article>
  );
};
