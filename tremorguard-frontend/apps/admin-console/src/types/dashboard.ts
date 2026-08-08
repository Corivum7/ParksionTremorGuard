export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

export type Medication = {
  id: string;
  time: string;
  status: 'done' | 'pending' | 'future';
  name: string;
  dosage: string;
};

export type Alert = {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
};

export type TremorData = {
  averageAmplitude: number;
  unit: string;
  peakTime: string;
  peakAmplitude: number;
  lastUpdated: string;
  status: 'on' | 'off';
  hourlyData: number[];
};

export type QuickStat = {
  id: string;
  label: string;
  value: number;
  unit: string;
  caption: string;
  icon: string;
  variant: 'primary' | 'success' | 'secondary';
};

export type ResponsiveState = {
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  width: number;
};

// ===== 趋势分析 =====
export type TrendRange = 'day' | 'week' | 'month' | 'quarter';

export type TrendStat = {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  variant: 'ink' | 'accent' | 'success' | 'warning' | 'danger';
  trend?: string;
};

export type AnomalyEvent = {
  id: string;
  time: string;
  badge: string;
  badgeVariant: 'danger' | 'warning' | 'info';
  value: string;
  desc: string;
};

// ===== 报告列表 =====
export type ReportType = 'daily' | 'weekly' | 'consult' | 'event';

export type Report = {
  id: string;
  type: ReportType;
  typeLabel: string;
  typeVariant: 'info' | 'accent' | 'danger' | 'success';
  iconBg: string;
  icon: 'calendar' | 'barChart' | 'fileText' | 'alertTriangle';
  title: string;
  date: string;
  metrics: string;
  shared?: boolean;
};

// ===== 用药详情 =====
export type MedTimelineStatus = 'done' | 'pending' | 'future';

export type MedTimelineItem = {
  id: string;
  time: string;
  status: MedTimelineStatus;
  name: string;
  dosage: string;
};

export type MedChangeRecord = {
  id: string;
  date: string;
  typeLabel: string;
  typeVariant: 'info' | 'off' | 'muted';
  from?: string;
  to: string;
  note: string;
};

// ===== 警报详情 =====
export type InterventionNode = {
  id: string;
  time: string;
  title: string;
  desc: string;
  actor: string;
  dotVariant: 'danger' | 'secondary' | 'success' | 'muted';
  lineDone?: boolean;
  pending?: boolean;
};

export type TriggerCondition = {
  id: string;
  label: string;
  value: string;
  variant: 'danger' | 'ink' | 'muted';
};

// ===== 首次配置引导 =====
export type OnboardingStep = {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
};

// ===== 紧急模式 =====
export type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  avatarText: string;
  isHotline?: boolean;
};

// ===== 用户主页 =====
export type HealthSummaryCell = {
  id: string;
  label: string;
  value: string;
  variant: 'primary' | 'ink' | 'success';
};

export type CareTeamMember = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  avatarText: string;
  avatarVariant: 'primary' | 'secondary';
};

export type SettingItem = {
  id: string;
  label: string;
  icon: string;
};
