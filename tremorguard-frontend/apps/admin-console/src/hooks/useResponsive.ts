import { useState, useEffect, useCallback } from 'react';
import type { ResponsiveState } from '../types/dashboard';

const BREAKPOINTS = {
  mobile: 767,
  tablet: 1023,
};

export function useResponsive(): ResponsiveState {
  const getWidth = useCallback(() => {
    if (typeof window === 'undefined') return 1440;
    return window.innerWidth;
  }, []);

  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width <= BREAKPOINTS.mobile;
  const isTablet = width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet;
  const isDesktop = width > BREAKPOINTS.tablet;

  return { isDesktop, isTablet, isMobile, width };
}
