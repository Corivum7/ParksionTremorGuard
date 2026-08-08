import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Bluetooth, Bell, Info, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import styles from './Onboarding.module.css';
import { onboardingSteps } from '../../data/mockData';
import { useResponsive } from '../../hooks/useResponsive';

export const Onboarding: React.FC = () => {
  const { isDesktop } = useResponsive();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 0-indexed，当前在"设备绑定"(索引1)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      navigate('/');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  if (isDesktop) {
    return (
      <div className={styles.desktopShell}>
        <header className={styles.topBar}>
          <div className={styles.topBarInner}>
            <span className={styles.logoMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
            </span>
            <span className={styles.logoText}>TremorGuard</span>
            <span className={styles.topBarDivider} aria-hidden="true">/</span>
            <span className={styles.topBarCrumb}>首次配置引导</span>
          </div>
        </header>

        <main className={styles.desktopStage}>
          {/* Stepper */}
          <div className={styles.stepper}>
            {onboardingSteps.map((step, idx) => {
              const isCompleted = step.status === 'completed' || idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <React.Fragment key={step.id}>
                  <div className={styles.stepItem}>
                    <div
                      className={`${styles.stepCircle} ${
                        isCompleted ? styles.stepCompleted : isActive ? styles.stepActive : ''
                      }`}
                    >
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : idx + 1}
                    </div>
                    <span
                      className={`${styles.stepLabel} ${
                        isCompleted ? styles.stepLabelDone : isActive ? styles.stepLabelActive : ''
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < onboardingSteps.length - 1 && (
                    <div
                      className={`${styles.stepConnector} ${
                        isCompleted ? styles.stepConnectorDone : ''
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* 主卡片 */}
          <div className={styles.onboardingCard}>
            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>绑定您的腕带设备</h1>
              <p className={styles.cardSubtitle}>扫描腕带上的二维码进行绑定</p>
            </div>

            {/* 二维码扫描框 */}
            <div className={styles.qrFrame}>
              <span className={`${styles.qrCorner} ${styles.qrCornerTl}`} aria-hidden="true" />
              <span className={`${styles.qrCorner} ${styles.qrCornerTr}`} aria-hidden="true" />
              <span className={`${styles.qrCorner} ${styles.qrCornerBl}`} aria-hidden="true" />
              <span className={`${styles.qrCorner} ${styles.qrCornerBr}`} aria-hidden="true" />
              <div className={styles.qrCenter}>
                <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--tg-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span className={styles.qrHint}>将二维码对准框内</span>
              </div>
              <span className={styles.scanLine} aria-hidden="true" />
            </div>

            {/* 设备 ID 输入 */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="device-id">设备 ID / HWID</label>
              <input
                id="device-id"
                className={styles.deviceInput}
                type="text"
                placeholder="输入或扫描设备 HWID，如 TG-2024-XXXX"
              />
              <div className={styles.fieldHint}>
                <Info size={14} />
                <span>可在腕带背面或包装盒上找到 HWID 编号</span>
              </div>
            </div>

            {/* 状态提示 */}
            <div className={styles.statusHint}>
              <Loader2 size={16} className={styles.spinner} />
              <span className={styles.statusText}>等待扫描...</span>
            </div>
          </div>

          {/* 底部导航 */}
          <div className={styles.navRow}>
            <button className={`${styles.btnStep} ${styles.btnPrev}`} type="button" onClick={handlePrev}>
              <ChevronLeft size={18} strokeWidth={2.5} />
              上一步
            </button>
            <button className={`${styles.btnStep} ${styles.btnNext}`} type="button" onClick={handleNext}>
              下一步
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 移动端
  const mobileSteps = ['设备绑定', '用药方案', '照护者', '校准'];
  return (
    <main className={styles.mobileFrame}>
      <div className={styles.mobileProgress}>
        <div className={styles.mobileProgressTop}>
          <div className={styles.mobileProgressBars}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`${styles.mobileBar} ${i === 0 ? styles.mobileBarActive : ''}`}
              />
            ))}
          </div>
          <span className={styles.mobileStepCount}>1/4</span>
        </div>
        <div className={styles.mobileStepLabels}>
          {mobileSteps.map((label, i) => (
            <span key={label} className={`${styles.mobileStepLabel} ${i === 0 ? styles.mobileStepLabelActive : ''}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.mobileContent}>
        <div className={styles.mobileTitleGroup}>
          <h1 className={styles.mobileTitle}>绑定您的腕带设备</h1>
          <p className={styles.mobileSubtitle}>扫描腕带上的二维码或手动输入设备 ID</p>
        </div>

        <div className={styles.qrFrame}>
          <span className={`${styles.qrCorner} ${styles.qrCornerTl}`} aria-hidden="true" />
          <span className={`${styles.qrCorner} ${styles.qrCornerTr}`} aria-hidden="true" />
          <span className={`${styles.qrCorner} ${styles.qrCornerBl}`} aria-hidden="true" />
          <span className={`${styles.qrCorner} ${styles.qrCornerBr}`} aria-hidden="true" />
          <div className={styles.qrCenter}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--tg-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v7M14 21h7" />
            </svg>
            <span className={styles.qrHint}>将二维码对准框内</span>
          </div>
          <span className={styles.scanLine} aria-hidden="true" />
        </div>

        <div className={styles.mobilePermissionGroup}>
          <Button variant="primary" fullWidth>
            <Bluetooth size={24} />
            允许蓝牙连接
          </Button>
          <Button variant="secondary" fullWidth>
            <Bell size={24} />
            允许通知提醒
          </Button>
        </div>

        <a href="#" className={styles.manualLink} onClick={(e) => e.preventDefault()}>
          手动输入 HWID
        </a>
      </div>

      <div className={styles.mobileBottomBar}>
        <Button variant="primary" fullWidth onClick={handleNext}>
          下一步
        </Button>
      </div>
    </main>
  );
};
