import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import styles from './TremorCurve.module.css';

/** 数据点：(距 13:52 的分钟数, 振幅 g) */
const CURVE_DATA: Array<[number, number]> = [
  [0, 0.4], [2, 0.45], [4, 0.5], [6, 0.6], [7, 0.7],
  [8, 0.9], [8.5, 1.2], [9, 1.6], [9.5, 1.9],
  [10, 2.0], [10.5, 2.4], [11, 2.8], [11.5, 2.6],
  [12, 2.3], [12.5, 2.0], [13, 1.7], [13.5, 1.4],
  [14, 1.1], [15, 0.85], [16, 0.7], [17, 0.6], [18, 0.5],
];

const TOTAL_MIN = 18;
const MAX_AMP = 3.0;
const THRESHOLD = 2.0;
const PEAK_VALUE = 2.8;
const TRIGGER_T = 10; // 14:02
const PEAK_T = 11; // 峰值
const MED_T = 13; // 14:05 服药

interface CurveLayout {
  w: number;
  h: number;
  pl: number;
  pr: number;
  pt: number;
  pb: number;
}

const DESKTOP: CurveLayout = { w: 560, h: 240, pl: 44, pr: 16, pt: 32, pb: 40 };
const MOBILE: CurveLayout = { w: 340, h: 180, pl: 32, pr: 12, pt: 24, pb: 28 };

function xAt(t: number, L: CurveLayout): number {
  return L.pl + (t / TOTAL_MIN) * (L.w - L.pl - L.pr);
}

function yAt(v: number, L: CurveLayout): number {
  return L.pt + (1 - v / MAX_AMP) * (L.h - L.pt - L.pb);
}

