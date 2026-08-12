import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ChannelUpdate from '../components/ChannelUpdate';
import { updatesActions, useUpdates } from '../state/updatesSlice';
import { channelService } from '../services/channelService';
import type { Channel } from '../types/updates.types';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelScreen'>;
const emptyUpdates: never[] = [];

export default function ChannelScreen({ navigation, route }: Props) {
  const { channelId } = route.params;
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const channel = useUpdates((state) => state.channels.find((item) => item.id === channelId));
  const updates = useUpdates((state) => state.updatesByChannelId[channelId] ?? emptyUpdates);
  const hasMore = useUpdates((state) => state.channelHasMoreById[channelId] ?? true);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = Boolean(channel && channelService.canAdmin(channel));

  const loadFirstPage = useCallback(async () => {
    setRefreshing(true);
    await updatesActions.loadChannelUpdates(channelId, 0).catch(() => undefined);
    setPage(0);
    setRefreshing(false);
  }, [channelId]);

  useEffect(() => {
    if (!channel) {
      void updatesActions.initialize();
    }

    const cleanup = updatesActions.bindSocketEvents();
    void loadFirstPage();
    return cleanup;
  }, [channel, loadFirstPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || refreshing) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    void updatesActions.loadChannelUpdates(channelId, nextPage);
  }, [channelId, hasMore, page, refreshing]);

  const toggleFollow = useCallback((target: Channel) => {
    void updatesActions.followChannel(target.id, !target.followed);
  }, []);

  const toggleMute = useCallback((target: Channel) => {
    void updatesActions.muteChannel(target.id, !target.muted);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </Pressable>
        <Pressable disabled={!channel} onPress={() => navigation.navigate('ChannelInfoScreen', { channelId })} style={styles.headerTitle}>
          <View style={styles.avatar}>
            {channel?.avatarUri ? (
              <Image source={{ uri: channel.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.initial}>{channel?.name.charAt(0) ?? '?'}</Text>
            )}
          </View>
          <View style={styles.titleBlock}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.title}>{channel?.name ?? 'Channel'}</Text>
              {channel?.verified && <Ionicons name="checkmark-circle" size={15} color={colors.verified} />}
            </View>
            <Text numberOfLines={1} style={styles.subtitle}>{channel ? `${channel.followerCount.toLocaleString()} followers` : 'Loading updates'}</Text>
          </View>
        </Pressable>
        {isAdmin ? (
          <Pressable onPress={() => navigation.navigate('ChannelAdminScreen', { channelId })} style={styles.iconButton}>
            <Ionicons name="create-outline" size={22} color={colors.icon} />
          </Pressable>
        ) : (
          <Pressable disabled={!channel} onPress={() => channel && toggleMute(channel)} style={styles.iconButton}>
            <Ionicons name={channel?.muted ? 'notifications-off' : 'notifications-outline'} size={21} color={colors.icon} />
          </Pressable>
        )}
      </View>
      {channel && (
        <View style={styles.followBar}>
          <Text numberOfLines={1} style={styles.description}>{channel.description}</Text>
          <Pressable onPress={() => toggleFollow(channel)} style={[styles.followButton, channel.followed && styles.followedButton]}>
            <Text style={[styles.followText, channel.followed && styles.followedText]}>{channel.followed ? 'Following' : 'Follow'}</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={updates}
        initialNumToRender={8}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={refreshing ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No updates yet</Text>
            <Text style={styles.emptyText}>New text, media, and link updates from this channel will appear here.</Text>
          </View>
        )}
        ListFooterComponent={hasMore && updates.length > 0 ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : <View style={styles.footerSpace} />}
        maxToRenderPerBatch={8}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => void loadFirstPage()} refreshing={refreshing} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <ChannelUpdate
            colors={colors}
            onCopy={() => Alert.alert('Copied', item.text)}
            onForward={() => Alert.alert('Forward update', 'This update is ready to forward when the backend forwarding target is connected.')}
            onReact={(emoji) => void updatesActions.reactToUpdate(channelId, item.id, emoji)}
            onReport={() => Alert.alert('Report sent', 'This report is stored in the mock channel adapter.')}
            update={item}
          />
        )}
        removeClippedSubviews
        style={styles.list}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      height: 40,
      justifyContent: 'center',
      marginRight: 10,
      overflow: 'hidden',
      width: 40,
    },
    avatarImage: {
      height: 40,
      width: 40,
    },
    description: {
      color: colors.textMuted,
      flex: 1,
      fontSize: 13,
      marginRight: 12,
    },
    empty: {
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 48,
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
    followedButton: {
      backgroundColor: colors.surface,
    },
    followedText: {
      color: colors.textMuted,
    },
    followBar: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    followButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 16,
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    followText: {
      color: colors.badgeText,
      fontSize: 13,
      fontWeight: '700',
    },
    footerLoader: {
      paddingVertical: 16,
    },
    footerSpace: {
      height: 28,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 6,
      paddingVertical: 8,
    },
    headerTitle: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
    },
    iconButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    initial: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    list: {
      backgroundColor: colors.background,
      flex: 1,
    },
    loader: {
      marginTop: 32,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    title: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '700',
      marginRight: 4,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
  });
