import type {
  NavItem,
  Medication,
  Alert,
  TremorData,
  QuickStat,
  TrendStat,
  AnomalyEvent,
  Report,
  MedTimelineItem,
  MedChangeRecord,
  InterventionNode,
  TriggerCondition,
  OnboardingStep,
  EmergencyContact,
  HealthSummaryCell,
  CareTeamMember,
  SettingItem,
} from '../types/dashboard';

export const navItems: NavItem[] = [
  { id: 'dashboard', label: '今日仪表盘', icon: 'LayoutDashboard', path: '/' },
  { id: 'trend', label: '趋势分析', icon: 'TrendingUp', path: '/trend' },
  { id: 'reports', label: '报告列表', icon: 'FileText', path: '/reports' },
  { id: 'medication', label: '用药管理', icon: 'Pill', path: '/medication' },
  { id: 'devices', label: '设备设置', icon: 'Settings', path: '/devices' },
];

export const medications: Medication[] = [
  { id: '1', time: '07:00', status: 'done', name: '左旋多巴', dosage: '100mg' },
  { id: '2', time: '12:00', status: 'pending', name: '左旋多巴', dosage: '100mg' },
  { id: '3', time: '18:00', status: 'future', name: '左旋多巴', dosage: '100mg' },
];

export const alerts: Alert[] = [
  {
    id: '1',
    type: 'danger',
    message: '1 条未处理警报',
    timestamp: '14:00',
    acknowledged: false,
  },
];

export const tremorData: TremorData = {
  averageAmplitude: 0.42,
  unit: 'g',
  peakTime: '14:00',
  peakAmplitude: 2.1,
  lastUpdated: '14:32',
  status: 'on',
  hourlyData: [44, 45, 49, 48, 47, 44, 42, 41, 45, 44, 43, 41, 40, 39, 39, 38, 37, 21, 18, 16, 31, 34, 37, 41, 40, 39, 43, 42, 41, 47, 46, 45, 49, 48],
};

export const quickStats: QuickStat[] = [
  {
    id: 'freq',
    label: '震颤频次',
    value: 24,
    unit: '次/小时',
    caption: '今日平均',
    icon: 'Activity',
    variant: 'primary',
  },
  {
    id: 'compliance',
    label: '用药依从率',
    value: 92,
    unit: '%',
    caption: '近 7 日',
    icon: 'CheckCircle',
    variant: 'success',
  },
  {
    id: 'on-duration',
    label: 'ON状态时长',
    value: 6.5,
    unit: '小时',
    caption: '今日累计',
    icon: 'Clock',
    variant: 'secondary',
  },
];

export const aiInsight = {
  title: 'AI 洞察',
  message: '下午 14:00 前后有剂末效应趋势，建议提前 15 分钟服药',
};

export const patientInfo = {
  name: '王伯伯',
  role: '患者',
  avatar: '王',
};

// ===== 趋势分析 =====
export const trendStats: TrendStat[] = [
  { id: 'avg', label: '平均震颤幅度', value: 0.42, unit: 'g', variant: 'ink', trend: '较昨日下降 0.03g' },
  { id: 'on', label: 'ON状态时长', value: 78, unit: '%', variant: 'success', trend: '较昨日提升 3%' },
  { id: 'wearing', label: '剂末效应次数', value: 2, unit: '次', variant: 'warning', trend: 'wearing-off · 较昨日持平' },
  { id: 'peak', label: '峰值振幅', value: 0.85, unit: 'g', variant: 'danger', trend: '出现在 14:02' },
  { id: 'compliance', label: '用药依从率', value: 92, unit: '%', variant: 'success', trend: '本周平均 90%' },
  { id: 'anomaly', label: '异常事件数', value: 1, unit: '次', variant: 'danger', trend: '较昨日减少 1 次' },
];

export const anomalyEvents: AnomalyEvent[] = [
  {
    id: 'a1',
    time: '14:02',
    badge: '震颤升高',
    badgeVariant: 'danger',
    value: '0.85g',
    desc: '持续 8min · 较基线升高 3.1 倍 · 已自动记录',
  },
];

// 趋势图振幅曲线数据点（0:00 - 24:00，单位 g）
export const trendAmplitudePoints: string =
  '32,170 50,168 70,165 90,160 110,155 125,150 140,140 160,120 178,95 195,80 210,72 218,70 225,75 232,90 248,110 265,135 285,155 305,165 325,170 352,172';

// ON/OFF 频段时间轴（单位：分钟，0-1440 = 24h）
export const trendBands = [
  { type: 'on' as const, start: 420, end: 740 }, // 07:00 - 12:20
  { type: 'off' as const, start: 740, end: 790 }, // 12:20 - 13:10
  { type: 'on' as const, start: 790, end: 1140 }, // 13:10 - 19:00
];

