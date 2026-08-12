import type {
  AccessibilityPreference,
  AdminUser,
  AiInsight,
  Announcement,
  AuditEvent,
  CalendarEvent,
  CollaborationTask,
  Department,
  DeploymentItem,
  DeviceSession,
  EnterpriseDashboardData,
  EnterpriseFeatureSummary,
  EnterpriseSearchFilter,
  EnterpriseSearchResult,
  SharedDocument,
  SharedFile,
  TransferItem,
  RolePermission,
  SecurityControl,
} from './domain';

const nowIso = () => new Date().toISOString();

const summaries: EnterpriseFeatureSummary[] = [
  {
    key: 'devices',
    title: 'Multi-Device Sync',
    subtitle: 'Sessions, trusted devices, recovery, expiry, and chat state synchronization.',
    icon: 'phone-portrait-outline',
    health: 'mocked',
    coverage: 86,
    updatedAt: nowIso(),
    stats: [
      { label: 'Devices', value: '4' },
      { label: 'Trusted', value: '3', tone: 'good' },
      { label: 'Conflicts', value: '1', tone: 'warn' },
    ],
    capabilities: ['Current device indicator', 'Per-device logout', 'Trusted device verification', 'Session expiry recovery', 'Sync state rollups'],
    limitations: ['Backed by local mock data until a device-session API is available.'],
  },
  {
    key: 'ai',
    title: 'AI Assistance',
    subtitle: 'Smart replies, summaries, translations, voice helpers, search intent, and spam signals.',
    icon: 'sparkles-outline',
    health: 'mocked',
    coverage: 78,
    updatedAt: nowIso(),
    stats: [
      { label: 'Suggestions', value: '18' },
      { label: 'Spam risk', value: '2%', tone: 'good' },
      { label: 'Mock mode', value: 'On', tone: 'warn' },
    ],
    capabilities: ['Smart replies', 'Action-item extraction', 'Language detection', 'Translation', 'Text-to-speech and voice-to-text interfaces'],
    limitations: ['No external AI API key is configured; responses are deterministic mock outputs.'],
  },
  {
    key: 'admin',
    title: 'Admin Dashboard',
    subtitle: 'RBAC, departments, audit logs, broadcasts, suspension, scheduling, and delivery status.',
    icon: 'shield-checkmark-outline',
    health: 'mocked',
    coverage: 80,
    updatedAt: nowIso(),
    stats: [
      { label: 'Users', value: '248' },
      { label: 'Departments', value: '8' },
      { label: 'High risk', value: '1', tone: 'danger' },
    ],
    capabilities: ['Role and permission matrix', 'User suspension states', 'Device session viewing', 'Audit trail', 'Broadcast delivery tracking'],
    limitations: ['RBAC enforcement is UI/service scoped until server policies exist.'],
  },
  {
    key: 'search',
    title: 'Advanced Search',
    subtitle: 'Messages, people, files, tasks, notes, events, announcements, filters, and saved searches.',
    icon: 'search-outline',
    health: 'ready',
    coverage: 84,
    updatedAt: nowIso(),
    stats: [
      { label: 'Indexed', value: '12k' },
      { label: 'Saved', value: '4' },
      { label: 'Recent', value: '9' },
    ],
    capabilities: ['Entity filters', 'Date filters', 'Department filters', 'Starred filter', 'Highlighted result snippets'],
    limitations: ['Full-text index currently runs against mock aggregates.'],
  },
  {
    key: 'files',
    title: 'Shared Files',
    subtitle: 'Categories, previews, upload/download queues, duplicates, favorites, and versions.',
    icon: 'folder-open-outline',
    health: 'mocked',
    coverage: 81,
    updatedAt: nowIso(),
    stats: [
      { label: 'Storage', value: '18.6 GB' },
      { label: 'Queued', value: '3' },
      { label: 'Duplicates', value: '2', tone: 'warn' },
    ],
    capabilities: ['Upload queue controls', 'Download manager states', 'Duplicate detection', 'Version history', 'Restore-ready metadata'],
    limitations: ['Pause, resume, retry, and restore are local state transitions pending real file APIs.'],
  },
  {
    key: 'security',
    title: 'Security & Compliance',
    subtitle: '2FA, login approval, trusted devices, privacy, retention, export, deletion, policy surfaces.',
    icon: 'lock-closed-outline',
    health: 'warning',
    coverage: 76,
    updatedAt: nowIso(),
    stats: [
      { label: '2FA', value: 'On', tone: 'good' },
      { label: 'Policies', value: 'Ready' },
      { label: 'E2EE', value: 'Not claimed', tone: 'warn' },
    ],
    capabilities: ['Encryption validation UI', 'Security code verification status', 'Consent controls', 'Data export and deletion flows', 'Retention preferences'],
    limitations: ['Real end-to-end encryption is not implemented and is intentionally not claimed.'],
  },
  {
    key: 'accessibility',
    title: 'Accessibility',
    subtitle: 'Screen readers, dynamic type, contrast, keyboard focus, reduced motion, alt text.',
    icon: 'accessibility-outline',
    health: 'ready',
    coverage: 88,
    updatedAt: nowIso(),
    stats: [
      { label: 'Labels', value: 'Added' },
      { label: 'Contrast', value: 'High' },
      { label: 'Motion', value: 'Reduced' },
    ],
    capabilities: ['Accessible controls', 'System preference architecture', 'Visible focus-friendly sizing', 'Logical reading order', 'Media alt text fields'],
    limitations: ['Voice-command execution points are architecture-only until native voice services are added.'],
  },
  {
    key: 'analytics',
    title: 'Analytics',
    subtitle: 'Usage, crashes, API/socket performance, devices, versions, departments, growth.',
    icon: 'bar-chart-outline',
    health: 'mocked',
    coverage: 83,
    updatedAt: nowIso(),
    stats: [
      { label: 'DAU', value: '1.8k' },
      { label: 'Crash-free', value: '99.6%', tone: 'good' },
      { label: 'API p95', value: '310ms' },
    ],
    capabilities: ['Summary cards', 'Trend sparklines', 'Filters', 'Refresh', 'Drill-down metadata', 'Export-ready rows'],
    limitations: ['Metrics are generated locally until monitoring backends are connected.'],
  },
  {
    key: 'deployment',
    title: 'Production Release',
    subtitle: 'Store readiness, permissions, signing docs, environments, monitoring, flags, rollback.',
    icon: 'rocket-outline',
    health: 'needsBackend',
    coverage: 72,
    updatedAt: nowIso(),
    stats: [
      { label: 'Android', value: 'Ready' },
      { label: 'iOS', value: 'Docs' },
      { label: 'CI', value: 'Draft' },
    ],
    capabilities: ['Release config review', 'Privacy and terms checklist', 'Feature flags', 'Release tracking', 'Rollback plan'],
    limitations: ['Native signing and CI secrets must be configured outside this local workspace.'],
  },
];

