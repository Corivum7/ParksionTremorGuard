import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import {
  trendAmplitudePoints,
  trendBands,
  trendMedTimes,
} from '../../data/mockData';
import styles from './TremorChart.module.css';

interface TremorChartProps {
  medOverlay: boolean;
}

function scalePoints(pointsStr: string, sx: number, sy: number): string {
  return pointsStr
    .split(' ')
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return `${(x * sx).toFixed(2)},${(y * sy).toFixed(2)}`;
    })
    .join(' ');
}

function buildAreaPath(pointsStr: string, axisY: number): string {
  const pts = pointsStr.split(' ').map((p) => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  let path = `M${first.x},${axisY} L${first.x},${first.y}`;
  for (let i = 1; i < pts.length; i++) {
    path += ` L${pts[i].x},${pts[i].y}`;
  }
  path += ` L${last.x},${axisY} Z`;
  return path;
}

function minToX(min: number, plotStart: number, plotWidth: number): number {
  return plotStart + (min / 1440) * plotWidth;
}

function hourToX(hour: number, plotStart: number, plotWidth: number): number {
  return plotStart + (hour / 24) * plotWidth;
}

export const TremorChart: React.FC<TremorChartProps> = ({ medOverlay }) => {
  const { isDesktop } = useResponsive();

  const viewBox = isDesktop ? '0 0 1080 360' : '0 0 360 240';
  const plotStart = isDesktop ? 90 : 30;
  const plotWidth = isDesktop ? 960 : 320;
  const axisY = isDesktop ? 300 : 200;
  const bandTop = isDesktop ? 30 : 20;
  const scaleX = isDesktop ? 3 : 1;
  const scaleY = isDesktop ? 1.5 : 1;

  // Y positions for grid lines (based on 2.5g peak at y=70 mobile / y=105 desktop)
  const peakY = 70 * scaleY;
  const yPerG = (axisY - peakY) / 2.5;
  const gridY3 = axisY - 3 * yPerG;
  const gridY2 = axisY - 2 * yPerG;
  const gridY1 = axisY - 1 * yPerG;
  const gridY0 = axisY;

  const polylinePoints = scalePoints(trendAmplitudePoints, scaleX, scaleY);
  const areaPath = buildAreaPath(polylinePoints, axisY);

  const anomalyX = 218 * scaleX;
  const anomalyY = 70 * scaleY;
  const anomalyROuter = isDesktop ? 12 : 8;
  const anomalyRInner = isDesktop ? 6 : 4;

  const bands = trendBands.map((band) => ({
    type: band.type,
    x: minToX(band.start, plotStart, plotWidth),
    width:
      minToX(band.end, plotStart, plotWidth) -
      minToX(band.start, plotStart, plotWidth),
  }));

  const xTicks = [
    { x: plotStart, label: '00:00' },
    { x: plotStart + plotWidth * 0.25, label: '06:00' },
    { x: plotStart + plotWidth * 0.5, label: '12:00' },
    { x: plotStart + plotWidth * 0.75, label: '18:00' },
    { x: plotStart + plotWidth, label: '24:00' },
  ];

  const fontSize = isDesktop ? 13 : 11;
  const labelOffset = isDesktop ? 6 : 4;

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={viewBox}
        role="img"
        aria-label="24小时震颤振幅趋势图"
      >
        {/* 背景频段 ON/OFF */}
        {bands.map((band, i) => (
          <rect
            key={`band-${i}`}
            x={band.x}
            y={bandTop}
            width={band.width}
            height={axisY - bandTop}
            fill={
              band.type === 'on'
                ? 'var(--tg-primary-light)'
                : 'var(--tg-surface-2)'
            }
            opacity={band.type === 'on' ? 0.45 : 0.9}
          />
        ))}

        {/* 频段标签 */}
        {bands.map((band, i) => (
          <text
            key={`band-label-${i}`}
            x={band.x + band.width / 2}
            y={bandTop + (isDesktop ? 18 : 14)}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight={700}
            fill={
              band.type === 'on' ? 'var(--tg-primary-dark)' : 'var(--tg-muted)'
            }
            fontFamily="var(--font-sans)"
          >
            {band.type === 'on' ? 'ON' : 'OFF'}
          </text>
        ))}

        {/* 水平网格线 */}
        <line
          x1={plotStart}
          y1={gridY3}
          x2={plotStart + plotWidth}
          y2={gridY3}
          stroke="var(--tg-border)"
          strokeWidth={1}
        />
        <line
          x1={plotStart}
          y1={gridY2}
          x2={plotStart + plotWidth}
          y2={gridY2}
          stroke="var(--tg-border)"
          strokeWidth={1}
        />
        <line
          x1={plotStart}
          y1={gridY1}
          x2={plotStart + plotWidth}
          y2={gridY1}
          stroke="var(--tg-border)"
          strokeWidth={1}
        />
        <line
          x1={plotStart}
          y1={gridY0}
          x2={plotStart + plotWidth}
          y2={gridY0}
          stroke="var(--tg-border)"
          strokeWidth={1}
        />

        {/* Y 轴标签 */}
        <text
          x={plotStart - labelOffset}
          y={gridY3 + labelOffset}
          textAnchor="end"
          fontSize={fontSize}
          fill="var(--tg-muted)"
          fontFamily="var(--font-mono)"
        >
          3.0
        </text>
        <text
          x={plotStart - labelOffset}
          y={gridY2 + labelOffset}
          textAnchor="end"
          fontSize={fontSize}
          fill="var(--tg-muted)"
          fontFamily="var(--font-mono)"
        >
          2.0
        </text>
        <text
          x={plotStart - labelOffset}
          y={gridY1 + labelOffset}
          textAnchor="end"
          fontSize={fontSize}
          fill="var(--tg-muted)"
          fontFamily="var(--font-mono)"
        >
          1.0
        </text>
        <text
          x={plotStart - labelOffset}
          y={gridY0 + labelOffset}
          textAnchor="end"
          fontSize={fontSize}
          fill="var(--tg-muted)"
          fontFamily="var(--font-mono)"
        >
          0
        </text>

        {/* 用药竖虚线 */}
        {medOverlay &&
          trendMedTimes.map((h, i) => (
            <line
              key={`med-${i}`}
              x1={hourToX(h, plotStart, plotWidth)}
              y1={bandTop}
              x2={hourToX(h, plotStart, plotWidth)}
              y2={axisY}
              stroke="var(--tg-ink-2)"
              strokeWidth={1.5}
              strokeDasharray="4,4"
              opacity={0.5}
            />
          ))}

        {/* 阈值线（桌面端独有） */}
        {isDesktop && (
          <>
            <line
              x1={plotStart}
              y1={gridY2}
              x2={plotStart + plotWidth}
              y2={gridY2}
              stroke="var(--tg-warning)"
              strokeWidth={1.5}
              strokeDasharray="6,4"
              opacity={0.65}
            />
            <text
              x={plotStart + plotWidth - labelOffset}
              y={gridY2 - labelOffset}
              textAnchor="end"
              fontSize={fontSize}
              fill="var(--tg-warning)"
              fontFamily="var(--font-sans)"
            >
              阈值 2.0g
            </text>
          </>
        )}

        {/* 振幅填充区域 */}
        <path d={areaPath} fill="var(--tg-primary)" opacity={0.08} />

        {/* 振幅折线 */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--tg-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 异常事件标记 */}
        <line
          x1={anomalyX}
          y1={anomalyY}
          x2={anomalyX}
          y2={axisY}
          stroke="var(--tg-danger)"
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.6}
        />
        <circle
          cx={anomalyX}
          cy={anomalyY}
          r={anomalyROuter}
          fill="none"
          stroke="var(--tg-danger)"
          strokeWidth={2}
        />
        <circle
          cx={anomalyX}
          cy={anomalyY}
          r={anomalyRInner}
          fill="var(--tg-danger)"
        />
        <text
          x={anomalyX + anomalyROuter + labelOffset}
          y={anomalyY - labelOffset}
          fontSize={fontSize}
          fontWeight={700}
          fill="var(--tg-danger)"
          fontFamily="var(--font-mono)"
        >
          2.5g
        </text>

        {/* X 轴标签 */}
        {xTicks.map((tick, i) => (
          <text
            key={`xtick-${i}`}
            x={tick.x}
            y={axisY + (isDesktop ? 20 : 16)}
            textAnchor="middle"
            fontSize={fontSize}
            fill="var(--tg-muted)"
            fontFamily="var(--font-sans)"
          >
            {tick.label}
          </text>
        ))}
      </svg>

      {/* 图例 */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatchOn} />
          ON 时段
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatchOff} />
          OFF 时段
        </span>
        {medOverlay && (
          <span className={styles.legendItem}>
            <span className={styles.legendLineMed} />
            用药
          </span>
        )}
        {isDesktop && (
          <span className={styles.legendItem}>
            <span className={styles.legendLineThreshold} />
            阈值
          </span>
        )}
        <span className={styles.legendItem}>
          <span className={styles.legendDotAnomaly} />
          异常事件
        </span>
      </div>
    </div>
  );
};