function buildLinePath(L: CurveLayout): string {
  const pts = CURVE_DATA.map(([t, v]) => ({ x: xAt(t, L), y: yAt(v, L) }));
  let p = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    p += ` C ${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return p;
}

function buildAreaPath(L: CurveLayout): string {
  const line = buildLinePath(L);
  const baseY = yAt(0, L);
  const lastX = xAt(CURVE_DATA[CURVE_DATA.length - 1][0], L);
  const firstX = xAt(CURVE_DATA[0][0], L);
  return `${line} L ${lastX.toFixed(1)},${baseY.toFixed(1)} L ${firstX.toFixed(1)},${baseY.toFixed(1)} Z`;
}

export const TremorCurve: React.FC = () => {
  const { isMobile } = useResponsive();
  const L = isMobile ? MOBILE : DESKTOP;

  const linePath = buildLinePath(L);
  const areaPath = buildAreaPath(L);
  const triggerX = xAt(TRIGGER_T, L);
  const triggerY = yAt(THRESHOLD, L);
  const peakX = xAt(PEAK_T, L);
  const peakY = yAt(PEAK_VALUE, L);
  const medX = xAt(MED_T, L);
  const thresholdY = yAt(THRESHOLD, L);

  const plotLeft = L.pl;
  const plotRight = L.w - L.pr;
  const plotTop = L.pt;
  const plotBottom = yAt(0, L);

  const gridVals = [3.0, 2.0, 1.0];
  const yLabelVals = [3.0, 2.0, 1.0, 0];

  const xLabelsDesktop = [
    { t: 0, label: '13:52', color: 'var(--tg-muted)', bold: false },
    { t: 8, label: '14:00', color: 'var(--tg-muted)', bold: false },
    { t: 10, label: '14:02', color: 'var(--tg-danger)', bold: true },
    { t: 13, label: '14:05', color: 'var(--tg-secondary)', bold: true },
    { t: 18, label: '14:10', color: 'var(--tg-muted)', bold: false },
  ];
  const xLabelsMobile = [
    { t: 0, label: '13:52', color: 'var(--tg-muted)', bold: false },
    { t: 8, label: '14:00', color: 'var(--tg-muted)', bold: false },
    { t: 18, label: '14:10', color: 'var(--tg-muted)', bold: false },
  ];
  const xLabels = isMobile ? xLabelsMobile : xLabelsDesktop;

  const monoFont = { fontFamily: 'var(--font-mono)' } as React.CSSProperties;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>震颤曲线</h3>
          <span className={styles.subtitle}>触发前 10 分钟至事件全程</span>
        </div>
        <span className={styles.window}>窗口 13:52 – 14:10</span>
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${L.w} ${L.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="震颤振幅曲线图，从13时52分到14时10分"
      >
        {/* 水平网格线 */}
        {gridVals.map((v, i) => (
          <line
            key={`grid-${i}`}
            x1={plotLeft}
            y1={yAt(v, L)}
            x2={plotRight}
            y2={yAt(v, L)}
            stroke="var(--tg-border)"
            strokeWidth={1}
          />
        ))}

        {/* Y 轴标签 */}
        {yLabelVals.map((v, i) => (
          <text
            key={`yl-${i}`}
            x={plotLeft - 6}
            y={yAt(v, L)}
            style={{ ...monoFont, fontSize: '11px', fill: 'var(--tg-muted)' }}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {v.toFixed(1)}
          </text>
        ))}

        {/* 桌面端：旋转的 Y 轴标题 */}
        {!isMobile && (
          <text
            x={-(L.h / 2)}
            y={12}
            style={{ fontSize: '11px', fill: 'var(--tg-muted)' }}
            textAnchor="middle"
            transform="rotate(-90)"
          >
            振幅 (g)
          </text>
        )}

        {/* 振幅填充区域 */}
        <path d={areaPath} fill="var(--tg-primary)" opacity={0.1} />

        {/* 阈值线 */}
        <line
          x1={plotLeft}
          y1={thresholdY}
          x2={plotRight}
          y2={thresholdY}
          stroke="var(--tg-danger)"
          strokeWidth={1.5}
          strokeDasharray="6,4"
        />
        <text
          x={plotRight - 2}
          y={thresholdY - 6}
          style={{ ...monoFont, fontSize: '11px', fill: 'var(--tg-danger)' }}
          textAnchor="end"
        >
          阈值 2.0g
        </text>

        {/* 服药标记 */}
        <line
          x1={medX}
          y1={plotTop}
          x2={medX}
          y2={plotBottom}
          stroke="var(--tg-secondary)"
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />
        <text
          x={medX}
          y={plotTop - 6}
          style={{ fontSize: '11px', fill: 'var(--tg-secondary)', fontWeight: 600 }}
          textAnchor="middle"
        >
          服药
        </text>

        {/* 振幅曲线 */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--tg-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 触发点 */}
        <circle
          cx={triggerX}
          cy={triggerY}
          r={4}
          fill="var(--tg-danger)"
          stroke="var(--tg-surface)"
          strokeWidth={2}
        />
        <text
          x={triggerX}
          y={triggerY - 10}
          style={{
            ...monoFont,
            fontSize: isMobile ? '9px' : '11px',
            fill: 'var(--tg-danger)',
            fontWeight: 600,
          }}
          textAnchor="middle"
        >
          {isMobile ? '14:02' : '触发'}
        </text>

        {/* 桌面端：峰值点 */}
        {!isMobile && (
          <>
            <circle
              cx={peakX}
              cy={peakY}
              r={11}
              fill="none"
              stroke="var(--tg-danger)"
              strokeWidth={1}
              opacity={0.35}
            />
            <circle cx={peakX} cy={peakY} r={6} fill="var(--tg-danger)" />
            <text
              x={peakX}
              y={peakY - 16}
              style={{ ...monoFont, fontSize: '11px', fill: 'var(--tg-danger)', fontWeight: 700 }}
              textAnchor="middle"
            >
              峰值 2.8g
            </text>
          </>
        )}

        {/* X 轴标签 */}
        {xLabels.map((xl, i) => (
          <text
            key={`xl-${i}`}
            x={xAt(xl.t, L)}
            y={plotBottom + 8}
            style={{
              ...monoFont,
              fontSize: '11px',
              fill: xl.color,
              fontWeight: xl.bold ? 600 : 400,
            }}
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {xl.label}
          </text>
        ))}
      </svg>

      {/* 桌面端：图例 */}
      {!isMobile && (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendLine} />
            <span>震幅曲线</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDashedDanger} />
            <span>阈值 2.0g</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDashedSecondary} />
            <span>服药时间</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} />
            <span>触发点 / 峰值</span>
          </div>
        </div>
      )}
    </div>
  );
};
