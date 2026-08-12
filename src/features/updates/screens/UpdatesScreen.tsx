import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ChannelItem from '../components/ChannelItem';
import StatusSection from '../components/StatusSection';
import { useChannels } from '../hooks/useChannels';
import type { Channel } from '../types/updates.types';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Row = { id: string; type: 'section'; title: string } | { id: string; type: 'channel'; channel: Channel };

function buildRows(channels: Channel[]): Row[] {
  const followed = channels.filter((channel) => channel.followed && !channel.muted);
  const discover = channels.filter((channel) => !channel.followed);
  const muted = channels.filter((channel) => channel.muted);
  const rows: Row[] = [];

  if (followed.length > 0) {
    rows.push({ id: 'followed-title', title: 'Channels', type: 'section' });
    rows.push(...followed.map((channel) => ({ channel, id: `followed-${channel.id}`, type: 'channel' as const })));
  }

  if (discover.length > 0) {
    rows.push({ id: 'discover-title', title: 'Find channels to follow', type: 'section' });
    rows.push(...discover.map((channel) => ({ channel, id: `discover-${channel.id}`, type: 'channel' as const })));
  }

  if (muted.length > 0) {
    rows.push({ id: 'muted-title', title: 'Muted channels', type: 'section' });
    rows.push(...muted.map((channel) => ({ channel, id: `muted-${channel.id}`, type: 'channel' as const })));
  }

  return rows;
}

export default function UpdatesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Navigation>();
  const { channels, error, followChannel, hasMore, loadMore, refresh, status } = useChannels();
  const rows = useMemo(() => buildRows(channels), [channels]);

  const openMenu = useCallback(() => {
    Alert.alert('Updates', 'Choose an action.', [
      { text: 'New channel', onPress: () => navigation.navigate('CreateChannelScreen') },
      { text: 'Broadcast lists', onPress: () => navigation.navigate('BroadcastListScreen') },
      { text: 'Search channels', onPress: () => navigation.navigate('ChannelSearchScreen') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [navigation]);

  const openChannel = useCallback((channel: Channel) => navigation.navigate('ChannelScreen', { channelId: channel.id }), [navigation]);
  const toggleFollow = useCallback((channel: Channel) => {
    void followChannel(channel.id, !channel.followed);
  }, [followChannel]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={styles.title}>Updates</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('ChannelSearchScreen')} style={styles.iconButton}>
            <Ionicons name="search-outline" size={22} color={colors.icon} />
          </Pressable>
          <Pressable onPress={openMenu} style={styles.iconButton}>
            <Ionicons name="ellipsis-vertical" size={21} color={colors.icon} />
          </Pressable>
        </View>
      </View>
      <FlatList
        data={rows}
        initialNumToRender={16}
        keyExtractor={(item) => item.id}
        ListFooterComponent={status === 'loading' && rows.length > 0 ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : <View style={styles.footerSpace} />}
        ListHeaderComponent={(
          <View>
            <StatusSection
              colors={colors}
              onCreateStatus={() => navigation.navigate('CreateStatusScreen', { initialMode: 'gallery' })}
              onOpenThread={(thread) => navigation.navigate('StatusViewerScreen', { thread })}
            />
            <View style={styles.quickActions}>
              <Pressable onPress={() => navigation.navigate('CreateStatusScreen', { initialMode: 'gallery' })} style={styles.quickButton}>
                <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
                <Text style={styles.quickText}>Status</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('BroadcastListScreen')} style={styles.quickButton}>
                <Ionicons name="megaphone-outline" size={19} color={colors.primary} />
                <Text style={styles.quickText}>Broadcasts</Text>
              </Pressable>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
        )}
        ListEmptyComponent={status === 'loading' ? <ActivityIndicator color={colors.primary} style={styles.emptyLoader} /> : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No channel updates</Text>
            <Text style={styles.emptyText}>Follow channels or create your own to see updates here.</Text>
          </View>
        )}
        maxToRenderPerBatch={10}
        onEndReached={() => {
          if (hasMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.45}
        refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => void refresh()} refreshing={status === 'loading'} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          item.type === 'section'
            ? <Text style={styles.sectionTitle}>{item.title}</Text>
            : <ChannelItem channel={item.channel} colors={colors} onFollow={toggleFollow} onOpen={openChannel} />
        )}
        removeClippedSubviews
        style={styles.list}
        windowSize={9}
      />
      <Pressable onPress={() => navigation.navigate('CreateChannelScreen')} style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.badgeText} />
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    empty: {
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 36,
    },
    emptyLoader: {
      marginTop: 24,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 5,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    fab: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 18,
      bottom: 18,
      height: 52,
      justifyContent: 'center',
      position: 'absolute',
      right: 18,
      width: 52,
    },
    footerLoader: {
      paddingVertical: 16,
    },
    footerSpace: {
      height: 82,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    headerActions: {
      flexDirection: 'row',
    },
    iconButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    list: {
      backgroundColor: colors.background,
      flex: 1,
    },
    quickActions: {
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    quickButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      flexDirection: 'row',
      marginRight: 10,
      minHeight: 36,
      paddingHorizontal: 12,
    },
    quickText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionTitle: {
      backgroundColor: colors.background,
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      paddingBottom: 5,
      paddingHorizontal: 16,
      paddingTop: 14,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '700',
    },
  });
