import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Channel } from '../types/updates.types';
import { formatUpdateTime } from '../utils/updatesUtils';
import type { ThemeColors } from '../../../utils/colors';

type ChannelItemProps = {
  channel: Channel;
  colors: ThemeColors;
  onFollow: (channel: Channel) => void;
  onOpen: (channel: Channel) => void;
};

export default function ChannelItem({ channel, colors, onFollow, onOpen }: ChannelItemProps) {
  const styles = createStyles(colors);

  return (
    <Pressable onPress={() => onOpen(channel)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        {channel.avatarUri ? (
          <Image source={{ uri: channel.avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.initial}>{channel.name.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>{channel.name}</Text>
          {channel.verified && <Ionicons name="checkmark-circle" size={15} color={colors.verified} />}
        </View>
        <Text numberOfLines={1} style={styles.subtitle}>{channel.latestUpdate ?? channel.description}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.time}>{formatUpdateTime(channel.latestAt)}</Text>
        {channel.unreadCount > 0 && <Text style={styles.unread}>{channel.unreadCount}</Text>}
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onFollow(channel);
          }}
          style={[styles.followButton, channel.followed && styles.followedButton]}
        >
          <Text style={[styles.followText, channel.followed && styles.followedText]}>{channel.followed ? 'Following' : 'Follow'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 25,
      height: 50,
      justifyContent: 'center',
      marginRight: 12,
      overflow: 'hidden',
      width: 50,
    },
    avatarImage: {
      height: 50,
      width: 50,
    },
    followedButton: {
      backgroundColor: colors.surface,
    },
    followedText: {
      color: colors.textMuted,
    },
    followButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      minHeight: 28,
      justifyContent: 'center',
      marginTop: 6,
      paddingHorizontal: 10,
    },
    followText: {
      color: colors.badgeText,
      fontSize: 12,
      fontWeight: '700',
    },
    initial: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    meta: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    name: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '600',
      marginRight: 4,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    pressed: {
      backgroundColor: colors.surface,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 72,
      paddingHorizontal: 16,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 3,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    time: {
      color: colors.textMuted,
      fontSize: 11,
    },
    unread: {
      backgroundColor: colors.primary,
      borderRadius: 9,
      color: colors.badgeText,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 4,
      minWidth: 18,
      overflow: 'hidden',
      paddingHorizontal: 5,
      textAlign: 'center',
    },
  });