const devices: DeviceSession[] = [
  { id: 'dev-current', name: 'Pixel 8 Pro', platform: 'android', appVersion: '1.0.0', location: 'Chennai, IN', ipAddress: '10.0.0.24', lastActiveAt: nowIso(), expiresAt: '2026-08-13T09:30:00.000Z', trustState: 'current', syncState: 'synced', current: true },
  { id: 'dev-ios', name: 'iPhone 15', platform: 'ios', appVersion: '1.0.0', location: 'Bengaluru, IN', ipAddress: '10.0.1.12', lastActiveAt: '2026-08-06T05:40:00.000Z', expiresAt: '2026-08-12T07:00:00.000Z', trustState: 'trusted', syncState: 'syncing', current: false },
  { id: 'dev-web', name: 'Chrome on Windows', platform: 'web', appVersion: 'web-2026.08', location: 'Hyderabad, IN', ipAddress: '172.16.4.8', lastActiveAt: '2026-08-05T18:15:00.000Z', expiresAt: '2026-08-10T10:00:00.000Z', trustState: 'trusted', syncState: 'offline', current: false },
  { id: 'dev-pending', name: 'MacBook Air', platform: 'desktop', appVersion: 'desktop-0.9', location: 'Unknown', ipAddress: '192.168.1.85', lastActiveAt: '2026-08-04T14:21:00.000Z', expiresAt: '2026-08-07T14:21:00.000Z', trustState: 'pending', syncState: 'conflict', current: false },
];