// 用药标记时间（小时）
export const trendMedTimes = [7, 11, 15, 19];

// ===== 报告列表 =====
export const reportFilters = [
  { id: 'all', label: '全部', count: 5 },
  { id: 'weekly', label: '周报', count: 1 },
  { id: 'monthly', label: '月报', count: 0 },
  { id: 'event', label: '警报', count: 1 },
  { id: 'consult', label: '复诊', count: 1 },
];

export const reports: Report[] = [
  {
    id: 'r1',
    type: 'daily',
    typeLabel: '日报',
    typeVariant: 'info',
    iconBg: 'var(--tg-secondary)',
    icon: 'calendar',
    title: '7月24日 日报告',
    date: '2026-07-24 00:00 - 23:59',
    metrics: '平均 0.42g · 峰值 0.85g · 依从 92%',
    shared: true,
  },
  {
    id: 'r2',
    type: 'weekly',
    typeLabel: '周报',
    typeVariant: 'info',
    iconBg: 'var(--tg-secondary)',
    icon: 'barChart',
    title: '第30周 周报告',
    date: '2026-07-21 至 2026-07-27',
    metrics: '平均 0.45g · 峰值 0.92g · 依从 95%',
  },
  {
    id: 'r3',
    type: 'consult',
    typeLabel: '复诊',
    typeVariant: 'accent',
    iconBg: 'var(--tg-accent)',
    icon: 'fileText',
    title: '7月复诊报告',
    date: '2026-07-15 至 2026-07-24',
    metrics: '剂末效应 2 次 · 调整建议 1 项',
  },
  {
    id: 'r4',
    type: 'event',
    typeLabel: '警报',
    typeVariant: 'danger',
    iconBg: 'var(--tg-danger)',
    icon: 'alertTriangle',
    title: '14:02 震颤异常事件',
    date: '2026-07-24 14:02',
    metrics: '峰值 0.85g · 持续 8 min',
  },
  {
    id: 'r5',
    type: 'daily',
    typeLabel: '日报',
    typeVariant: 'info',
    iconBg: 'var(--tg-secondary)',
    icon: 'calendar',
    title: '7月23日 日报告',
    date: '2026-07-23 00:00 - 23:59',
    metrics: '平均 0.38g · 峰值 0.72g · 依从 100%',
  },
];

export const generatingReport = {
  text: '正在生成日报告...',
  eta: '预计 30 秒',
  progress: 65,
};

// ===== 用药详情 =====
export const medicationRegimen = {
  name: '左旋多巴',
  dosage: '250mg',
  frequency: '每日 4 次',
  route: '口服',
  effectiveDate: '2026-06-15',
  doctor: '王振国 主任医师',
  badgeVariant: 'info' as const,
  badgeLabel: '医生推送',
  timings: ['07:00', '11:00', '15:00', '19:00'],
  currentTiming: '15:00',
};

export const medTimeline: MedTimelineItem[] = [
  { id: 'm1', time: '07:00', status: 'done', name: '左旋多巴', dosage: '250mg' },
  { id: 'm2', time: '11:00', status: 'done', name: '左旋多巴', dosage: '250mg' },
  { id: 'm3', time: '15:00', status: 'pending', name: '左旋多巴', dosage: '250mg' },
  { id: 'm4', time: '19:00', status: 'future', name: '左旋多巴', dosage: '250mg' },
];

// 30 天柱状图高度数据（百分比 0-100）
export const compliance30Days = [
  95, 100, 90, 92, 88, 95, 100, 90, 85, 92, 95, 100, 90, 88, 95, 92, 90, 100, 95, 90,
  92, 88, 95, 100, 90, 95, 92, 88, 90, 92,
];

export const medChangeHistory: MedChangeRecord[] = [
  {
    id: 'c1',
    date: '2026-06-15',
    typeLabel: '医生推送',
    typeVariant: 'info',
    from: '200mg × 4',
    to: '250mg × 4',
    note: '剂末效应加重，医生调整单次剂量',
  },
  {
    id: 'c2',
    date: '2026-05-02',
    typeLabel: '剂量调整',
    typeVariant: 'off',
    from: '100mg × 3',
    to: '200mg × 4',
    note: '症状控制不佳，增加剂量与频次',
  },
  {
    id: 'c3',
    date: '2026-03-10',
    typeLabel: '初始方案',
    typeVariant: 'muted',
    to: '100mg × 3',
    note: '确诊帕金森病，开始左旋多巴治疗',
  },
];

// ===== 警报详情 =====
export const alertHeader = {
  title: '震颤异常升高',
  badge: '进行中',
  triggerTime: '14:02',
  duration: '8 分钟',
  peakValue: '0.85 g',
  threshold: '0.50 g',
};

