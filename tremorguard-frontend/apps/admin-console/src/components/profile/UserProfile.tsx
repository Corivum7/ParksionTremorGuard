import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Shield,
  Download,
  Pill,
  HelpCircle,
  Info,
  ChevronRight,
  Watch,
  Phone,
  LogOut,
} from 'lucide-react';
import styles from './UserProfile.module.css';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { StatusDot } from '../common/StatusDot';
import {
  userProfile,
  healthSummary,
  deviceStatus,
  careTeam,
  settingItems,
} from '../../data/mockData';
import type { HealthSummaryCell, CareTeamMember } from '../../types/dashboard';

const settingIconMap = {
  Bell,
  Shield,
  Download,
  Pill,
  HelpCircle,
  Info,
} as const;

const healthValueColorMap: Record<HealthSummaryCell['variant'], string> = {
  primary: 'var(--tg-primary)',
  ink: 'var(--tg-ink)',
  success: 'var(--tg-success)',
};

const avatarVariantStyles: Record<
  CareTeamMember['avatarVariant'],
  React.CSSProperties
> = {
  primary: { background: 'var(--tg-primary-light)', color: 'var(--tg-primary-dark)' },
  secondary: { background: 'var(--tg-secondary-light)', color: 'var(--tg-secondary)' },
};

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Section 1：Profile Header */}
      <header className={styles.profileHeader}>
        <div className={styles.avatar} aria-hidden="true">
          {userProfile.avatarText}
        </div>
        <h1 className={styles.name}>{userProfile.name}</h1>
        <p className={styles.patientId}>{userProfile.patientId}</p>
        <p className={styles.basicInfo}>{userProfile.basicInfo}</p>
        <p className={styles.diagnoseDate}>{userProfile.diagnoseDate}</p>
      </header>

      {/* Section 2：健康摘要 */}
      <Card className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>健康摘要</h3>
          <button
            type="button"
            className={styles.headerLink}
            onClick={() => navigate('/trend')}
          >
            <span>查看趋势</span>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.healthGrid}>
          {healthSummary.map((cell) => (
            <div key={cell.id} className={styles.healthCell}>
              <div className={styles.healthLabel}>{cell.label}</div>
              <div
                className={styles.healthValue}
                style={{ color: healthValueColorMap[cell.variant] }}
              >
                {cell.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 3：设备状态 */}
      <Card className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>设备状态</h3>
          <button type="button" className={styles.headerLink}>
            <span>管理</span>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.deviceBody}>
          <div className={styles.deviceInfo}>
            <div className={styles.deviceNameRow}>
              <span className={styles.deviceName}>{deviceStatus.name}</span>
              <Badge variant="on">
                <StatusDot variant="success" size={8} />
                已绑定
              </Badge>
            </div>
            <div className={styles.deviceBattery}>
              电量 {deviceStatus.battery}%
            </div>
            <div className={styles.deviceMeta}>
              最后同步: {deviceStatus.lastSync}
            </div>
            <div className={styles.deviceId}>设备ID: {deviceStatus.deviceId}</div>
          </div>
          <div className={styles.deviceIcon} aria-hidden="true">
            <Watch size={32} stroke="var(--tg-muted)" strokeWidth={1.5} />
          </div>
        </div>
        <div
          className={styles.batteryTrack}
          role="progressbar"
          aria-label="设备电量"
          aria-valuenow={deviceStatus.battery}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={styles.batteryFill}
            style={{ width: `${deviceStatus.battery}%` }}
          />
        </div>
      </Card>

      {/* Section 4：关怀团队 */}
      <Card className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>关怀团队</h3>
          <button type="button" className={styles.headerLink}>
            <span>编辑</span>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.careList}>
          {careTeam.map((member) => (
            <div key={member.id} className={styles.careItem}>
              <div
                className={styles.careAvatar}
                style={avatarVariantStyles[member.avatarVariant]}
                aria-hidden="true"
              >
                {member.avatarText}
              </div>
              <div className={styles.careInfo}>
                <div className={styles.careName}>{member.name}</div>
                <div className={styles.careRelation}>{member.relation}</div>
                <div className={styles.carePhone}>{member.phone}</div>
              </div>
              <button
                type="button"
                className={styles.callButton}
                aria-label={`拨打 ${member.name} 的电话`}
              >
                <Phone size={20} stroke="var(--tg-success)" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 5：设置项列表 */}
      <Card className={styles.settingsCard} ariaLabel="设置项列表">
        {settingItems.map((item) => {
          const Icon = settingIconMap[item.icon as keyof typeof settingIconMap];
          return (
            <button
              key={item.id}
              type="button"
              className={styles.settingsItem}
            >
              <Icon size={24} stroke="var(--tg-muted)" strokeWidth={2} />
              <span className={styles.settingsLabel}>{item.label}</span>
              <ChevronRight size={20} stroke="var(--tg-muted)" strokeWidth={2} />
            </button>
          );
        })}
      </Card>

      {/* Section 6：退出登录 */}
      <button type="button" className={styles.logoutButton}>
        <LogOut size={20} stroke="currentColor" strokeWidth={2} />
        <span>退出登录</span>
      </button>
    </div>
  );
};
