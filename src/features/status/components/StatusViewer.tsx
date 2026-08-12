import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { StatusReplyKind, StatusUpdate } from '../types/status.types';
import { formatStatusTime } from '../utils/statusUtils';
import type { ThemeColors } from '../../../utils/colors';
import StatusProgress from './StatusProgress';
import StatusReaction from './StatusReaction';

type StatusViewerProps = {
  colors: ThemeColors;
  statuses: StatusUpdate[];
  initialIndex: number;
  onClose: () => void;
  onView: (statusId: string) => void;
  onReact: (status: StatusUpdate, emoji: string) => void;
  onReply: (status: StatusUpdate, kind: StatusReplyKind, value: string) => void;
  onDelete: (status: StatusUpdate) => void;
  onDetails: (status: StatusUpdate) => void;
  onCopy: (status: StatusUpdate) => void;
  onDownload: (status: StatusUpdate) => void;
  onForward: (status: StatusUpdate) => void;
  onOwnerReply: (status: StatusUpdate) => void;
  onShare: (status: StatusUpdate) => void;
};

const tickMs = 100;

function durationForStatus(status: StatusUpdate): number {
  if (status.kind === 'video') {
    return Math.min(Math.max(status.media?.durationMs ?? 7000, 5000), 30000);
  }

  return 5200;
}

function canUseImage(status: StatusUpdate): boolean {
  return Boolean(status.media?.uri && !status.media.uri.startsWith('mock://'));
}

