import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  FileText,
  Pill,
  Settings,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { navItems, patientInfo } from '../../data/mockData';
import { useDashboardStore } from '../../store/dashboardStore';
import { useResponsive } from '../../hooks/useResponsive';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard: Activity,
  TrendingUp: TrendingUp,
  FileText: FileText,
  Pill: Pill,
  Settings: Settings,
};

export const Sidebar: React.FC = () => {
  const { isDesktop, isTablet, isMobile } = useResponsive();
  const navigate = useNavigate();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useDashboardStore();

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleProfileClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
    navigate('/profile');
  };

  const getSidebarClass = () => {
    const classes = [styles.sidebar];

    if (isDesktop) {
      classes.push(styles.sidebarDesktop);
      if (sidebarCollapsed) {
        classes.push(styles.sidebarCollapsed, styles.collapsed);
      }
    } else if (isTablet) {
      classes.push(styles.sidebarCollapsed, styles.collapsed);
    } else {
      classes.push(styles.sidebarMobile);
      if (sidebarOpen) {
        classes.push(styles.sidebarMobileOpen);
      }
    }

    return classes.join(' ');
  };

  return (
    <>
      <aside className={getSidebarClass()} aria-label="主导航">
        <div className={styles.logoArea}>
          <span className={styles.logoMark} aria-hidden="true">
            <Zap size={22} strokeWidth={2.2} />
          </span>
          <span className={styles.logoText}>
            Tremor<span className={styles.logoTextAccent}>Guard</span>
          </span>
        </div>

        <nav className={styles.nav} aria-label="侧边导航">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }: { isActive: boolean }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                onClick={handleNavClick}
                end={item.path === '/'}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {IconComponent && <IconComponent size={22} />}
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className={styles.profile} onClick={handleProfileClick}>
          <span className={styles.profileAvatar} aria-hidden="true">
            {patientInfo.avatar}
          </span>
          <span className={styles.profileText}>
            <span className={styles.profileName}>{patientInfo.name}</span>
            <span className={styles.profileRole}>{patientInfo.role}</span>
          </span>
        </button>
      </aside>

      {isMobile && (
        <div
          className={`${styles.backdrop} ${sidebarOpen ? styles.backdropShow : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};