const tasks: CollaborationTask[] = [
  { id: 'task-1', chatName: 'Design Team', title: 'Review onboarding copy', assignees: ['Mallika', 'Krishna'], priority: 'high', dueAt: '2026-08-07T12:00:00.000Z', status: 'inProgress', reminderAt: '2026-08-07T09:00:00.000Z', commentCount: 8, attachmentCount: 2 },
  { id: 'task-2', chatName: 'Product Squad', title: 'Attach Q3 launch deck', assignees: ['Suresh'], priority: 'urgent', dueAt: '2026-08-06T15:30:00.000Z', status: 'blocked', commentCount: 4, attachmentCount: 1 },
  { id: 'task-3', chatName: 'Dev Standup', title: 'Confirm websocket retry budget', assignees: ['Arun', 'Ajith'], priority: 'medium', dueAt: '2026-08-09T10:00:00.000Z', status: 'todo', reminderAt: '2026-08-08T16:00:00.000Z', commentCount: 2, attachmentCount: 0 },
];

const documents: SharedDocument[] = [
  { id: 'doc-1', title: 'Enterprise rollout plan', owner: 'Mallika', version: 7, updatedAt: '2026-08-06T05:30:00.000Z', category: 'document', reviewers: ['Yashwanth', 'Suji'] },
  { id: 'doc-2', title: 'Security review notes', owner: 'Sathish', version: 3, updatedAt: '2026-08-05T13:10:00.000Z', category: 'document', reviewers: ['Bharath'] },
];

const events: CalendarEvent[] = [
  { id: 'event-1', title: 'Release readiness review', startsAt: '2026-08-07T10:30:00.000Z', rsvp: { yes: 18, maybe: 4, no: 1 }, reminderEnabled: true },
  { id: 'event-2', title: 'Design critique', startsAt: '2026-08-08T14:00:00.000Z', rsvp: { yes: 9, maybe: 3, no: 0 }, reminderEnabled: true },
];

const announcements: Announcement[] = [
  { id: 'ann-1', title: 'Maintenance window', channel: 'Company Updates', scheduledAt: '2026-08-06T18:00:00.000Z', readOnly: true, deliveryStatus: 'scheduled', reach: 248 },
  { id: 'ann-2', title: 'Policy acknowledgement due', channel: 'Compliance', readOnly: true, deliveryStatus: 'delivered', reach: 212 },
];

const aiInsights: AiInsight[] = [
  { id: 'ai-1', type: 'summary', title: 'Design Team summary', input: '42 recent messages', output: 'Team aligned on login fixes, pending launch-copy approval.', confidence: 0.91, language: 'en', mocked: true },
  { id: 'ai-2', type: 'actionItem', title: 'Action items', input: 'Product Squad chat', output: 'Ask Suresh for Q3 deck; confirm API retry limit.', confidence: 0.84, language: 'en', mocked: true },
  { id: 'ai-3', type: 'translation', title: 'Tamil to English', input: 'Deployment note', output: 'The release build can start after QA signs off.', confidence: 0.79, language: 'ta', mocked: true },
  { id: 'ai-4', type: 'spam', title: 'Spam scan', input: 'External invite', output: 'Low risk; sender is known and links match organization domain.', confidence: 0.95, mocked: true },
];

const adminUsers: AdminUser[] = [
  { id: 'user-1', name: 'Mallika', department: 'Design', role: 'Admin', suspended: false, devices: 2, lastSeenAt: nowIso() },
  { id: 'user-2', name: 'Suresh Kumar', department: 'Product', role: 'Manager', suspended: false, devices: 3, lastSeenAt: '2026-08-06T03:45:00.000Z' },
  { id: 'user-3', name: 'External Contractor', department: 'Partners', role: 'Guest', suspended: true, devices: 1, lastSeenAt: '2026-07-31T15:00:00.000Z' },
];

const departments: Department[] = [
  { id: 'dep-design', name: 'Design', users: 34, storageGb: 2.8, messageVolume: 5400 },
  { id: 'dep-product', name: 'Product', users: 41, storageGb: 4.2, messageVolume: 7200 },
  { id: 'dep-eng', name: 'Engineering', users: 96, storageGb: 8.1, messageVolume: 15400 },
];

