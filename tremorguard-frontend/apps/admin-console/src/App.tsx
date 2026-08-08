import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { TrendAnalysis } from './components/trend/TrendAnalysis';
import { ReportList } from './components/reports/ReportList';
import { MedicationDetail } from './components/medication/MedicationDetail';
import { AlertDetail } from './components/alert/AlertDetail';
import { UserProfile } from './components/profile/UserProfile';
import { Onboarding } from './components/onboarding/Onboarding';
import { EmergencyMode } from './components/emergency/EmergencyMode';

const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppShell>{children}</AppShell>
);

const App: React.FC = () => {
  return (
    <Routes>
      {/* 独立全屏页面（无 AppShell） */}
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/emergency" element={<EmergencyMode />} />

      {/* AppShell 包裹的主应用页面 */}
      <Route
        path="/"
        element={
          <ShellLayout>
            <Dashboard />
          </ShellLayout>
        }
      />
      <Route
        path="/trend"
        element={
          <ShellLayout>
            <TrendAnalysis />
          </ShellLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ShellLayout>
            <ReportList />
          </ShellLayout>
        }
      />
      <Route
        path="/medication"
        element={
          <ShellLayout>
            <MedicationDetail />
          </ShellLayout>
        }
      />
      <Route
        path="/alert"
        element={
          <ShellLayout>
            <AlertDetail />
          </ShellLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ShellLayout>
            <UserProfile />
          </ShellLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