export const triggerConditions: TriggerCondition[] = [
  { id: 't1', label: '振幅峰值', value: '0.85 g', variant: 'danger' },
  { id: 't2', label: '上升速率', value: '0.08 g/min', variant: 'ink' },
  { id: 't3', label: '超阈值持续', value: '6 分钟', variant: 'ink' },
  { id: 't4', label: '个体化阈值', value: '0.50 g', variant: 'muted' },
  { id: 't5', label: '受累部位', value: '右手 · 静止性', variant: 'ink' },
];

export const interventionNodes: InterventionNode[] = [
  {
    id: 'i1',
    time: '14:02',
    title: '警报触发',
    desc: '震幅超阈值 0.50g',
    actor: '系统',
    dotVariant: 'danger',
    lineDone: true,
  },
  {
    id: 'i2',
    time: '14:02',
    title: '通知发送',
    desc: '推送警报至照护者与患者',
    actor: '系统',
    dotVariant: 'secondary',
    lineDone: true,
  },
  {
    id: 'i3',
    time: '14:03',
    title: '用户确认警报',
    desc: '患者查看并确认警报',
    actor: '张明（患者）',
    dotVariant: 'secondary',
    lineDone: true,
  },
  {
    id: 'i4',
    time: '14:05',
    title: '记录服药',
    desc: '左旋多巴 250mg',
    actor: '张明（患者）',
    dotVariant: 'success',
    lineDone: false,
    pending: true,
  },
  {
    id: 'i5',
    time: '追踪中',
    title: '振幅开始下降',
    desc: '响应追踪中，待回归基线',
    actor: '系统',
    dotVariant: 'muted',
    pending: true,
  },
];

// ===== 首次配置引导 =====
export const onboardingSteps: OnboardingStep[] = [
  { id: 's1', label: '欢迎', status: 'completed' },
  { id: 's2', label: '设备绑定', status: 'active' },
  { id: 's3', label: '用药方案', status: 'pending' },
  { id: 's4', label: '照护者', status: 'pending' },
  { id: 's5', label: '完成', status: 'pending' },
];

// ===== 紧急模式 =====
export const emergencyStatus = {
  title: '紧急警报',
  value: '0.85',
  unit: 'g',
  threshold: '0.50g',
  exceedPercent: 70,
  duration: '持续 3分12秒',
  caregiverNotified: '李女士',
};

export const emergencyContacts: EmergencyContact[] = [
  { id: 'e1', name: '李女士', relation: '照护者', avatarText: '李' },
  { id: 'e2', name: '张明', relation: '家属', avatarText: '张' },
  { id: 'e3', name: '急救 120', relation: '急救热线', avatarText: '', isHotline: true },
];

// 实时震颤曲线点（viewBox 600×120）
export const emergencyCurvePoints =
  '0,90 50,85 100,88 150,82 200,75 250,68 300,55 350,40 400,30 450,25 500,30 550,28 600,25';

// ===== 用户主页 =====
export const userProfile = {
  name: '王伯伯',
  patientId: 'TG-2024-0312',
  basicInfo: '男 · 68岁 · 帕金森病 II 期',
  diagnoseDate: '确诊时间: 2021年6月',
  avatarText: '王',
};

export const healthSummary: HealthSummaryCell[] = [
  { id: 'h1', label: '病程', value: '3年2个月', variant: 'primary' },
  { id: 'h2', label: 'Hoehn-Yahr 分期', value: 'II 期', variant: 'ink' },
  { id: 'h3', label: '近7日平均震颤幅度', value: '0.42g', variant: 'ink' },
  { id: 'h4', label: 'ON/OFF 比例', value: '78% / 22%', variant: 'success' },
];

export const deviceStatus = {
  name: 'TremorGuard W1 Pro',
  bound: true,
  battery: 82,
  lastSync: '2分钟前',
  deviceId: 'TG-W1-A7K3',
};

export const careTeam: CareTeamMember[] = [
  {
    id: 'ct1',
    name: '李阿姨',
    relation: '女儿',
    phone: '138****6688',
    avatarText: '李',
    avatarVariant: 'primary',
  },
  {
    id: 'ct2',
    name: '张主任',
    relation: '神经内科主任医师',
    phone: '市第一人民医院',
    avatarText: '张',
    avatarVariant: 'secondary',
  },
];

export const settingItems: SettingItem[] = [
  { id: 'set1', label: '通知设置', icon: 'Bell' },
  { id: 'set2', label: '隐私与安全', icon: 'Shield' },
  { id: 'set3', label: '数据导出', icon: 'Download' },
  { id: 'set4', label: '用药方案管理', icon: 'Pill' },
  { id: 'set5', label: '帮助与反馈', icon: 'HelpCircle' },
  { id: 'set6', label: '关于 TremorGuard', icon: 'Info' },
];