export default function StatusViewer({
  colors,
  initialIndex,
  onClose,
  onCopy,
  onDelete,
  onDetails,
  onDownload,
  onForward,
  onOwnerReply,
  onReact,
  onReply,
  onShare,
  onView,
  statuses,
}: StatusViewerProps) {
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(statuses.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewedPanelOpen, setViewedPanelOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeStatus = statuses[activeIndex];
  const elapsedRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 16 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 52) {
          onClose();
        }
      },
    }),
  ).current;

  const viewedHandleResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -18) {
          setViewedPanelOpen(true);
          setPaused(true);
        }

        if (gestureState.dy > 18) {
          setViewedPanelOpen(false);
          setPaused(false);
        }
      },
    }),
  ).current;

  const goPrevious = useCallback(() => {
    if (activeIndex === 0) {
      setProgress(0);
      return;
    }

    setActiveIndex((currentIndex) => currentIndex - 1);
  }, [activeIndex]);

  const goNext = useCallback(() => {
    if (activeIndex >= statuses.length - 1) {
      onClose();
      return;
    }

    setActiveIndex((currentIndex) => currentIndex + 1);
  }, [activeIndex, onClose, statuses.length]);

  useEffect(() => {
    if (activeStatus) {
      onView(activeStatus.id);
    }

    elapsedRef.current = 0;
    setProgress(0);
    setViewedPanelOpen(false);
  }, [activeStatus, onView]);

  useEffect(() => {
    if (!activeStatus || paused) {
      return undefined;
    }

    const interval = setInterval(() => {
      elapsedRef.current += tickMs;
      const nextProgress = elapsedRef.current / durationForStatus(activeStatus);
      setProgress(Math.min(1, nextProgress));

      if (nextProgress >= 1) {
        goNext();
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [activeStatus, goNext, paused]);

  if (!activeStatus) {
    return (
      <View style={styles.emptyShell}>
        <Text style={styles.emptyText}>Status is no longer available</Text>
      </View>
    );
  }

  function sendReply(kind: StatusReplyKind): void {
    const value = kind === 'text' ? replyText.trim() : `mock://${kind}-status-reply/${Date.now()}`;

    if (!value) {
      return;
    }

    setReplyText('');
    onReply(activeStatus, kind, value);
  }

  const isMine = activeStatus.owner.isMe;

  return (
    <View style={styles.shell} {...panResponder.panHandlers}>
      <StatusProgress activeIndex={activeIndex} colors={colors} count={statuses.length} progress={progress} />
      <View style={styles.header}>
        {isMine && (
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={styles.avatar}>
          {activeStatus.owner.avatar ? (
            <Image source={activeStatus.owner.avatar} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{activeStatus.owner.name.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.name}>{isMine ? 'My status' : activeStatus.owner.name}</Text>
          <Text style={styles.time}>{isMine ? 'Just now' : formatStatusTime(activeStatus.createdAt)}</Text>
        </View>
        {!isMine && (
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {activeStatus.kind === 'text' ? (
          <View style={[styles.textStatus, { backgroundColor: activeStatus.textStyle?.backgroundColor ?? '#128C7E' }]}>
            <Text
              style={[
                styles.statusText,
                {
                  color: activeStatus.textStyle?.color ?? '#FFFFFF',
                  fontSize: activeStatus.textStyle?.fontSize ?? 28,
                  textAlign: activeStatus.textStyle?.alignment ?? 'center',
                },
              ]}
            >
              {activeStatus.text}
            </Text>
          </View>
        ) : canUseImage(activeStatus) && activeStatus.kind === 'image' ? (
          <Image resizeMode="contain" source={{ uri: activeStatus.media?.uri }} style={styles.media} />
        ) : (
          <View style={styles.videoCard}>
            <Ionicons name={activeStatus.kind === 'video' ? 'play-circle' : 'image-outline'} size={72} color="#FFFFFF" />
            <Text style={styles.videoTitle}>{activeStatus.media?.fileName ?? (activeStatus.kind === 'video' ? 'Video status' : 'Image status')}</Text>
            {activeStatus.kind === 'video' && <Text style={styles.videoSubtitle}>Only this status is active</Text>}
          </View>
        )}
        {activeStatus.caption && <Text style={styles.caption}>{activeStatus.caption}</Text>}
      </View>

      <View style={styles.tapLayer} pointerEvents="box-none">
        <Pressable delayLongPress={160} onLongPress={() => setPaused(true)} onPress={goPrevious} onPressOut={() => setPaused(false)} style={styles.tapHalf} />
        <Pressable delayLongPress={160} onLongPress={() => setPaused(true)} onPress={goNext} onPressOut={() => setPaused(false)} style={styles.tapHalf} />
      </View>

      {!isMine && <StatusReaction colors={colors} onReact={(emoji) => onReact(activeStatus, emoji)} />}

      <View style={styles.footer}>
        {isMine ? (
          viewedPanelOpen ? (
            <View style={styles.viewerSheet} {...viewedHandleResponder.panHandlers}>
              <Pressable onPress={() => { setViewedPanelOpen(false); setPaused(false); }} style={styles.collapseHandle}>
                <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
              </Pressable>
              <View style={styles.viewerSheetHeader}>
                <TouchableOpacity onPress={() => onDetails(activeStatus)} style={styles.viewerCountButton}>
                  <Text style={styles.viewerCountText}>Viewed by {activeStatus.viewers.length}</Text>
                </TouchableOpacity>
                <SheetAction icon="chatbubble-ellipses" label="Reply" onPress={() => onOwnerReply(activeStatus)} />
                <SheetAction icon="trash" label="Delete" onPress={() => onDelete(activeStatus)} />
                <SheetAction icon="share-social" label="Share" onPress={() => onShare(activeStatus)} />
              </View>
              <View style={styles.viewerList}>
                {activeStatus.viewers.length === 0 ? (
                  <Text style={styles.noViewersText}>No views yet</Text>
                ) : (
                  activeStatus.viewers.map((viewer) => (
                    <TouchableOpacity key={`${viewer.contactId}-${viewer.viewedAt}`} onPress={() => onOwnerReply(activeStatus)} style={styles.viewerRow}>
                      <Text numberOfLines={1} style={styles.viewerName}>{viewer.name}</Text>
                      <Text style={styles.viewerTime}>{formatStatusTime(viewer.viewedAt)}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => { setViewedPanelOpen(true); setPaused(true); }}
              style={styles.viewerHandle}
              {...viewedHandleResponder.panHandlers}
            >
              <Text style={styles.viewerHandleText}>Viewed by {activeStatus.viewers.length}</Text>
              <Ionicons name="chevron-up" size={24} color="#FFFFFF" style={styles.viewerHandleArrow} />
            </Pressable>
          )
        ) : (
          <View style={styles.replyRow}>
            <TextInput
              onChangeText={setReplyText}
              placeholder="Reply"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={styles.replyInput}
              value={replyText}
            />
            <TouchableOpacity onPress={() => sendReply('voice')} style={styles.replyIcon}>
              <Ionicons name="mic-outline" size={21} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sendReply('image')} style={styles.replyIcon}>
              <Ionicons name="image-outline" size={21} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sendReply('text')} style={styles.sendButton}>
              <Ionicons name="send" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function SheetAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={sheetActionStyles.button}>
      <Ionicons name={icon} size={21} color="#FFFFFF" />
      <Text style={sheetActionStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const sheetActionStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    minWidth: 56,
    paddingHorizontal: 4,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 18,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    avatarImage: {
      borderRadius: 18,
      height: 36,
      width: 36,
    },
    avatarInitial: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    caption: {
      bottom: 88,
      color: '#FFFFFF',
      fontSize: 16,
      left: 24,
      position: 'absolute',
      right: 24,
      textAlign: 'center',
    },
    collapseHandle: {
      alignItems: 'center',
      backgroundColor: '#20C7A8',
      minHeight: 22,
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    emptyShell: {
      alignItems: 'center',
      backgroundColor: '#000000',
      flex: 1,
      justifyContent: 'center',
    },
    emptyText: {
      color: '#FFFFFF',
      fontSize: 15,
    },
    footer: {
      bottom: 0,
      left: 0,
      paddingBottom: 18,
      paddingHorizontal: 12,
      position: 'absolute',
      right: 0,
      zIndex: 5,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingTop: 10,
      position: 'absolute',
      top: 14,
      zIndex: 4,
    },
    headerText: {
      flex: 1,
      marginLeft: 10,
      minWidth: 0,
    },
    iconButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    media: {
      backgroundColor: '#000000',
      flex: 1,
      width: '100%',
    },
    name: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    replyIcon: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 34,
    },
    replyInput: {
      borderColor: 'rgba(255,255,255,0.62)',
      borderRadius: 22,
      borderWidth: 1,
      color: '#FFFFFF',
      flex: 1,
      fontSize: 15,
      minHeight: 42,
      paddingHorizontal: 16,
    },
    replyRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 21,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    sheetIconButton: {
      alignItems: 'center',
      height: 50,
      justifyContent: 'center',
      width: 46,
    },
    shell: {
      backgroundColor: '#000000',
      flex: 1,
    },
    statusText: {
      fontWeight: '500',
      lineHeight: 38,
      paddingHorizontal: 24,
    },
    tapHalf: {
      flex: 1,
    },
    tapLayer: {
      bottom: 88,
      flexDirection: 'row',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 82,
      zIndex: 2,
    },
    textStatus: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    time: {
      color: 'rgba(255,255,255,0.76)',
      fontSize: 12,
      marginTop: 2,
    },
    videoCard: {
      alignItems: 'center',
      backgroundColor: '#151515',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    videoSubtitle: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      marginTop: 6,
    },
    videoTitle: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
      marginTop: 12,
    },
    viewerCountButton: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 56,
      paddingLeft: 16,
    },
    viewerCountText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    viewerHandle: {
      alignItems: 'center',
      alignSelf: 'center',
      minHeight: 58,
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    viewerHandleArrow: {
      marginTop: -2,
    },
    viewerHandleText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    viewerList: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      justifyContent: 'center',
      minHeight: 62,
      paddingHorizontal: 14,
    },
    viewerName: {
      color: '#111B21',
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
    },
    viewerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 34,
      width: '100%',
    },
    viewerSheet: {
      borderRadius: 6,
      overflow: 'hidden',
    },
    viewerSheetHeader: {
      alignItems: 'center',
      backgroundColor: '#20C7A8',
      flexDirection: 'row',
      minHeight: 56,
    },
    viewerTime: {
      color: '#667781',
      fontSize: 12,
      marginLeft: 12,
    },
    noViewersText: {
      color: '#667781',
      fontSize: 14,
    },
  });
