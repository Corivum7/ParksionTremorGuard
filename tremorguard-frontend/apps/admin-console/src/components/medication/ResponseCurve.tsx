import React from 'react';
import styles from './ResponseCurve.module.css';

export const ResponseCurve: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <svg viewBox="0 0 320 200" className={styles.svg} role="img" aria-label="用药后 120 分钟振幅变化曲线">
        <defs>
          <linearGradient id="respCurveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tg-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--tg-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* ON/OFF 色带 */}
        <rect x="50" y="20" width="200" height="150" fill="var(--tg-success)" opacity="0.05" />
        <rect x="250" y="20" width="60" height="150" fill="var(--tg-warning)" opacity="0.06" />
        <text x="150" y="14" fontSize="9" fontWeight="700" fill="var(--tg-success)" textAnchor="middle">ON 期</text>
        <text x="280" y="14" fontSize="9" fontWeight="700" fill="var(--tg-warning)" textAnchor="middle">OFF 期</text>

        {/* 网格线 */}
        <line x1="50" y1="50" x2="310" y2="50" stroke="var(--tg-border)" strokeWidth="1" strokeDasharray="2,3" />
        <line x1="50" y1="90" x2="310" y2="90" stroke="var(--tg-border)" strokeWidth="1" strokeDasharray="2,3" />
        <line x1="50" y1="140" x2="310" y2="140" stroke="var(--tg-border)" strokeWidth="1" strokeDasharray="2,3" />
        <line x1="50" y1="170" x2="310" y2="170" stroke="var(--tg-border)" strokeWidth="1" />

        {/* Y 轴标签 */}
        <text x="44" y="54" fontSize="10" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="end">5</text>
        <text x="44" y="94" fontSize="10" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="end">2.5</text>
        <text x="44" y="144" fontSize="10" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="end">1</text>
        <text x="44" y="174" fontSize="10" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="end">0</text>
        <text x="14" y="110" fontSize="10" fill="var(--tg-muted)" textAnchor="middle" transform="rotate(-90 14 110)">振幅 g</text>

        {/* X 轴标签 */}
        <text x="50" y="186" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="middle">0</text>
        <text x="115" y="186" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="middle">30</text>
        <text x="180" y="186" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="middle">60</text>
        <text x="245" y="186" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="middle">90</text>
        <text x="310" y="186" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tg-muted)" textAnchor="middle">120</text>
        <text x="180" y="198" fontSize="11" fill="var(--tg-muted)" textAnchor="middle">用药后时间 (分钟)</text>

        {/* 填充区域 */}
        <path
          d="M 35 168 C 60 160, 90 130, 131 85 C 170 70, 210 110, 250 145 C 280 160, 300 168, 310 170 L 310 170 L 35 170 Z"
          fill="url(#respCurveFill)"
        />
        {/* 曲线 */}
        <path
          d="M 35 168 C 60 160, 90 130, 131 85 C 170 70, 210 110, 250 145 C 280 160, 300 168, 310 170"
          fill="none"
          stroke="var(--tg-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 服药起点 */}
        <circle cx="35" cy="168" r="3.5" fill="var(--tg-primary)" />
        <text x="40" y="162" fontSize="10" fill="var(--tg-ink-2)">服药</text>

        {/* 达峰标记 */}
        <line x1="131" y1="20" x2="131" y2="170" stroke="var(--tg-success)" strokeWidth="1.5" strokeDasharray="3,3" />
        <circle cx="131" cy="85" r="4.5" fill="var(--tg-success)" stroke="var(--tg-surface)" strokeWidth="2" />
        <rect x="100" y="62" width="62" height="16" rx="8" fill="var(--tg-success-light)" stroke="var(--tg-success)" strokeWidth="1" />
        <text x="131" y="73" fontSize="11" fontWeight="700" fill="var(--tg-success)" textAnchor="middle">达峰 42min</text>

        {/* 剂末回升 */}
        <text x="295" y="40" fontSize="10" fontWeight="600" fill="var(--tg-warning)" textAnchor="end">剂末回升</text>
        <path d="M 290 44 L 280 56" stroke="var(--tg-warning)" strokeWidth="1" strokeDasharray="2,2" fill="none" />
      </svg>
    </div>
  );
};
