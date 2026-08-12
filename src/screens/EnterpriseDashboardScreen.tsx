import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import { enterpriseActions, useEnterprise } from '../features/enterprise/enterpriseStore';
import type {
  AdminUser,
  AiInsight,
  Announcement,
  AuditEvent,
  CalendarEvent,
  CollaborationTask,
  Department,
  DeploymentItem,
  DeviceSession,
  EnterpriseFeatureKey,
  EnterpriseSearchResult,
  FileCategory,
  RolePermission,
  SecurityControl,
  SharedDocument,
  SharedFile,
  TransferItem,
} from '../features/enterprise/domain';
import { useNetworkState } from '../services/network/useNetworkState';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type EnterpriseNavigation = NativeStackNavigationProp<RootStackParamList, 'EnterpriseDashboardScreen'>;

type DashboardRow =
  | { id: string; type: 'device'; item: DeviceSession }
  | { id: string; type: 'task'; item: CollaborationTask }
  | { id: string; type: 'document'; item: SharedDocument }
  | { id: string; type: 'event'; item: CalendarEvent }
  | { id: string; type: 'announcement'; item: Announcement }
  | { id: string; type: 'ai'; item: AiInsight }
  | { id: string; type: 'adminUser'; item: AdminUser }
  | { id: string; type: 'department'; item: Department }
  | { id: string; type: 'role'; item: RolePermission }
  | { id: string; type: 'audit'; item: AuditEvent }
  | { id: string; type: 'search'; item: EnterpriseSearchResult }
  | { id: string; type: 'file'; item: SharedFile }
  | { id: string; type: 'transfer'; item: TransferItem }
  | { id: string; type: 'security'; item: SecurityControl }
  | { id: string; type: 'accessibility'; item: { id: string; title: string; enabled: boolean; source: string } }
  | { id: string; type: 'analytics'; item: { id: string; label: string; value: string; delta: string; trend: number[] } }
  | { id: string; type: 'deployment'; item: DeploymentItem };

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
const pageSize = 6;

function shortDate(value: string | undefined) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function titleForFeature(key: EnterpriseFeatureKey) {
  const labels: Record<EnterpriseFeatureKey, string> = {
    accessibility: 'Accessibility',
    admin: 'Admin',
    ai: 'AI',
    analytics: 'Analytics',
    collaboration: 'Collaboration',
    deployment: 'Deployment',
    devices: 'Devices',
    files: 'Files',
    search: 'Search',
    security: 'Security',
  };

  return labels[key];
}

function toneColor(colors: ThemeColors, tone?: string) {
  if (tone === 'danger') {
    return colors.danger;
  }

  if (tone === 'warn') {
    return '#B26A00';
  }

  if (tone === 'good') {
    return colors.accent;
  }

  return colors.text;
}

function ProgressBar({ colors, value }: { colors: ThemeColors; value: number }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
      <View style={[styles.progressFill, { backgroundColor: value > 80 ? colors.accent : colors.primary, width: `${Math.max(6, Math.min(100, value))}%` }]} />
    </View>
  );
}

function TrendBars({ colors, values }: { colors: ThemeColors; values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <View style={styles.trend} accessibilityRole="image" accessibilityLabel={`Trend with ${values.length} points`}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={[styles.trendBar, { backgroundColor: colors.primary, height: 10 + (value / max) * 34 }]} />
      ))}
    </View>
  );
}

function Pill({ colors, label, tone }: { colors: ThemeColors; label: string; tone?: string }) {
  return (
    <View style={[styles.pill, { borderColor: colors.divider }]}>
      <Text style={[styles.pillText, { color: toneColor(colors, tone) }]}>{label}</Text>
    </View>
  );
}

