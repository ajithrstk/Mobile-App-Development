import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import DeliveryStatus from './DeliveryStatus';
import FileMessage from './FileMessage';
import MediaMessage from './MediaMessage';
import ReactionBar from './ReactionBar';
import ReplyPreview from './ReplyPreview';
import VoiceMessage from './VoiceMessage';
import type { ChatMessage } from '../types/message';
import type { ThemeColors } from '../utils/colors';
import { formatMessageTime } from '../utils/chat';

type MessageBubbleProps = {
  message: ChatMessage;
  colors: ThemeColors;
  selected: boolean;
  onPress: (message: ChatMessage) => void;
  onLongPress: (message: ChatMessage) => void;
  onSwipeReply: (message: ChatMessage) => void;
  onReplyPress: (messageId: string) => void;
  onOpenMedia: (message: ChatMessage) => void;
  onRetryTransfer: (messageId: string) => void;
  onDownloadTransfer: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  searchQuery?: string;
  focused?: boolean;
};

const SWIPE_REPLY_THRESHOLD = 56;
const MAX_SWIPE_OFFSET = 74;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedText(text: string, query: string, styles: ReturnType<typeof createStyles>) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    const mentionPattern = /(@[A-Za-z][\w. -]{1,30})/g;
    const mentionParts = text.split(mentionPattern);

    return mentionParts.map((part, index) => (
      part.startsWith('@') ? (
        <Text key={`${part}-${index}`} style={styles.mention}>
          {part}
        </Text>
      ) : part
    ));
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (part.toLowerCase() !== trimmedQuery.toLowerCase()) {
      return part;
    }

    return (
      <Text key={`${part}-${index}`} style={styles.highlight}>
        {part}
      </Text>
    );
  });
}