const roles: RolePermission[] = [
  { role: 'Owner', permissions: ['users.manage', 'roles.manage', 'devices.logout', 'audit.read', 'broadcast.send'] },
  { role: 'Admin', permissions: ['users.manage', 'devices.read', 'audit.read', 'broadcast.schedule'] },
  { role: 'Member', permissions: ['messages.send', 'files.upload', 'tasks.update'] },
  { role: 'Guest', permissions: ['messages.read', 'tasks.read'] },
];

const auditEvents: AuditEvent[] = [
  { id: 'audit-1', actor: 'Mallika', action: 'Scheduled broadcast', target: 'Company Updates', createdAt: nowIso(), risk: 'low' },
  { id: 'audit-2', actor: 'Sathish', action: 'Suspended user', target: 'External Contractor', createdAt: '2026-08-05T11:44:00.000Z', risk: 'medium' },
  { id: 'audit-3', actor: 'System', action: 'Blocked untrusted login', target: 'MacBook Air', createdAt: '2026-08-04T14:20:00.000Z', risk: 'high' },
];

const savedSearches: EnterpriseSearchFilter[] = [
  { query: 'launch blockers', entity: 'all', dateRange: 'week', department: 'Product', starredOnly: false },
  { query: 'security review', entity: 'document', dateRange: 'month', department: 'Engineering', starredOnly: true },
];

const searchResults: EnterpriseSearchResult[] = [
  { id: 'search-1', entity: 'message', title: 'Login OTP flow', snippet: 'OTP input should start empty and navigate immediately after verify.', source: 'Design Team', createdAt: nowIso(), highlightedTerms: ['OTP', 'navigate'] },
  { id: 'search-2', entity: 'task', title: 'Attach Q3 launch deck', snippet: 'Blocked until the latest deck is uploaded.', source: 'Product Squad', createdAt: '2026-08-06T04:30:00.000Z', highlightedTerms: ['launch', 'deck'] },
  { id: 'search-3', entity: 'document', title: 'Security review notes', snippet: 'Trusted-device policy and retention rules need sign-off.', source: 'Shared Files', createdAt: '2026-08-05T13:10:00.000Z', highlightedTerms: ['security', 'retention'] },
];

const files: SharedFile[] = [
  { id: 'file-1', name: 'Q3-launch-deck.pdf', category: 'document', owner: 'Suresh', sizeMb: 18.4, versions: 5, favorite: true, downloaded: true, updatedAt: '2026-08-06T04:22:00.000Z' },
  { id: 'file-2', name: 'onboarding-demo.mov', category: 'media', owner: 'Krishna', sizeMb: 220, versions: 2, favorite: false, downloaded: false, updatedAt: '2026-08-05T10:18:00.000Z' },
  { id: 'file-3', name: 'security-review.pdf', category: 'document', owner: 'Sathish', sizeMb: 6.3, versions: 3, favorite: true, downloaded: false, updatedAt: '2026-08-05T13:10:00.000Z', duplicateOf: 'doc-2' },
];

const transfers: TransferItem[] = [
  { id: 'transfer-1', fileName: 'analytics-export.csv', direction: 'download', progress: 66, status: 'running' },
  { id: 'transfer-2', fileName: 'launch-assets.zip', direction: 'upload', progress: 30, status: 'paused' },
  { id: 'transfer-3', fileName: 'contractor-policy.pdf', direction: 'upload', progress: 0, status: 'queued' },
];

const securityControls: SecurityControl[] = [
  { id: 'sec-2fa', title: 'Two-factor authentication', enabled: true, status: 'valid', description: 'OTP login approval is required for new devices.' },
  { id: 'sec-trusted', title: 'Trusted devices', enabled: true, status: 'attention', description: 'One device is waiting for approval.' },
  { id: 'sec-export', title: 'Data export and deletion', enabled: true, status: 'valid', description: 'GDPR-ready request records are modeled locally.' },
  { id: 'sec-e2ee', title: 'Encryption validation', enabled: false, status: 'disabled', description: 'No real end-to-end encryption claim is made in this build.' },
];

