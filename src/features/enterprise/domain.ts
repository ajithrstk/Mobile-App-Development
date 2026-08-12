import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type EnterpriseFeatureKey =
  | 'devices'
  | 'collaboration'
  | 'ai'
  | 'admin'
  | 'search'
  | 'files'
  | 'security'
  | 'accessibility'
  | 'analytics'
  | 'deployment';

export type FeatureHealth = 'ready' | 'mocked' | 'needsBackend' | 'warning';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkStatus = 'todo' | 'inProgress' | 'blocked' | 'done';
export type DeliveryStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
export type DeviceTrustState = 'current' | 'trusted' | 'pending' | 'expired';
export type SearchEntity = 'message' | 'contact' | 'group' | 'media' | 'document' | 'link' | 'task' | 'note' | 'event' | 'announcement';
export type FileCategory = 'media' | 'document' | 'link' | 'audio' | 'archive';
export type TransferStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed';
export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type EnterpriseFeatureSummary = {
  key: EnterpriseFeatureKey;
  title: string;
  subtitle: string;
  icon: IoniconName;
  health: FeatureHealth;
  coverage: number;
  updatedAt: string;
  stats: Array<{ label: string; value: string; tone?: 'normal' | 'good' | 'warn' | 'danger' }>;
  capabilities: string[];
  limitations: string[];
};

export type DeviceSession = {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web' | 'desktop';
  appVersion: string;
  location: string;
  ipAddress: string;
  lastActiveAt: string;
  expiresAt: string;
  trustState: DeviceTrustState;
  syncState: 'synced' | 'syncing' | 'offline' | 'conflict';
  current: boolean;
};

export type CollaborationTask = {
  id: string;
  chatName: string;
  title: string;
  assignees: string[];
  priority: Priority;
  dueAt: string;
  status: WorkStatus;
  reminderAt?: string;
  commentCount: number;
  attachmentCount: number;
};

export type SharedDocument = {
  id: string;
  title: string;
  owner: string;
  version: number;
  updatedAt: string;
  category: FileCategory;
  reviewers: string[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  rsvp: { yes: number; maybe: number; no: number };
  reminderEnabled: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  channel: string;
  scheduledAt?: string;
  readOnly: boolean;
  deliveryStatus: DeliveryStatus;
  reach: number;
};

export type AiInsight = {
  id: string;
  type: 'smartReply' | 'summary' | 'actionItem' | 'translation' | 'speech' | 'spam';
  title: string;
  input: string;
  output: string;
  confidence: number;
  language?: string;
  mocked: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  department: string;
  role: string;
  suspended: boolean;
  devices: number;
  lastSeenAt: string;
};

export type Department = {
  id: string;
  name: string;
  users: number;
  storageGb: number;
  messageVolume: number;
};

export type RolePermission = {
  role: string;
  permissions: string[];
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  risk: 'low' | 'medium' | 'high';
};

export type EnterpriseSearchFilter = {
  query: string;
  entity: SearchEntity | 'all';
  dateRange: 'any' | 'today' | 'week' | 'month';
  department: string;
  starredOnly: boolean;
};

export type EnterpriseSearchResult = {
  id: string;
  entity: SearchEntity;
  title: string;
  snippet: string;
  source: string;
  createdAt: string;
  highlightedTerms: string[];
};

export type SharedFile = {
  id: string;
  name: string;
  category: FileCategory;
  owner: string;
  sizeMb: number;
  versions: number;
  favorite: boolean;
  downloaded: boolean;
  updatedAt: string;
  duplicateOf?: string;
};

export type TransferItem = {
  id: string;
  fileName: string;
  direction: 'upload' | 'download';
  progress: number;
  status: TransferStatus;
};

export type SecurityControl = {
  id: string;
  title: string;
  enabled: boolean;
  status: 'valid' | 'attention' | 'disabled';
  description: string;
};

export type AccessibilityPreference = {
  id: string;
  title: string;
  enabled: boolean;
  source: 'system' | 'app';
};

export type AnalyticsMetric = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: number[];
};

export type DeploymentItem = {
  id: string;
  title: string;
  status: 'done' | 'ready' | 'blocked';
  note: string;
};

export type EnterpriseDashboardData = {
  generatedAt: string;
  summaries: EnterpriseFeatureSummary[];
  devices: DeviceSession[];
  tasks: CollaborationTask[];
  documents: SharedDocument[];
  events: CalendarEvent[];
  announcements: Announcement[];
  aiInsights: AiInsight[];
  adminUsers: AdminUser[];
  departments: Department[];
  roles: RolePermission[];
  auditEvents: AuditEvent[];
  searchHistory: string[];
  savedSearches: EnterpriseSearchFilter[];
  searchResults: EnterpriseSearchResult[];
  files: SharedFile[];
  transfers: TransferItem[];
  securityControls: SecurityControl[];
  accessibilityPreferences: AccessibilityPreference[];
  analytics: AnalyticsMetric[];
  deployment: DeploymentItem[];
};
