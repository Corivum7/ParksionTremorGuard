import React, { useEffect } from 'react';
import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useResponsive } from '../../hooks/useResponsive';
import { useDashboardStore } from '../../store/dashboardStore';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isDesktop, isTablet, isMobile } = useResponsive();
  const { setSidebarCollapsed, setSidebarOpen } = useDashboardStore();

  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    } else if (isDesktop) {
      setSidebarCollapsed(false);
      setSidebarOpen(false);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isDesktop, isTablet, isMobile, setSidebarCollapsed, setSidebarOpen]);

  const getShellClass = () => {
    const classes = [styles.appShell];
    if (isTablet) {
      classes.push(styles.collapsed);
    }
    if (isMobile) {
      classes.push(styles.mobileLayout);
    }
    return classes.join(' ');
  };

  return (
    <div className={getShellClass()}>
      <div className={styles.sidebarArea}>
        <Sidebar />
      </div>
      <div className={styles.topbarArea}>
        <Topbar />
      </div>
      <main className={styles.mainArea} aria-label="主内容">
        {children}
      </main>
    </div>
  );
};
