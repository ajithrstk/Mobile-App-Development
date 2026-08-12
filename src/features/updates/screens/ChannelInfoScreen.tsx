import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { updatesActions, useUpdates } from '../state/updatesSlice';
import { channelService } from '../services/channelService';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelInfoScreen'>;

export default function ChannelInfoScreen({ navigation, route }: Props) {
  const { channelId } = route.params;
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const channel = useUpdates((state) => state.channels.find((item) => item.id === channelId));
  const isAdmin = Boolean(channel && channelService.canAdmin(channel));

  useEffect(() => {
    if (!channel) {
      void updatesActions.initialize();
    }
  }, [channel]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </Pressable>
        <Text style={styles.headerTitle}>Channel info</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            {channel?.avatarUri ? (
              <Image source={{ uri: channel.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.initial}>{channel?.name.charAt(0) ?? '?'}</Text>
            )}
          </View>
          <View style={styles.nameRow}>
            <Text numberOfLines={2} style={styles.name}>{channel?.name ?? 'Channel'}</Text>
            {channel?.verified && <Ionicons name="checkmark-circle" size={18} color={colors.verified} />}
          </View>
          <Text style={styles.username}>@{channel?.username ?? 'channel'}</Text>
          <Text style={styles.followers}>{channel?.followerCount.toLocaleString() ?? '0'} followers</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionText}>{channel?.description ?? 'Loading channel details...'}</Text>
        </View>
        {channel && (
          <View style={styles.section}>
            <ActionRow colors={colors} icon="notifications-outline" label="Mute updates">
              <Switch
                onValueChange={(muted) => void updatesActions.muteChannel(channel.id, muted)}
                thumbColor={channel.muted ? colors.primary : colors.surface}
                value={channel.muted}
              />
            </ActionRow>
            <Pressable onPress={() => void updatesActions.followChannel(channel.id, !channel.followed)} style={styles.actionRow}>
              <Ionicons name={channel.followed ? 'remove-circle-outline' : 'add-circle-outline'} size={22} color={colors.primary} />
              <Text style={styles.actionText}>{channel.followed ? 'Unfollow channel' : 'Follow channel'}</Text>
            </Pressable>
            <Pressable onPress={() => Alert.alert('Share channel', `@${channel.username}`)} style={styles.actionRow}>
              <Ionicons name="share-outline" size={22} color={colors.icon} />
              <Text style={styles.actionText}>Share channel</Text>
            </Pressable>
            {isAdmin && (
              <Pressable onPress={() => navigation.navigate('ChannelAdminScreen', { channelId: channel.id })} style={styles.actionRow}>
                <Ionicons name="create-outline" size={22} color={colors.icon} />
                <Text style={styles.actionText}>Channel tools</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionRow({ children, colors, icon, label }: { children: ReactNode; colors: ThemeColors; icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.actionRow}>
      <Ionicons name={icon} size={22} color={colors.icon} />
      <Text style={styles.actionText}>{label}</Text>
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 52,
      paddingHorizontal: 16,
    },
    actionText: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      marginLeft: 14,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 44,
      height: 88,
      justifyContent: 'center',
      marginBottom: 14,
      overflow: 'hidden',
      width: 88,
    },
    avatarImage: {
      height: 88,
      width: 88,
    },
    content: {
      paddingBottom: 32,
    },
    followers: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 8,
    },
    header: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 6,
      paddingVertical: 8,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    iconButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    initial: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '700',
    },
    name: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      marginRight: 5,
      textAlign: 'center',
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
      maxWidth: '100%',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    section: {
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingVertical: 8,
    },
    sectionText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 21,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    username: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 4,
    },
  });
