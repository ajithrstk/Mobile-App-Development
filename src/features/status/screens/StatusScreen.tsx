import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import StatusHeader from '../components/StatusHeader';
import StatusItem from '../components/StatusItem';
import { useStatusFeed } from '../hooks/useStatus';
import { statusActions } from '../state/statusSlice';
import type { StatusThread } from '../types/status.types';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type FeedRow =
  | { id: string; type: 'section'; title: string }
  | { id: string; type: 'thread'; thread: StatusThread };

function rowsFromSections(recent: StatusThread[], viewed: StatusThread[], muted: StatusThread[]): FeedRow[] {
  const rows: FeedRow[] = [];

  if (recent.length > 0) {
    rows.push({ id: 'recent-title', title: 'Recent updates', type: 'section' });
    rows.push(...recent.map((thread) => ({ id: `recent-${thread.owner.id}`, thread, type: 'thread' as const })));
  }

  if (viewed.length > 0) {
    rows.push({ id: 'viewed-title', title: 'Viewed updates', type: 'section' });
    rows.push(...viewed.map((thread) => ({ id: `viewed-${thread.owner.id}`, thread, type: 'thread' as const })));
  }

  if (muted.length > 0) {
    rows.push({ id: 'muted-title', title: 'Muted updates', type: 'section' });
    rows.push(...muted.map((thread) => ({ id: `muted-${thread.owner.id}`, thread, type: 'thread' as const })));
  }

  return rows;
}

export default function StatusScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Navigation>();
  const { error, feed, refresh, status } = useStatusFeed();
  const rows = useMemo(() => rowsFromSections(feed.recent, feed.viewed, feed.muted), [feed.muted, feed.recent, feed.viewed]);

  const openCreate = useCallback(
    (mode: 'text' | 'camera' | 'gallery' = 'text') => navigation.navigate('CreateStatusScreen', { initialMode: mode }),
    [navigation],
  );

  const openThread = useCallback(
    (thread: StatusThread, initialIndex = 0) => navigation.navigate('StatusViewerScreen', { initialIndex, thread }),
    [navigation],
  );

  const openMyStatusMenu = useCallback(() => {
    const latestStatus = feed.myStatuses[0];

    if (!latestStatus) {
      return;
    }

    Alert.alert('My status', 'Choose an option.', [
      {
        text: 'View',
        onPress: () => openThread({
          latestAt: latestStatus.createdAt,
          muted: false,
          owner: latestStatus.owner,
          statuses: feed.myStatuses,
          unseenCount: 0,
        }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void statusActions.deleteStatus(latestStatus.id);
        },
      },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: () => {
          feed.myStatuses.forEach((statusUpdate) => void statusActions.deleteStatus(statusUpdate.id));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [feed.myStatuses, openThread]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusHeader colors={colors} onCamera={() => openCreate('camera')} onPrivacy={() => openCreate('text')} onText={() => openCreate('text')} />
      <FlatList
        data={rows}
        initialNumToRender={14}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={10}
        refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => void refresh()} refreshing={status === 'loading'} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          item.type === 'section' ? (
            <Text style={styles.sectionTitle}>{item.title}</Text>
          ) : (
            <StatusItem colors={colors} onPress={() => openThread(item.thread)} thread={item.thread} />
          )
        )}
        ListHeaderComponent={(
          <View>
            <StatusItem colors={colors} myStatuses={feed.myStatuses} onCreate={() => openCreate('text')} onMenu={openMyStatusMenu} onPress={() => {
              if (feed.myStatuses[0]) {
                openThread({
                  latestAt: feed.myStatuses[0].createdAt,
                  muted: false,
                  owner: feed.myStatuses[0].owner,
                  statuses: feed.myStatuses,
                  unseenCount: 0,
                });
              }
            }} />
            {error && <Text style={styles.error}>{error}</Text>}
            {status === 'loading' && feed.myStatuses.length === 0 && rows.length === 0 && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          </View>
        )}
        ListEmptyComponent={status === 'loading' ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No recent updates</Text>
            <Text style={styles.emptyText}>Status updates from contacts will appear here.</Text>
          </View>
        )}
        removeClippedSubviews
        style={styles.list}
        windowSize={9}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    empty: {
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 48,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '500',
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    list: {
      backgroundColor: colors.background,
      flex: 1,
    },
    loader: {
      marginTop: 24,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionTitle: {
      backgroundColor: colors.background,
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
      textTransform: 'uppercase',
    },
  });
