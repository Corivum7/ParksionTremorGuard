import { create } from 'zustand';
import type { Medication, Alert, TremorData } from '../types/dashboard';
import {
  medications as initialMedications,
  alerts as initialAlerts,
  tremorData as initialTremorData,
} from '../data/mockData';
import { checkReadiness, listDevices, getMe, isApiError } from '../api';

interface DashboardState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeNav: string;
  medications: Medication[];
  alerts: Alert[];
  tremorData: TremorData;
  loading: boolean;
  initialized: boolean;
  apiAvailable: boolean | null;
  userName: string;
  deviceName: string;
  fetchDashboardData: () => Promise<void>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveNav: (nav: string) => void;
  markMedicationTaken: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeNav: 'dashboard',
  medications: initialMedications,
  alerts: initialAlerts,
  tremorData: initialTremorData,
  loading: false,
  initialized: false,
  apiAvailable: null,
  userName: '',
  deviceName: '',

  fetchDashboardData: async () => {
    set({ loading: true });
    try {
      await checkReadiness();
      set({ apiAvailable: true });

      try {
        const me = await getMe();
        set({ userName: me.email.split('@')[0] || '用户' });
      } catch {
        // Not authenticated, skip user fetch
      }

      try {
        const devices = await listDevices();
        if (devices.length > 0) {
          set({ deviceName: devices[0].name });
        }
      } catch {
        // Skip device fetch
      }

      set({ initialized: true });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        set({ apiAvailable: true, initialized: true });
      } else {
        console.warn('[TremorGuard] API 不可用，使用 mock 数据:', error);
        set({ apiAvailable: false, initialized: true });
      }
    } finally {
      set({ loading: false });
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveNav: (nav) => set({ activeNav: nav }),

  markMedicationTaken: (id) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id ? { ...m, status: 'done' } : m
      ),
    })),

  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),
}));