export default function EnterpriseDashboardScreen() {
  const colors = useThemeColors();
  const stylesForTheme = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<EnterpriseNavigation>();
  const data = useEnterprise((state) => state.data);
  const status = useEnterprise((state) => state.status);
  const error = useEnterprise((state) => state.error);
  const selectedFeature = useEnterprise((state) => state.selectedFeature);
  const filter = useEnterprise((state) => state.filter);
  const searchResults = useEnterprise((state) => state.searchResults);
  const { state: networkState } = useNetworkState();
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    void enterpriseActions.initialize();
  }, []);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [selectedFeature]);

  const selectedSummary = data?.summaries.find((summary) => summary.key === selectedFeature);

  const rows = useMemo<DashboardRow[]>(() => {
    if (!data) {
      return [];
    }

    if (selectedFeature === 'devices') {
      return data.devices.map((item) => ({ id: item.id, item, type: 'device' }));
    }

    if (selectedFeature === 'ai') {
      return data.aiInsights.map((item) => ({ id: item.id, item, type: 'ai' }));
    }

    if (selectedFeature === 'admin') {
      return [
        ...data.adminUsers.map((item) => ({ id: item.id, item, type: 'adminUser' as const })),
        ...data.departments.map((item) => ({ id: item.id, item, type: 'department' as const })),
        ...data.roles.map((item) => ({ id: item.role, item, type: 'role' as const })),
        ...data.auditEvents.map((item) => ({ id: item.id, item, type: 'audit' as const })),
      ];
    }

    if (selectedFeature === 'search') {
      return searchResults.map((item) => ({ id: item.id, item, type: 'search' }));
    }

    if (selectedFeature === 'files') {
      return [
        ...data.files.map((item) => ({ id: item.id, item, type: 'file' as const })),
        ...data.transfers.map((item) => ({ id: item.id, item, type: 'transfer' as const })),
      ];
    }

    if (selectedFeature === 'security') {
      return data.securityControls.map((item) => ({ id: item.id, item, type: 'security' }));
    }

    if (selectedFeature === 'accessibility') {
      return data.accessibilityPreferences.map((item) => ({ id: item.id, item, type: 'accessibility' }));
    }

    if (selectedFeature === 'analytics') {
      return data.analytics.map((item) => ({ id: item.id, item, type: 'analytics' }));
    }

    return data.deployment.map((item) => ({ id: item.id, item, type: 'deployment' }));
  }, [data, searchResults, selectedFeature]);

  const visibleRows = rows.slice(0, visibleCount);

  const refresh = async () => {
    setRefreshing(true);
    await enterpriseActions.refresh();
    setRefreshing(false);
  };

  const confirmDeviceLogout = (device: DeviceSession) => {
    Alert.alert('Log out device?', `This will revoke ${device.name}. Current device sessions cannot be removed here.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void enterpriseActions.logoutDevice(device) },
    ]);
  };

  const exportCurrentView = () => {
    Alert.alert('Export ready', `${titleForFeature(selectedFeature)} rows are ready for CSV/PDF export when a backend export target is connected.`);
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MainTabs');
  };

  const renderRow = ({ item }: { item: DashboardRow }) => {
    if (item.type === 'device') {
      const device = item.item;
      return (
        <View style={stylesForTheme.rowCard} accessible accessibilityLabel={`${device.name}, ${device.trustState}, ${device.syncState}`}>
          <View style={stylesForTheme.rowHeader}>
            <Ionicons name={device.platform === 'ios' ? 'phone-portrait-outline' : 'hardware-chip-outline'} size={22} color={colors.primary} />
            <View style={stylesForTheme.rowText}>
              <Text style={stylesForTheme.rowTitle}>{device.name}{device.current ? ' (current)' : ''}</Text>
              <Text style={stylesForTheme.rowSubtitle}>{device.location} • {device.appVersion} • {device.ipAddress}</Text>
            </View>
          </View>
          <View style={stylesForTheme.pillRow}>
            <Pill colors={colors} label={device.trustState} tone={device.trustState === 'pending' ? 'warn' : 'good'} />
            <Pill colors={colors} label={device.syncState} tone={device.syncState === 'conflict' ? 'danger' : 'normal'} />
            <Pill colors={colors} label={`Expires ${shortDate(device.expiresAt)}`} />
          </View>
          <View style={stylesForTheme.actionRow}>
            {device.trustState === 'pending' && <TouchableOpacity accessibilityRole="button" onPress={() => enterpriseActions.approveDevice(device)} style={stylesForTheme.smallButton}><Text style={stylesForTheme.smallButtonText}>Approve</Text></TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" disabled={device.current} onPress={() => confirmDeviceLogout(device)} style={[stylesForTheme.smallButton, device.current && stylesForTheme.disabledButton]}><Text style={stylesForTheme.smallButtonText}>Log out</Text></TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === 'task') {
      const task = item.item;
      return (
        <View style={stylesForTheme.rowCard}>
          <Text style={stylesForTheme.rowKicker}>{task.chatName}</Text>
          <Text style={stylesForTheme.rowTitle}>{task.title}</Text>
          <Text style={stylesForTheme.rowSubtitle}>Assignees: {task.assignees.join(', ')} • Due {shortDate(task.dueAt)}</Text>
          <View style={stylesForTheme.pillRow}>
            <Pill colors={colors} label={task.priority} tone={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warn' : undefined} />
            <Pill colors={colors} label={task.status} />
            <Pill colors={colors} label={`${task.commentCount} comments`} />
            <Pill colors={colors} label={`${task.attachmentCount} files`} />
          </View>
        </View>
      );
    }

    if (item.type === 'document') {
      const document = item.item;
      return <BasicRow colors={colors} icon="document-text-outline" title={document.title} subtitle={`Owner ${document.owner} • v${document.version} • ${document.reviewers.length} reviewers`} meta={shortDate(document.updatedAt)} />;
    }

    if (item.type === 'event') {
      const event = item.item;
      return <BasicRow colors={colors} icon="calendar-outline" title={event.title} subtitle={`RSVP yes ${event.rsvp.yes}, maybe ${event.rsvp.maybe}, no ${event.rsvp.no}`} meta={shortDate(event.startsAt)} />;
    }

    if (item.type === 'announcement') {
      const announcement = item.item;
      return <BasicRow colors={colors} icon="megaphone-outline" title={announcement.title} subtitle={`${announcement.channel} • ${announcement.readOnly ? 'Read-only' : 'Open replies'} • Reach ${announcement.reach}`} meta={announcement.deliveryStatus} />;
    }

    if (item.type === 'ai') {
      const insight = item.item;
      return (
        <View style={stylesForTheme.rowCard}>
          <Text style={stylesForTheme.rowKicker}>{insight.type}{insight.mocked ? ' • mock service' : ''}</Text>
          <Text style={stylesForTheme.rowTitle}>{insight.title}</Text>
          <Text style={stylesForTheme.rowSubtitle}>{insight.output}</Text>
          <ProgressBar colors={colors} value={Math.round(insight.confidence * 100)} />
        </View>
      );
    }

    if (item.type === 'adminUser') {
      const user = item.item;
      return <BasicRow colors={colors} icon="person-circle-outline" title={user.name} subtitle={`${user.department} • ${user.role} • ${user.devices} devices`} meta={user.suspended ? 'Suspended' : 'Active'} danger={user.suspended} />;
    }

    if (item.type === 'department') {
      const department = item.item;
      return <BasicRow colors={colors} icon="business-outline" title={department.name} subtitle={`${department.users} users • ${department.storageGb} GB • ${department.messageVolume} messages`} meta="Department" />;
    }

    if (item.type === 'role') {
      const role = item.item;
      return <BasicRow colors={colors} icon="key-outline" title={role.role} subtitle={role.permissions.join(', ')} meta={`${role.permissions.length} permissions`} />;
    }

    if (item.type === 'audit') {
      const audit = item.item;
      return <BasicRow colors={colors} icon="receipt-outline" title={`${audit.actor} ${audit.action}`} subtitle={audit.target} meta={audit.risk} danger={audit.risk === 'high'} />;
    }

    if (item.type === 'search') {
      const result = item.item;
      return <BasicRow colors={colors} icon="search-outline" title={result.title} subtitle={`${result.source} • ${result.snippet}`} meta={result.entity} />;
    }

    if (item.type === 'file') {
      const file = item.item;
      return <FileRow colors={colors} file={file} />;
    }

    if (item.type === 'transfer') {
      const transfer = item.item;
      return (
        <View style={stylesForTheme.rowCard}>
          <Text style={stylesForTheme.rowKicker}>{transfer.direction} • {transfer.status}</Text>
          <Text style={stylesForTheme.rowTitle}>{transfer.fileName}</Text>
          <ProgressBar colors={colors} value={transfer.progress} />
          <View style={stylesForTheme.actionRow}>
            <TouchableOpacity onPress={() => enterpriseActions.updateTransfer(transfer, transfer.status === 'paused' ? 'running' : 'paused')} style={stylesForTheme.smallButton}><Text style={stylesForTheme.smallButtonText}>{transfer.status === 'paused' ? 'Resume' : 'Pause'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => enterpriseActions.updateTransfer(transfer, 'queued')} style={stylesForTheme.smallButton}><Text style={stylesForTheme.smallButtonText}>Retry</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => enterpriseActions.updateTransfer(transfer, 'failed')} style={stylesForTheme.smallButton}><Text style={stylesForTheme.smallButtonText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === 'security') {
      const control = item.item;
      return <BasicRow colors={colors} icon="lock-closed-outline" title={control.title} subtitle={control.description} meta={control.status} danger={control.status === 'attention'} />;
    }

    if (item.type === 'accessibility') {
      const preference = item.item;
      return <BasicRow colors={colors} icon="accessibility-outline" title={preference.title} subtitle={`Source: ${preference.source}`} meta={preference.enabled ? 'Enabled' : 'Disabled'} />;
    }

    if (item.type === 'analytics') {
      const metric = item.item;
      return (
        <View style={stylesForTheme.rowCard}>
          <Text style={stylesForTheme.rowKicker}>{metric.delta}</Text>
          <Text style={stylesForTheme.metricValue}>{metric.value}</Text>
          <Text style={stylesForTheme.rowSubtitle}>{metric.label}</Text>
          <TrendBars colors={colors} values={metric.trend} />
        </View>
      );
    }

    const deploymentItem = item.item;
    return <BasicRow colors={colors} icon="rocket-outline" title={deploymentItem.title} subtitle={deploymentItem.note} meta={deploymentItem.status} danger={deploymentItem.status === 'blocked'} />;
  };

  if (status === 'loading' && !data) {
    return (
      <SafeAreaView style={stylesForTheme.safeArea}>
        <View style={stylesForTheme.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={stylesForTheme.loadingText}>Loading enterprise workspace</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stylesForTheme.safeArea}>
      <View style={stylesForTheme.header}>
        <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={goBack} style={stylesForTheme.backButton}>
          <Ionicons name="chevron-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        <View style={stylesForTheme.headerTextBlock}>
          <Text style={stylesForTheme.headerTitle}>Enterprise</Text>
          <Text numberOfLines={1} style={stylesForTheme.headerSubtitle}>{networkState} • {data ? `Updated ${shortDate(data.generatedAt)}` : 'Mock services ready'}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Export current dashboard" onPress={exportCurrentView} style={stylesForTheme.headerButton}>
          <Ionicons name="download-outline" size={22} color={colors.icon} />
        </TouchableOpacity>
      </View>
      <FlatList
        ListHeaderComponent={
          <View>
            <NetworkStatusBanner colors={colors} />
            {error && (
              <TouchableOpacity accessibilityRole="button" onPress={() => enterpriseActions.initialize(true)} style={stylesForTheme.errorBanner}>
                <Text style={stylesForTheme.errorText}>{error} Tap to retry.</Text>
              </TouchableOpacity>
            )}
            <FlatList
              accessibilityLabel="Enterprise feature selector"
              contentContainerStyle={stylesForTheme.featureList}
              data={data?.summaries ?? []}
              horizontal
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedFeature === item.key }}
                  activeOpacity={0.76}
                  onPress={() => enterpriseActions.selectFeature(item.key)}
                  style={[stylesForTheme.featureCard, selectedFeature === item.key && stylesForTheme.featureCardActive]}
                >
                  <Ionicons name={item.icon} size={24} color={selectedFeature === item.key ? colors.badgeText : colors.primary} />
                  <Text style={[stylesForTheme.featureTitle, selectedFeature === item.key && stylesForTheme.featureTitleActive]}>{item.title}</Text>
                  <Text style={[stylesForTheme.featureMeta, selectedFeature === item.key && stylesForTheme.featureTitleActive]}>{item.coverage}% • {item.health}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />
            {selectedSummary && (
              <View style={stylesForTheme.summaryBlock}>
                <Text style={stylesForTheme.sectionTitle}>{selectedSummary.title}</Text>
                <Text style={stylesForTheme.sectionSubtitle}>{selectedSummary.subtitle}</Text>
                <ProgressBar colors={colors} value={selectedSummary.coverage} />
                <View style={stylesForTheme.statGrid}>
                  {selectedSummary.stats.map((stat) => (
                    <View key={stat.label} style={stylesForTheme.statCard}>
                      <Text style={[stylesForTheme.statValue, { color: toneColor(colors, stat.tone) }]}>{stat.value}</Text>
                      <Text style={stylesForTheme.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={stylesForTheme.subhead}>Capabilities</Text>
                <Text style={stylesForTheme.bodyText}>{selectedSummary.capabilities.join(' • ')}</Text>
                <Text style={stylesForTheme.subhead}>Limitations</Text>
                <Text style={stylesForTheme.bodyText}>{selectedSummary.limitations.join(' ')}</Text>
              </View>
            )}
            {selectedFeature === 'search' && (
              <View style={stylesForTheme.searchBlock}>
                <TextInput
                  accessibilityLabel="Search enterprise content"
                  onChangeText={(query) => enterpriseActions.updateSearchFilter({ query })}
                  placeholder="Search messages, files, tasks, notes, events"
                  placeholderTextColor={colors.textMuted}
                  style={stylesForTheme.searchInput}
                  value={filter.query}
                />
                <View style={stylesForTheme.filterRow}>
                  {(['all', 'message', 'document', 'task', 'event'] as const).map((entity) => (
                    <TouchableOpacity key={entity} onPress={() => enterpriseActions.updateSearchFilter({ entity })} style={[stylesForTheme.filterButton, filter.entity === entity && stylesForTheme.filterButtonActive]}>
                      <Text style={[stylesForTheme.filterText, filter.entity === entity && stylesForTheme.filterTextActive]}>{entity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View style={stylesForTheme.listHeader}>
              <Text style={stylesForTheme.listHeaderText}>{titleForFeature(selectedFeature)} rows</Text>
              <Text style={stylesForTheme.listHeaderMeta}>Showing {Math.min(visibleCount, rows.length)} of {rows.length}</Text>
            </View>
          </View>
        }
        contentContainerStyle={stylesForTheme.list}
        data={visibleRows}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListEmptyComponent={
          <View style={stylesForTheme.empty}>
            <Ionicons name="file-tray-outline" size={38} color={colors.textMuted} />
            <Text style={stylesForTheme.emptyTitle}>No data found</Text>
            <Text style={stylesForTheme.emptySubtitle}>Adjust filters or refresh the mock service.</Text>
          </View>
        }
        ListFooterComponent={
          rows.length > visibleCount ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => setVisibleCount((current) => current + pageSize)} style={stylesForTheme.loadMoreButton}>
              <Text style={stylesForTheme.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          ) : <View style={stylesForTheme.footerSpace} />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />}
        renderItem={renderRow}
      />
    </SafeAreaView>
  );
}

function BasicRow({ colors, danger, icon, meta, subtitle, title }: { colors: ThemeColors; danger?: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; meta: string; subtitle: string; title: string }) {
  const stylesForTheme = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={stylesForTheme.rowCard} accessible accessibilityLabel={`${title}. ${subtitle}. ${meta}`}>
      <View style={stylesForTheme.rowHeader}>
        <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
        <View style={stylesForTheme.rowText}>
          <Text style={stylesForTheme.rowTitle}>{title}</Text>
          <Text style={stylesForTheme.rowSubtitle}>{subtitle}</Text>
        </View>
        <Text style={[stylesForTheme.rowMeta, danger && { color: colors.danger }]}>{meta}</Text>
      </View>
    </View>
  );
}

function FileRow({ colors, file }: { colors: ThemeColors; file: SharedFile }) {
  const stylesForTheme = useMemo(() => createStyles(colors), [colors]);
  const categoryIcon: Record<FileCategory, React.ComponentProps<typeof Ionicons>['name']> = {
    archive: 'archive-outline',
    audio: 'mic-outline',
    document: 'document-outline',
    link: 'link-outline',
    media: 'image-outline',
  };

  return (
    <View style={stylesForTheme.rowCard}>
      <View style={stylesForTheme.rowHeader}>
        <Ionicons name={categoryIcon[file.category]} size={22} color={colors.primary} />
        <View style={stylesForTheme.rowText}>
          <Text style={stylesForTheme.rowTitle}>{file.name}</Text>
          <Text style={stylesForTheme.rowSubtitle}>{file.owner} • {file.sizeMb} MB • {file.versions} versions</Text>
        </View>
      </View>
      <View style={stylesForTheme.pillRow}>
        {file.favorite && <Pill colors={colors} label="Favorite" tone="good" />}
        {file.downloaded && <Pill colors={colors} label="Downloaded" />}
        {file.duplicateOf && <Pill colors={colors} label="Duplicate" tone="warn" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { borderRadius: 8, height: 8, marginTop: 12, overflow: 'hidden' },
  progressFill: { borderRadius: 8, height: 8 },
  pill: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, marginRight: 8, marginTop: 8, paddingHorizontal: 9, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  trend: { alignItems: 'flex-end', flexDirection: 'row', height: 54, marginTop: 10 },
  trendBar: { borderRadius: 3, marginRight: 5, width: 12 },
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  backButton: { alignItems: 'center', borderColor: colors.divider, borderRadius: 8, borderWidth: 1, height: 42, justifyContent: 'center', marginRight: 10, width: 42 },
  bodyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  disabledButton: { opacity: 0.45 },
  empty: { alignItems: 'center', justifyContent: 'center', minHeight: 180, paddingHorizontal: 24 },
  emptySubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 5, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '500', marginTop: 10 },
  errorBanner: { backgroundColor: colors.surface, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, padding: 14 },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '500' },
  featureCard: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, marginRight: 10, minHeight: 110, padding: 12, width: 150 },
  featureCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  featureList: { paddingHorizontal: 16, paddingVertical: 14 },
  featureMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 6, textTransform: 'capitalize' },
  featureTitle: { color: colors.text, fontSize: 14, fontWeight: '500', marginTop: 10 },
  featureTitleActive: { color: colors.badgeText },
  filterButton: { borderColor: colors.divider, borderRadius: 8, borderWidth: 1, marginRight: 8, marginTop: 10, paddingHorizontal: 10, paddingVertical: 8 },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  filterText: { color: colors.text, fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  filterTextActive: { color: colors.badgeText },
  footerSpace: { height: 20 },
  header: { alignItems: 'center', backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, paddingHorizontal: 18, paddingTop: 16 + androidTopInset },
  headerButton: { alignItems: 'center', borderColor: colors.divider, borderRadius: 8, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  headerSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  headerTextBlock: { flex: 1, minWidth: 0 },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: '400' },
  list: { backgroundColor: colors.background, paddingBottom: 20 },
  listHeader: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  listHeaderMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  listHeaderText: { color: colors.text, fontSize: 14, fontWeight: '500', textTransform: 'uppercase' },
  loadMoreButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 8, marginTop: 10, minHeight: 44, justifyContent: 'center', paddingHorizontal: 24 },
  loadMoreText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '500', marginTop: 12 },
  metricValue: { color: colors.text, fontSize: 26, fontWeight: '500' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  rowCard: { backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14 },
  rowHeader: { alignItems: 'center', flexDirection: 'row' },
  rowKicker: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 5, textTransform: 'uppercase' },
  rowMeta: { color: colors.textMuted, flexShrink: 0, fontSize: 12, fontWeight: '500', marginLeft: 10, textTransform: 'capitalize' },
  rowSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  rowText: { flex: 1, marginLeft: 10, minWidth: 0 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '500' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  searchBlock: { backgroundColor: colors.background, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },
  searchInput: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  sectionSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '500' },
  smallButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, marginRight: 8, minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 },
  smallButtonText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  statCard: { backgroundColor: colors.surface, borderRadius: 8, flex: 1, marginRight: 8, minHeight: 68, padding: 10 },
  statGrid: { flexDirection: 'row', marginTop: 14 },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 4 },
  statValue: { fontSize: 18, fontWeight: '500' },
  subhead: { color: colors.text, fontSize: 13, fontWeight: '500', marginTop: 14, textTransform: 'uppercase' },
  summaryBlock: { backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, padding: 16 },
});