export default function MessageBubble({
  message,
  colors,
  selected,
  onPress,
  onLongPress,
  onSwipeReply,
  onReplyPress,
  onOpenMedia,
  onRetryTransfer,
  onDownloadTransfer,
  onToggleReaction,
  onVotePoll,
  searchQuery = '',
  focused = false,
}: MessageBubbleProps) {
  const { width } = useWindowDimensions();
  const isMine = message.sender === 'me';
  const styles = useMemo(() => createStyles(colors, width), [colors, width]);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 95,
      friction: 9,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 14 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const nextOffset = Math.max(-MAX_SWIPE_OFFSET, Math.min(MAX_SWIPE_OFFSET, gestureState.dx));
        translateX.setValue(nextOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) >= SWIPE_REPLY_THRESHOLD) {
          onSwipeReply(message);
        }

        resetSwipe();
      },
      onPanResponderTerminate: resetSwipe,
    }),
  ).current;

  const bubbleStyles = [
    styles.bubble,
    isMine ? styles.sentBubble : styles.receivedBubble,
    selected && styles.selectedBubble,
    focused && styles.focusedBubble,
  ];

  return (
    <View style={[styles.row, isMine ? styles.sentRow : styles.receivedRow]}>
      <Animated.View
        style={{ opacity, transform: [{ translateX }, { translateY }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.82}
          onLongPress={() => onLongPress(message)}
          onPress={() => onPress(message)}
          style={bubbleStyles}
        >
          {message.replyTo && (
            <ReplyPreview preview={message.replyTo} colors={colors} compact onPress={onReplyPress} />
          )}
          {message.forwarded && (
            <View style={styles.forwardedRow}>
              <Ionicons name="arrow-redo-outline" size={12} color={colors.textMuted} />
              <Text style={styles.forwardedText}>Forwarded</Text>
            </View>
          )}
          {(message.kind === 'image' || message.kind === 'video') && (
            <MediaMessage
              colors={colors}
              message={message}
              onDownload={onDownloadTransfer}
              onOpen={onOpenMedia}
              onRetry={onRetryTransfer}
              width={width}
            />
          )}
          {(message.kind === 'file' || message.kind === 'audio') && (
            <FileMessage
              colors={colors}
              message={message}
              onDownload={onDownloadTransfer}
              onRetry={onRetryTransfer}
            />
          )}
          {message.kind === 'voice' && (
            <VoiceMessage colors={colors} message={message} width={width} />
          )}
          {message.kind === 'location' && (
            <View style={styles.locationCard}>
              <View style={styles.mapGrid}>
                <Ionicons name="location" size={28} color={colors.danger} />
              </View>
              <View style={styles.locationText}>
                <Text numberOfLines={1} style={styles.locationTitle}>{message.location?.title ?? 'Location'}</Text>
                <Text numberOfLines={2} style={styles.locationAddress}>{message.location?.address ?? 'Shared location'}</Text>
              </View>
            </View>
          )}
          {message.kind === 'poll' && message.poll && (
            <View style={styles.pollCard}>
              <Text style={styles.pollQuestion}>{message.poll.question}</Text>
              {message.poll.options.map((option) => {
                const totalVotes = Math.max(1, message.poll?.options.reduce((total, item) => total + item.votes, 0) ?? 1);
                const percent = Math.round((option.votes / totalVotes) * 100);

                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.72}
                    key={option.id}
                    onPress={() => onVotePoll(message.id, option.id)}
                    style={styles.pollOption}
                  >
                    <View style={[styles.pollFill, { width: `${percent}%` }]} />
                    <View style={styles.pollOptionContent}>
                      <Ionicons name={option.votedByMe ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={option.votedByMe ? colors.primary : colors.textMuted} />
                      <Text style={styles.pollOptionText}>{option.text}</Text>
                      <Text style={styles.pollPercent}>{percent}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.pollMeta}>{message.poll.allowMultiple ? 'Multiple answers' : 'Single answer'} • tap to vote</Text>
            </View>
          )}
          {message.text && (
            <Text style={styles.messageText}>
              {renderHighlightedText(message.text, searchQuery, styles)}
            </Text>
          )}
          {message.kind !== 'voice' && (
            <View style={styles.metaRow}>
              {message.starred && (
                <Ionicons name="star" size={12} color={colors.textMuted} style={styles.starIcon} />
              )}
              <Text style={styles.time}>{formatMessageTime(message.timestamp)}</Text>
              <DeliveryStatus status={message.status} colors={colors} />
            </View>
          )}
          {isMine && message.status === 'failed' && message.kind === 'text' && (
            <TouchableOpacity activeOpacity={0.72} onPress={() => onRetryTransfer(message.id)} style={styles.retryButton}>
              <Ionicons name="refresh" size={13} color={colors.danger} />
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          )}
          <ReactionBar
            colors={colors}
            reactions={message.reactions}
            onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)}
          />
          {isMine && <View style={[styles.tail, styles.sentTail]} />}
          {!isMine && <View style={[styles.tail, styles.receivedTail]} />}
          {selected && (
            <View style={styles.selectedIcon}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.accent} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, screenWidth: number) =>
  StyleSheet.create({
    row: {
      marginVertical: 1.5,
      paddingHorizontal: 10,
      position: 'relative',
    },
    sentRow: {
      alignItems: 'flex-end',
    },
    receivedRow: {
      alignItems: 'flex-start',
    },
    bubble: {
      borderRadius: 7,
      maxWidth: Math.min(screenWidth * 0.78, 440),
      minWidth: 86,
      paddingBottom: 4,
      paddingHorizontal: 8,
      paddingTop: 6,
    },
    sentBubble: {
      backgroundColor: colors.outgoingBubble,
      borderTopRightRadius: 3,
    },
    receivedBubble: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 3,
    },
    selectedBubble: {
      borderColor: colors.accent,
      borderWidth: 1,
    },
    focusedBubble: {
      borderColor: colors.verified,
      borderWidth: 1,
    },
    forwardedRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 3,
    },
    forwardedText: {
      color: colors.textMuted,
      fontSize: 11,
      fontStyle: 'italic',
      fontWeight: '400',
      marginLeft: 3,
    },
    messageText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400',
      paddingRight: 22,
    },
    highlight: {
      backgroundColor: colors.mode === 'dark' ? '#726514' : '#FFE066',
      color: colors.text,
      fontWeight: '500',
    },
    mention: {
      color: colors.primary,
      fontWeight: '500',
    },
    locationCard: {
      backgroundColor: colors.mode === 'dark' ? '#17251F' : '#D5E4DD',
      borderRadius: 7,
      marginBottom: 5,
      overflow: 'hidden',
      width: Math.min(screenWidth * 0.62, 330),
    },
    mapGrid: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#22342E' : '#C7DDD5',
      height: 96,
      justifyContent: 'center',
    },
    locationText: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    pollCard: {
      marginBottom: 5,
      minWidth: Math.min(screenWidth * 0.62, 330),
    },
    pollQuestion: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
      marginBottom: 8,
    },
    pollOption: {
      backgroundColor: colors.surface,
      borderColor: colors.divider,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 6,
      minHeight: 42,
      overflow: 'hidden',
    },
    pollFill: {
      backgroundColor: colors.mode === 'dark' ? '#164238' : '#D9F2EA',
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
    },
    pollOptionContent: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 42,
      paddingHorizontal: 10,
    },
    pollOptionText: {
      color: colors.text,
      flex: 1,
      fontSize: 14,
      fontWeight: '400',
      marginLeft: 8,
    },
    pollPercent: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 8,
    },
    pollMeta: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '400',
      marginTop: 6,
    },
    locationTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    locationAddress: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    metaRow: {
      alignItems: 'center',
      alignSelf: 'flex-end',
      flexDirection: 'row',
      marginTop: 2,
    },
    starIcon: {
      marginRight: 3,
    },
    time: {
      color: colors.textMuted,
      fontSize: 11,
    },
    retryButton: {
      alignItems: 'center',
      alignSelf: 'flex-end',
      flexDirection: 'row',
      minHeight: 24,
      paddingTop: 3,
    },
    retryText: {
      color: colors.danger,
      fontSize: 11,
      fontWeight: '500',
      marginLeft: 3,
    },
    tail: {
      borderTopColor: 'transparent',
      borderTopWidth: 9,
      height: 0,
      position: 'absolute',
      top: 0,
      width: 0,
    },
    sentTail: {
      borderLeftColor: colors.outgoingBubble,
      borderLeftWidth: 9,
      right: -7,
    },
    receivedTail: {
      borderRightColor: colors.background,
      borderRightWidth: 9,
      left: -7,
    },
    selectedIcon: {
      position: 'absolute',
      right: 4,
      top: 4,
    },
  });
