import { create } from 'zustand';
import type { Medication, Alert, TremorData } from '../types/dashboard';
import { medications as initialMedications, alerts as initialAlerts, tremorData as initialTremorData } from '../data/mockData';

interface DashboardState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeNav: string;
  medications: Medication[];
  alerts: Alert[];
  tremorData: TremorData;
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
