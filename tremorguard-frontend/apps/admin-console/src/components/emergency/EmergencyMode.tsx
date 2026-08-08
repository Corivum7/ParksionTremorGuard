import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import {
  emergencyStatus,
  emergencyContacts,
  emergencyCurvePoints,
} from '../../data/mockData';
import styles from './EmergencyMode.module.css';

/* ===== 内联 SVG 图标 ===== */

const PillIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const HandIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const PhoneAvatarIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

export const EmergencyMode: React.FC = () => {
  const { isMobile } = useResponsive();

  return (
    <div className={`${styles.emergencyOverlay} ${isMobile ? styles.mobile : ''}`}>
      <div className={styles.emergencyContainer}>
        {/* 区块1：状态显示 */}
        <section className={styles.statusSection}>
          <div className={styles.pulseDot} aria-hidden="true" />
          <h1 className={styles.title}>{emergencyStatus.title}</h1>
          <div className={styles.amplitudeDisplay}>
            <span className={styles.amplitudeValue}>{emergencyStatus.value}</span>
            <span className={styles.amplitudeUnit}>{emergencyStatus.unit}</span>
          </div>
          <p className={styles.thresholdText}>
            阈值 {emergencyStatus.threshold} · 超出 {emergencyStatus.exceedPercent}%
          </p>
          <p className={styles.durationText}>{emergencyStatus.duration}</p>
        </section>

        {/* 区块2：主操作按钮 */}
        <section className={styles.actionsSection}>
          <button type="button" className={`${styles.btnEmergency} ${styles.btnMedication}`}>
            <PillIcon />
            我已服药
          </button>
          <button type="button" className={`${styles.btnEmergency} ${styles.btnHelp}`}>
            <HandIcon />
            需要帮助
          </button>
        </section>

        {/* 区块3：通知状态 */}
        <section className={styles.notificationSection}>
          <CheckIcon />
          <span className={styles.notificationText}>
            已通知照护者: {emergencyStatus.caregiverNotified}
          </span>
        </section>

        {/* 区块4：紧急联系人 */}
        <section className={styles.contactsSection}>
          {emergencyContacts.map((contact) => (
            <div key={contact.id} className={styles.contactCard}>
              <div className={styles.contactAvatar}>
                {contact.isHotline ? <PhoneAvatarIcon /> : contact.avatarText}
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactName}>{contact.name}</span>
                <span className={styles.contactRelation}>{contact.relation}</span>
              </div>
              <button type="button" className={styles.contactCallBtn}>
                <PhoneIcon />
                拨打
              </button>
            </div>
          ))}
        </section>

        {/* 区块5：实时震颤曲线 */}
        <section className={styles.curveSection}>
          <div className={styles.curveHeader}>
            <span className={styles.curveLabel}>实时震颤</span>
            <span className={styles.curveThresholdLabel}>阈值 {emergencyStatus.threshold}</span>
          </div>
          <svg
            className={styles.curveSvg}
            viewBox="0 0 600 120"
            preserveAspectRatio="none"
            role="img"
            aria-label="实时震颤曲线"
          >
            <defs>
              <clipPath id="above-threshold">
                <rect x="0" y="0" width="600" height="50" />
              </clipPath>
            </defs>
            {/* 曲线下整体浅色填充 */}
            <polygon
              points={`${emergencyCurvePoints} 600,120 0,120`}
              fill="rgba(255,255,255,0.10)"
            />
            {/* 阈值上方高亮填充（裁剪到 y 0-50） */}
            <polygon
              points={`${emergencyCurvePoints} 600,120 0,120`}
              fill="rgba(255,255,255,0.55)"
              clipPath="url(#above-threshold)"
            />
            {/* 阈值虚线 */}
            <line
              x1="0"
              y1="50"
              x2="600"
              y2="50"
              stroke="#fff"
              strokeOpacity="0.65"
              strokeWidth="1.5"
              strokeDasharray="6,4"
              vectorEffect="non-scaling-stroke"
            />
            {/* 主曲线 */}
            <polyline
              points={emergencyCurvePoints}
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </section>
      </div>
    </div>
  );
};
