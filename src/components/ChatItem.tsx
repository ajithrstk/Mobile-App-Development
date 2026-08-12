import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useRef } from 'react';
import type { Chat, ChatStatus } from '../types';
import type { ThemeColors } from '../utils/colors';

type ChatItemProps = {
  chat: Chat;
  onPress: (chat: Chat) => void;
  onLongPress: (chat: Chat) => void;
  onArchive: (chat: Chat) => void;
  onPin: (chat: Chat) => void;
  colors: ThemeColors;
};

const SWIPE_LIMIT = 112;
const SWIPE_THRESHOLD = 82;

function getStatusIcon(status: ChatStatus) {
  if (status === 'failed') {
    return 'alert-circle-outline';
  }

  if (status === 'sending') {
    return 'time-outline';
  }

  if (status === 'sent') {
    return 'checkmark';
  }

  return 'checkmark-done';
}

export default function ChatItem({ chat, onPress, onLongPress, onArchive, onPin, colors }: ChatItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start();
  };

  const completeSwipe = (direction: 'left' | 'right') => {
    Animated.timing(translateX, {
      toValue: direction === 'left' ? -SWIPE_LIMIT : SWIPE_LIMIT,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      if (direction === 'left') {
        onArchive(chat);
      } else {
        onPin(chat);
      }

      resetPosition();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const nextValue = Math.max(-SWIPE_LIMIT, Math.min(SWIPE_LIMIT, gestureState.dx));
        translateX.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -SWIPE_THRESHOLD) {
          completeSwipe('left');
          return;
        }

        if (gestureState.dx >= SWIPE_THRESHOLD) {
          completeSwipe('right');
          return;
        }

        resetPosition();
      },
      onPanResponderTerminate: resetPosition,
    }),
  ).current;

  const statusColor = chat.status === 'read' || chat.status === 'seen' ? colors.read : chat.status === 'failed' ? colors.danger : colors.delivered;
  const isTyping = chat.status === 'typing';

  return (
    <View style={styles.swipeShell}>
      <View style={[styles.swipeAction, styles.pinAction]}>
        <MaterialCommunityIcons name="pin" size={22} color={colors.badgeText} />
        <Text style={styles.swipeActionText}>Pin</Text>
      </View>
      <View style={[styles.swipeAction, styles.archiveAction]}>
        <Ionicons name="archive-outline" size={22} color={colors.badgeText} />
        <Text style={styles.swipeActionText}>Archive</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          activeOpacity={0.72}
          onLongPress={() => onLongPress(chat)}
          onPress={() => onPress(chat)}
          style={styles.container}
        >
          <View>
            <Image source={chat.avatar} style={styles.avatar} />
            {chat.online && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>{chat.name}</Text>
                {chat.verified && (
                  <Ionicons name="checkmark-circle" size={15} color={colors.verified} style={styles.inlineIcon} />
                )}
                {chat.pinned && (
                  <MaterialCommunityIcons name="pin" size={15} color={colors.textMuted} style={styles.inlineIcon} />
                )}
              </View>
              <Text style={[styles.time, chat.unread > 0 && styles.unreadTime]}>{chat.time}</Text>
            </View>
            <View style={styles.bottomRow}>
              {isTyping ? (
                <Text numberOfLines={1} style={styles.typingText}>typing...</Text>
              ) : (
                <>
                  <Ionicons
                    name={getStatusIcon(chat.status)}
                    size={16}
                    color={statusColor}
                    style={styles.statusIcon}
                  />
                  <Text numberOfLines={1} style={styles.message}>{chat.lastMessage}</Text>
                </>
              )}
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
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  swipeShell: {
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  swipeAction: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: SWIPE_LIMIT,
  },
  pinAction: {
    backgroundColor: colors.swipePin,
    left: 0,
  },
  archiveAction: {
    backgroundColor: colors.swipeArchive,
    right: 0,
  },
  swipeActionText: {
    color: colors.badgeText,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    minHeight: 74,
    paddingLeft: 14,
  },
  avatar: {
    borderRadius: 26,
    height: 52,
    width: 52,
  },
  onlineIndicator: {
    backgroundColor: colors.accent,
    borderColor: colors.background,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 2,
    height: 14,
    position: 'absolute',
    right: 1,
    width: 14,
  },
  content: {
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    minHeight: 74,
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
    fontSize: 16,
    fontWeight: '400',
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
    fontWeight: '500',
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  statusIcon: {
    marginRight: 4,
  },
  message: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    paddingRight: 8,
  },
  typingText: {
    color: colors.accent,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '500',
  },
});
