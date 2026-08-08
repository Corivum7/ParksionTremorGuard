import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Maximize2, Minimize2 } from 'lucide-react';
import styles from './Topbar.module.css';
import { IconButton } from '../common/IconButton';
import { useDashboardStore } from '../../store/dashboardStore';
import { useResponsive } from '../../hooks/useResponsive';

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: '今日仪表盘' },
  '/trend': { title: '趋势分析' },
  '/reports': { title: '报告列表', subtitle: '临床报告与趋势总结' },
  '/medication': { title: '用药管理' },
  '/devices': { title: '设备设置' },
  '/profile': { title: '用户主页' },
  '/alert': { title: '警报详情' },
};

export const Topbar: React.FC = () => {
  const { isMobile } = useResponsive();
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts, toggleSidebar, setSidebarOpen } = useDashboardStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasUnacknowledgedAlerts = alerts.some((a) => !a.acknowledged);

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      toggleSidebar();
    }
  }, [isMobile, setSidebarOpen, toggleSidebar]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[today.getDay()];
  const dateText = `${year}年${month}月${day}日 ${weekday}`;

  const routeInfo = ROUTE_TITLES[location.pathname] || { title: 'TremorGuard' };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <IconButton
          className={styles.hamburgerBtn}
          onClick={handleMenuClick}
          ariaLabel="打开菜单"
          size={44}
        >
          <Menu size={22} />
        </IconButton>

        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{routeInfo.title}</h1>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.date}>{routeInfo.subtitle || dateText}</span>
        </div>
      </div>

      <div className={styles.right}>
        <IconButton
          ariaLabel="通知"
          hasNotification={hasUnacknowledgedAlerts}
          onClick={() => navigate('/alert')}
        >
          <Bell size={22} />
        </IconButton>

        <IconButton
          ariaLabel={isFullscreen ? '退出全屏' : '全屏'}
          onClick={handleFullscreenToggle}
        >
          {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
        </IconButton>
      </div>
    </header>
  );
};