const accessibilityPreferences: AccessibilityPreference[] = [
  { id: 'a11y-reader', title: 'Screen reader labels', enabled: true, source: 'app' },
  { id: 'a11y-font', title: 'Dynamic font support', enabled: true, source: 'system' },
  { id: 'a11y-contrast', title: 'High contrast readiness', enabled: true, source: 'app' },
  { id: 'a11y-motion', title: 'Reduced motion architecture', enabled: true, source: 'system' },
  { id: 'a11y-keyboard', title: 'Keyboard navigation sizing', enabled: true, source: 'app' },
];

const analytics = [
  { id: 'dau', label: 'Daily active users', value: '1,842', delta: '+8.2%', trend: [8, 9, 9, 11, 12, 14, 16] },
  { id: 'messages', label: 'Messages sent', value: '84.7k', delta: '+12.4%', trend: [12, 11, 13, 14, 15, 18, 20] },
  { id: 'calls', label: 'Call minutes', value: '6.1k', delta: '+3.6%', trend: [5, 6, 6, 7, 6, 8, 9] },
  { id: 'storage', label: 'Storage used', value: '18.6 GB', delta: '+1.1 GB', trend: [10, 11, 13, 14, 15, 17, 18] },
  { id: 'crashes', label: 'Crash-free sessions', value: '99.6%', delta: '+0.2%', trend: [96, 97, 98, 98, 99, 99, 99] },
  { id: 'api', label: 'API p95 latency', value: '310 ms', delta: '-42 ms', trend: [420, 390, 360, 340, 330, 320, 310] },
];

const deployment: DeploymentItem[] = [
  { id: 'release-config', title: 'Android and iOS release configuration', status: 'ready', note: 'Expo SDK 54 config is present; signing profiles still need secure credentials.' },
  { id: 'store-assets', title: 'Icons, splash, permissions, store assets', status: 'ready', note: 'App icons and permission strings exist in app.json.' },
  { id: 'privacy-terms', title: 'Privacy Policy and Terms', status: 'ready', note: 'Policy surfaces are modeled in security settings and documented for store review.' },
  { id: 'monitoring', title: 'Monitoring, feature flags, release tracking', status: 'blocked', note: 'Requires production monitoring provider credentials.' },
  { id: 'ci', title: 'GitHub Actions and Fastlane structure', status: 'ready', note: 'Documented scaffold; CI secrets are external dependencies.' },
  { id: 'rollback', title: 'Rollback strategy', status: 'ready', note: 'Use EAS update channels and staged releases once project credentials are configured.' },
];

export class MockEnterpriseRepository {
  async loadDashboard(): Promise<EnterpriseDashboardData> {
    await new Promise((resolve) => setTimeout(resolve, 240));

    return {
      accessibilityPreferences,
      adminUsers,
      aiInsights,
      analytics,
      announcements,
      auditEvents,
      departments,
      deployment,
      devices,
      documents,
      events,
      files,
      generatedAt: nowIso(),
      roles,
      savedSearches,
      searchHistory: ['otp verify', 'launch blockers', 'security review', 'shared notes'],
      searchResults,
      securityControls,
      summaries,
      tasks,
      transfers,
    };
  }

  async search(filter: EnterpriseSearchFilter): Promise<EnterpriseSearchResult[]> {
    const data = await this.loadDashboard();
    const query = filter.query.trim().toLowerCase();

    return data.searchResults.filter((result) => {
      const matchesEntity = filter.entity === 'all' || result.entity === filter.entity;
      const matchesQuery = !query || `${result.title} ${result.snippet} ${result.source}`.toLowerCase().includes(query);
      return matchesEntity && matchesQuery;
    });
  }

  async logoutDevice(deviceId: string, current: DeviceSession[]): Promise<DeviceSession[]> {
    return current.filter((device) => device.id !== deviceId || device.current);
  }

  async approveDevice(deviceId: string, current: DeviceSession[]): Promise<DeviceSession[]> {
    return current.map((device) => (
      device.id === deviceId ? { ...device, trustState: 'trusted', syncState: 'syncing' } : device
    ));
  }

  async updateTransfer(transferId: string, status: TransferItem['status'], current: TransferItem[]): Promise<TransferItem[]> {
    return current.map((item) => (item.id === transferId ? { ...item, status } : item));
  }
}

export const mockEnterpriseRepository = new MockEnterpriseRepository();
