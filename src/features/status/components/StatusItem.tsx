import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StatusThread, StatusUpdate } from '../types/status.types';
import { formatStatusTime } from '../utils/statusUtils';
import type { ThemeColors } from '../../../utils/colors';

type StatusItemProps = {
  colors: ThemeColors;
  thread?: StatusThread;
  myStatuses?: StatusUpdate[];
  onCreate?: () => void;
  onMenu?: () => void;
  onPress: () => void;
};

export default function StatusItem({ colors, myStatuses, onCreate, onMenu, onPress, thread }: StatusItemProps) {
  const styles = createStyles(colors);
  const isMine = Boolean(myStatuses);
  const statuses = myStatuses ?? thread?.statuses ?? [];
  const latest = statuses[0] ?? thread?.statuses[thread.statuses.length - 1];
  const owner = latest?.owner ?? thread?.owner;
  const unseen = thread?.unseenCount ?? 0;
  const ringStyle = unseen > 0 ? styles.unseenRing : statuses.length > 0 ? styles.viewedRing : styles.emptyRing;

  return (
    <Pressable onPress={statuses.length > 0 ? onPress : onCreate} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.avatarRing, ringStyle]}>
        {owner?.avatar ? (
          <Image source={owner.avatar} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{owner?.name?.charAt(0) ?? 'M'}</Text>
          </View>
        )}
        {isMine && (
          <Pressable onPress={onCreate} style={styles.addBadge}>
            <Ionicons name="add" size={16} color={colors.badgeText} />
          </Pressable>
        )}
      </View>
      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={styles.title}>{isMine ? 'My status' : owner?.name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {latest ? `${formatStatusTime(latest.createdAt)}${unseen > 0 ? ` • ${unseen} new` : ''}` : 'Tap to add status update'}
        </Text>
      </View>
      {isMine && statuses.length > 0 && (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onMenu?.();
          }}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    addBadge: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderColor: colors.background,
      borderRadius: 11,
      borderWidth: 2,
      bottom: -2,
      height: 22,
      justifyContent: 'center',
      position: 'absolute',
      right: -2,
      width: 22,
    },
    avatar: {
      borderRadius: 25,
      height: 50,
      width: 50,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 25,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    avatarInitial: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '500',
    },
    avatarRing: {
      alignItems: 'center',
      borderRadius: 31,
      borderWidth: 2,
      height: 62,
      justifyContent: 'center',
      marginRight: 12,
      width: 62,
    },
    emptyRing: {
      borderColor: colors.divider,
    },
    menuButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    pressed: {
      backgroundColor: colors.surface,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 74,
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
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    unseenRing: {
      borderColor: colors.primary,
    },
    viewedRing: {
      borderColor: colors.textMuted,
    },
  });
