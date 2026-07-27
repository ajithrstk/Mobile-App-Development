import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../utils/colors';

export default function ChatItem({ chat, onPress, onLongPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onLongPress={() => onLongPress(chat)}
      onPress={() => onPress(chat)}
      style={styles.container}
    >
      <Image source={chat.avatar} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>{chat.name}</Text>
            {chat.pinned && (
              <MaterialCommunityIcons name="pin" size={15} color={colors.textMuted} style={styles.inlineIcon} />
            )}
          </View>
          <Text style={[styles.time, chat.unread > 0 && styles.unreadTime]}>{chat.time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text numberOfLines={1} style={styles.message}>{chat.lastMessage}</Text>
          <View style={styles.meta}>
            {chat.muted && (
              <Ionicons name="volume-mute-outline" size={17} color={colors.textMuted} style={styles.metaIcon} />
            )}
            {chat.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{chat.unread > 99 ? '99+' : chat.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    minHeight: 78,
    paddingLeft: 14,
  },
  avatar: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  content: {
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    minHeight: 78,
    paddingRight: 14,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingRight: 8,
  },
  name: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  inlineIcon: {
    marginLeft: 5,
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
  },
  unreadTime: {
    color: colors.accent,
    fontWeight: '700',
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  message: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    paddingRight: 8,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minWidth: 34,
  },
  metaIcon: {
    marginRight: 6,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.badgeText,
    fontSize: 12,
    fontWeight: '700',
  },
});
