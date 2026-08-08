import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileText, Check } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatusDot } from '../common/StatusDot';
import { TremorCurve } from './TremorCurve';
import { useResponsive } from '../../hooks/useResponsive';
import { alertHeader, triggerConditions, interventionNodes } from '../../data/mockData';
import type { TriggerCondition, InterventionNode } from '../../types/dashboard';
import styles from './AlertDetail.module.css';

const triggerValueStyle = (variant: TriggerCondition['variant']): React.CSSProperties => {
  if (variant === 'danger') return { color: 'var(--tg-danger)' };
  if (variant === 'muted') return { color: 'var(--tg-muted)' };
  return { color: 'var(--tg-ink)' };
};

const dotColorMap: Record<InterventionNode['dotVariant'], string> = {
  danger: 'var(--tg-danger)',
  secondary: 'var(--tg-secondary)',
  success: 'var(--tg-success)',
  muted: 'var(--tg-muted)',
};

const dotStyleFor = (variant: InterventionNode['dotVariant']): React.CSSProperties => {
  const base: React.CSSProperties = {
    background: dotColorMap[variant],
  };
  if (variant === 'danger') {
    base.boxShadow = '0 0 0 3px var(--tg-danger-light)';
  }
  return base;
};

export const AlertDetail: React.FC = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Row 1: 警报头卡 */}
      {isMobile ? (
        <Card className={styles.headerCardMobile} ariaLabel="警报详情">
          <div className={styles.severityBar} aria-hidden="true" />
          <div className={styles.headerTop}>
            <AlertTriangle size={48} stroke="var(--tg-danger)" strokeWidth={2} />
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.headerTitleMobile}>{alertHeader.title}</h1>
              <div className={styles.headerBadgeRow}>
                <Badge variant="danger">
                  <span className={styles.dotDangerPulse} aria-hidden="true" />
                  {alertHeader.badge}
                </Badge>
              </div>
            </div>
          </div>
          <div className={styles.headerStatsMobile}>
            <div className={styles.statBlockMobile}>
              <span className={styles.statLabel}>触发时间</span>
              <span className={styles.statValueMono}>{alertHeader.triggerTime}</span>
            </div>
            <div className={styles.statBlockMobile}>
              <span className={styles.statLabel}>持续时长</span>
              <span className={styles.statValueMono}>{alertHeader.duration}</span>
            </div>
          </div>
        </Card>
      ) : (
        <section className={styles.headerCardDesktop} aria-label="警报详情">
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <AlertTriangle size={32} stroke="var(--tg-danger)" strokeWidth={2} />
            </div>
            <h1 className={styles.headerTitleDesktop}>{alertHeader.title}</h1>
            <Badge variant="danger">高危</Badge>
            <Badge variant="danger">
              <span className={styles.dotDangerPulse} aria-hidden="true" />
              {alertHeader.badge}
            </Badge>
          </div>
          <div className={styles.headerStatsDesktop}>
            <div className={styles.statBlockDesktop}>
              <span className={styles.statLabelDesktop}>触发时间</span>
              <span className={styles.statValueDesktop}>{alertHeader.triggerTime}</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.statBlockDesktop}>
              <span className={styles.statLabelDesktop}>持续</span>
              <span className={styles.statValueDesktop}>{alertHeader.duration}</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.statBlockDesktop}>
              <span className={styles.statLabelDesktop}>振幅峰值</span>
              <span className={styles.statValueDesktopDanger}>{alertHeader.peakValue}</span>
            </div>
          </div>
        </section>
      )}

      {/* Row 2: 震颤曲线 + 触发条件 */}
      <div className={styles.row2}>
        <Card className={styles.curveCard}>
          <TremorCurve />
        </Card>
        <Card className={styles.triggerCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <h3 className={styles.cardTitle}>触发条件</h3>
              <span className={styles.cardSubtitle}>满足任一条件即触发警报</span>
            </div>
            <Badge variant="danger">已超限</Badge>
          </div>
          <div className={styles.triggerList}>
            {triggerConditions.map((cond, index) => (
              <div
                key={cond.id}
                className={`${styles.triggerRow} ${
                  index === triggerConditions.length - 1 ? styles.triggerRowLast : ''
                }`}
              >
                <span className={styles.triggerLabel}>{cond.label}</span>
                <span className={styles.triggerValue} style={triggerValueStyle(cond.variant)}>
                  {cond.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: 干预记录 */}
      <Card className={styles.interventionCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h3 className={styles.cardTitle}>干预记录</h3>
            <span className={styles.cardSubtitle}>警报触发至响应处置全流程</span>
          </div>
          <Badge variant="off">
            <StatusDot variant="warning" size={8} />
            追踪中
          </Badge>
        </div>
        {isMobile ? (
          <div className={styles.timelineVertical}>
            {interventionNodes.map((node) => (
              <div
                key={node.id}
                className={`${styles.timelineNodeMobile} ${
                  node.pending ? styles.timelineNodePending : ''
                }`}
              >
                <div className={styles.timelineTrack} aria-hidden="true" />
                <div
                  className={styles.timelineDotMobile}
                  style={dotStyleFor(node.dotVariant)}
                  aria-hidden="true"
                />
                <div className={styles.timelineContentMobile}>
                  <span className={styles.timelineTimeMobile}>{node.time}</span>
                  <span className={styles.timelineTitleMobile}>{node.title}</span>
                  <span className={styles.timelineDescMobile}>{node.desc}</span>
                  <span className={styles.timelineActorMobile}>{node.actor}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.timelineHorizontal}>
            {interventionNodes.map((node, index) => (
              <div
                key={node.id}
                className={`${styles.timelineNodeDesktop} ${
                  node.pending ? styles.timelineNodePending : ''
                }`}
              >
                <div className={styles.timelineMarkerRow}>
                  <div
                    className={styles.timelineDotDesktop}
                    style={dotStyleFor(node.dotVariant)}
                    aria-hidden="true"
                  />
                  {index < interventionNodes.length - 1 && (
                    <div
                      className={`${styles.timelineLineDesktop} ${
                        node.lineDone ? styles.timelineLineDone : ''
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className={styles.timelineContentDesktop}>
                  <span className={styles.timelineTimeDesktop}>{node.time}</span>
                  <span className={styles.timelineTitleDesktop}>{node.title}</span>
                  <span className={styles.timelineDescDesktop}>{node.desc}</span>
                  <span className={styles.timelineActorDesktop}>{node.actor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Row 4: 底部操作栏 */}
      {isMobile ? (
        <div className={styles.actionBarMobile}>
          <Button variant="primary" fullWidth onClick={() => navigate('/reports')}>
            <FileText size={18} />
            生成事件报告
          </Button>
          <Button variant="secondary" fullWidth>
            <Check size={18} />
            标记已处理
          </Button>
        </div>
      ) : (
        <div className={styles.actionBarDesktop}>
          <Button variant="secondary" size="compact" className={styles.actionBtnDesktop}>
            <Check size={16} />
            标记已处理
          </Button>
          <Button
            variant="primary"
            size="compact"
            className={styles.actionBtnDesktop}
            onClick={() => navigate('/reports')}
          >
            <FileText size={16} />
            查看完整报告
          </Button>
        </div>
      )}
    </div>
  );
};
