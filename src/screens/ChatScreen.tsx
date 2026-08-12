import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AttachmentPreviewModal from '../components/AttachmentPreviewModal';
import ChatHeader from '../components/ChatHeader';
import DateSeparator from '../components/DateSeparator';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import MessageMenu from '../components/MessageMenu';
import SearchHeader from '../components/SearchHeader';
import { encryptionService } from '../encryption/encryptionService';
import {
  buildOutgoingMessage,
  createLocationAttachment,
  requestAudioAttachments,
  requestCameraAttachment,
  requestDocumentAttachments,
  requestGalleryAttachments,
} from '../services/mediaService';
import { downloadManager } from '../services/media/downloadManager';
import { CallMode } from '../calls/types/call';
import type { PendingAttachment } from '../services/mediaService';
import { useScreenMetric } from '../hooks/useScreenMetric';
import { messagesActions, useMessages } from '../state/messages/messagesStore';
import { groupsActions, useGroups } from '../features/groups/groupsStore';
import { usePresence } from '../state/presence/presenceStore';
import type { AttachmentOption, ChatMessage, MessageMenuAction, ReplyPreview } from '../types/message';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';
import { formatDateSeparator, getMessageDateKey, getMessagePreview } from '../utils/chat';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

type TimelineItem =
  | { type: 'date'; id: string; label: string }
  | { type: 'message'; id: string; message: ChatMessage };

const INITIAL_VISIBLE_MESSAGES = 50;
const EMPTY_MESSAGES: ChatMessage[] = [];

function createReplyPreview(message: ChatMessage): ReplyPreview {
  return {
    id: message.id,
    sender: message.sender,
    text: getMessagePreview(message),
  };
}

function buildTimeline(messages: ChatMessage[]): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  let activeDate = '';

  messages.forEach((message) => {
    const dateKey = getMessageDateKey(message.timestamp);

    if (dateKey !== activeDate) {
      activeDate = dateKey;
      timeline.push({
        type: 'date',
        id: `date-${dateKey}`,
        label: formatDateSeparator(message.timestamp),
      });
    }

    timeline.push({
      type: 'message',
      id: message.id,
      message,
    });
  });

  return timeline;
}

function formatVoiceDuration(durationMs: number): string {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getSearchableText(message: ChatMessage): string {
  return [
    message.text,
    message.fileName,
    message.file?.name,
    message.location?.title,
    message.location?.address,
    message.poll?.question,
    message.replyTo?.text,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function extractMentions(text: string): string[] {
  return Array.from(new Set((text.match(/@[A-Za-z][\w. -]{1,30}/g) ?? []).map((mention) => mention.trim())));
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chat = route.params?.chat;
  useScreenMetric('ChatScreen');
  const storeMessages = useMessages((state) => state.messagesByChat[chat.id] ?? EMPTY_MESSAGES);
  const chatError = useMessages((state) => state.errorByChat[chat.id]);
  const group = useGroups((state) => state.data.groups.find((item) => item.chatId === chat.id && !item.deleted));
  const typingName = usePresence((state) => state.typingByChatId[chat.id]);
  const listRef = useRef<FlatList<TimelineItem>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [activeMessage, setActiveMessage] = useState<ChatMessage | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentCaption, setAttachmentCaption] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);

  const timelineItems = useMemo(() => buildTimeline(messages), [messages]);
  const selectionCount = selectedMessageIds.size;
  const messageTimelineIndex = useMemo(() => {
    const map = new Map<string, number>();
    timelineItems.forEach((item, index) => {
      if (item.type === 'message') {
        map.set(item.message.id, index);
      }
    });

    return map;
  }, [timelineItems]);
  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return messages
      .filter((message) => getSearchableText(message).includes(normalizedQuery))
      .map((message) => message.id);
  }, [messages, searchQuery]);

  useEffect(() => {
    void messagesActions.loadChat(chat.id);

    return () => messagesActions.setActiveChat(null);
  }, [chat.id]);

  useEffect(() => {
    if (route.params.targetMessageId) {
      setMessages(storeMessages);
      setOlderMessages([]);
      return;
    }

    setMessages(storeMessages.slice(-INITIAL_VISIBLE_MESSAGES));
    setOlderMessages(storeMessages.slice(0, -INITIAL_VISIBLE_MESSAGES));
  }, [route.params.targetMessageId, storeMessages]);

  useEffect(() => {
    if (storeMessages.length > 0) {
      messagesActions.markSeen(chat.id);
    }
  }, [chat.id, storeMessages.length]);

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 220);

    return () => clearTimeout(scrollTimer);
  }, []);

  useEffect(() => {
    if (activeSearchIndex >= searchResults.length) {
      setActiveSearchIndex(Math.max(searchResults.length - 1, 0));
    }
  }, [activeSearchIndex, searchResults.length]);

  const scrollToBottom = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated });
    setShowScrollButton(false);
  }, []);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const targetIndex = messageTimelineIndex.get(messageId);

      if (targetIndex === undefined) {
        return;
      }

      listRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.5 });
      setFocusedMessageId(messageId);

      setTimeout(() => {
        setFocusedMessageId((currentId) => (currentId === messageId ? null : currentId));
      }, 1400);
    },
    [messageTimelineIndex],
  );

  useEffect(() => {
    const targetMessageId = route.params.targetMessageId;

    if (!targetMessageId || !messageTimelineIndex.has(targetMessageId)) {
      return;
    }

    if (route.params.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }

    const timer = setTimeout(() => scrollToMessage(targetMessageId), 320);
    return () => clearTimeout(timer);
  }, [messageTimelineIndex, route.params.searchQuery, route.params.targetMessageId, scrollToMessage]);

  const simulateTransfer = useCallback((messageIds: string[], mode: 'uploading' | 'downloading') => {
    const steps = [0.18, 0.38, 0.62, 0.82, 1];

    steps.forEach((progress, index) => {
      setTimeout(() => {
        messageIds.forEach((messageId) => {
          messagesActions.updateTransfer(chat.id, messageId, {
            progress,
            status: progress < 1 ? mode : 'complete',
          });
        });
      }, 260 + index * 310);
    });
  }, [chat.id]);

  useEffect(() => {
    if (!route.params.forwardedMessages || route.params.forwardedMessages.length === 0) {
      return;
    }

    setMessages((currentMessages) => [...currentMessages, ...(route.params.forwardedMessages ?? [])]);
    requestAnimationFrame(() => scrollToBottom(true));
  }, [route.params.forwardedMessages, scrollToBottom]);

  const clearSelection = useCallback(() => {
    setSelectedMessageIds(new Set());
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setActiveMessage(null);
    clearSelection();
  }, [clearSelection]);

  const toggleSelectedMessage = useCallback((messageId: string) => {
    setSelectedMessageIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(messageId)) {
        nextIds.delete(messageId);
      } else {
        nextIds.add(messageId);
      }

      return nextIds;
    });
  }, []);

  const openMessageMenu = useCallback((message: ChatMessage) => {
    setActiveMessage(message);
    setSelectedMessageIds(new Set([message.id]));
    setMenuVisible(true);
  }, []);

  const handleMessagePress = useCallback(
    (message: ChatMessage) => {
      if (selectionCount > 0) {
        toggleSelectedMessage(message.id);
      }
    },
    [selectionCount, toggleSelectedMessage],
  );

  const applyReply = useCallback((message: ChatMessage) => {
    setReplyTo(createReplyPreview(message));
    setMenuVisible(false);
    setActiveMessage(null);
    clearSelection();
  }, [clearSelection]);

  const loadOlderMessages = useCallback(() => {
    if (refreshing || olderMessages.length === 0) {
      return;
    }

    setRefreshing(true);

    setTimeout(() => {
      setMessages((currentMessages) => [...olderMessages, ...currentMessages]);
      setOlderMessages([]);
      setRefreshing(false);
    }, 450);
  }, [olderMessages, refreshing]);

  const sendMessage = useCallback(() => {
    const trimmedText = inputText.trim();

    if (!trimmedText) {
      return;
    }

    const mentions = extractMentions(trimmedText);

    if (mentions.length === 0) {
      void messagesActions.sendMessage(chat, trimmedText, replyTo ?? undefined);
    } else {
      const mentionMessage: ChatMessage = {
        id: `mention-${Date.now()}`,
        kind: 'text',
        mentions,
        replyTo: replyTo ?? undefined,
        sender: 'me',
        status: 'sending',
        text: trimmedText,
        timestamp: new Date().toISOString(),
      };

      void messagesActions.sendPreparedMessage(chat, mentionMessage);
    }
    setInputText('');
    setReplyTo(null);
    requestAnimationFrame(() => scrollToBottom(true));
  }, [chat, inputText, replyTo, scrollToBottom]);

  const openAttachmentPreview = useCallback((attachments: PendingAttachment[]) => {
    if (attachments.length === 0) {
      return;
    }

    setPendingAttachments(attachments);
    setAttachmentCaption('');
  }, []);

  const sendPendingAttachments = useCallback(() => {
    if (pendingAttachments.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const mediaMessages = pendingAttachments.map((attachment, index) => {
      const message = buildOutgoingMessage(attachment, timestamp, index, replyTo ?? undefined);

      if (attachmentCaption.trim() && (message.kind === 'image' || message.kind === 'video')) {
        return {
          ...message,
          text: attachmentCaption.trim(),
        };
      }

      return message;
    });

    mediaMessages.forEach((message) => {
      void messagesActions.sendPreparedMessage(chat, message);
    });
    setPendingAttachments([]);
    setAttachmentCaption('');
    setReplyTo(null);
    simulateTransfer(
      mediaMessages
        .filter((message) => message.transferStatus === 'uploading')
        .map((message) => message.id),
      'uploading',
    );
    requestAnimationFrame(() => scrollToBottom(true));
  }, [attachmentCaption, chat, pendingAttachments, replyTo, scrollToBottom, simulateTransfer]);

  const handleAttachmentOptionPress = useCallback(
    async (option: AttachmentOption) => {
      try {
        if (option === 'gallery') {
          openAttachmentPreview(await requestGalleryAttachments());
          return;
        }

        if (option === 'camera') {
          openAttachmentPreview(await requestCameraAttachment());
          return;
        }

        if (option === 'document') {
          openAttachmentPreview(await requestDocumentAttachments());
          return;
        }

        if (option === 'audio') {
          openAttachmentPreview(await requestAudioAttachments());
          return;
        }

        if (option === 'location') {
          openAttachmentPreview([createLocationAttachment()]);
          return;
        }

        const labels: Record<AttachmentOption, string> = {
          document: 'Document',
          camera: 'Camera',
          gallery: 'Photos & Videos',
          audio: 'Audio',
          location: 'Location',
          contact: 'Contact',
          poll: 'Poll',
        };

        if (option === 'poll') {
          const pollMessage: ChatMessage = {
            id: `poll-${Date.now()}`,
            kind: 'poll',
            poll: {
              allowMultiple: false,
              options: [
                { id: 'poll-option-1', text: 'Today', votes: 3 },
                { id: 'poll-option-2', text: 'Tomorrow', votes: 5 },
                { id: 'poll-option-3', text: 'Next week', votes: 1 },
              ],
              question: 'When should we do this?',
            },
            replyTo: replyTo ?? undefined,
            sender: 'me',
            status: 'sending',
            timestamp: new Date().toISOString(),
          };

          void messagesActions.sendPreparedMessage(chat, pollMessage);
          setReplyTo(null);
          requestAnimationFrame(() => scrollToBottom(true));
          return;
        }

        Alert.alert(labels[option], `${labels[option]} sharing will open from this control.`);
      } catch (error) {
        Alert.alert('Attachment unavailable', error instanceof Error ? error.message : 'Could not open this attachment type.');
      }
    },
    [openAttachmentPreview],
  );

  const handleMenuAction = useCallback(
    (action: MessageMenuAction) => {
      if (!activeMessage) {
        return;
      }

      if (action === 'reply') {
        applyReply(activeMessage);
        return;
      }

      if (action === 'forward') {
        navigation.navigate('ForwardSelectionScreen', { sourceChat: chat, messages: [activeMessage] });
        closeMenu();
        return;
      }

      if (action === 'copy') {
        Alert.alert('Copied', activeMessage.text ?? 'Only text messages can be copied.');
        closeMenu();
        return;
      }

      if (action === 'star') {
        messagesActions.toggleStar(chat.id, [activeMessage.id]);
        closeMenu();
        return;
      }

      if (action === 'share') {
        Alert.alert('Share', 'Share sheet simulated for this local-only demo.');
        closeMenu();
        return;
      }

      if (action === 'report') {
        Alert.alert('Report message?', 'This report is stored as a local demo action only.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report', onPress: closeMenu, style: 'destructive' },
        ]);
        return;
      }

      if (action === 'pin') {
        if (!group) {
          Alert.alert('Pinned messages', 'Message pins are available in groups.');
          closeMenu();
          return;
        }

        const pinnedMessageIds = group.pinnedMessageIds.includes(activeMessage.id)
          ? group.pinnedMessageIds.filter((messageId) => messageId !== activeMessage.id)
          : [activeMessage.id, ...group.pinnedMessageIds].slice(0, 3);
        groupsActions.updateGroup(group.id, { pinnedMessageIds });
        closeMenu();
        return;
      }

      Alert.alert('Delete message?', 'Choose how you want to delete this message.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for me',
          onPress: () => {
            messagesActions.deleteForMe(chat.id, [activeMessage.id]);
            closeMenu();
          },
          style: 'destructive',
        },
        {
          text: 'Delete for everyone',
          onPress: () => {
            messagesActions.deleteForEveryone(chat.id, [activeMessage.id]);
            closeMenu();
          },
          style: 'destructive',
        },
      ]);
    },
    [activeMessage, applyReply, chat, closeMenu, group, navigation],
  );

  const deleteSelectedMessages = useCallback(() => {
    if (selectionCount === 0) {
      return;
    }

    const idsToDelete = [...selectedMessageIds];
    Alert.alert('Delete messages?', `Delete ${selectionCount} selected message${selectionCount === 1 ? '' : 's'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete for me',
        onPress: () => {
          messagesActions.deleteForMe(chat.id, idsToDelete);
          clearSelection();
        },
        style: 'destructive',
      },
      {
        text: 'Delete for everyone',
        onPress: () => {
          messagesActions.deleteForEveryone(chat.id, idsToDelete);
          clearSelection();
        },
        style: 'destructive',
      },
    ]);
  }, [chat.id, clearSelection, selectedMessageIds, selectionCount]);

  const starSelectedMessages = useCallback(() => {
    if (selectionCount === 0) {
      return;
    }

    const selectedMessages = messages.filter((message) => selectedMessageIds.has(message.id));
    const shouldStar = selectedMessages.some((message) => !message.starred);
    messagesActions.toggleStar(chat.id, [...selectedMessageIds], shouldStar);
    clearSelection();
  }, [chat.id, clearSelection, messages, selectedMessageIds, selectionCount]);

  const copySelectedMessages = useCallback(() => {
    const copyText = messages
      .filter((message) => selectedMessageIds.has(message.id) && message.text)
      .map((message) => message.text)
      .join('\n');
    Alert.alert('Copied', copyText || 'Only text messages can be copied.');
    clearSelection();
  }, [clearSelection, messages, selectedMessageIds]);

  const shareSelectedMessages = useCallback(() => {
    if (selectionCount === 0) {
      return;
    }

    Alert.alert('Share', `${selectionCount} message${selectionCount === 1 ? '' : 's'} ready to share.`);
    clearSelection();
  }, [clearSelection, selectionCount]);

  const reportSelectedMessages = useCallback(() => {
    if (selectionCount === 0) {
      return;
    }

    Alert.alert('Report messages?', 'This report is stored as a local demo action only.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', onPress: clearSelection, style: 'destructive' },
    ]);
  }, [clearSelection, selectionCount]);

  const forwardSelectedMessages = useCallback(() => {
    if (selectionCount === 0) {
      return;
    }

    const messagesToForward = messages.filter((message) => selectedMessageIds.has(message.id));
    navigation.navigate('ForwardSelectionScreen', { sourceChat: chat, messages: messagesToForward });
    clearSelection();
  }, [chat, clearSelection, messages, navigation, selectedMessageIds, selectionCount]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    messagesActions.toggleReaction(chat.id, messageId, emoji);
  }, [chat.id]);

  const votePoll = useCallback((messageId: string, optionId: string) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.id !== messageId || !message.poll) {
          return message;
        }

        const alreadyVoted = message.poll.options.some((option) => option.votedByMe);

        return {
          ...message,
          poll: {
            ...message.poll,
            options: message.poll.options.map((option) => {
              if (message.poll?.allowMultiple) {
                if (option.id !== optionId) {
                  return option;
                }

                return {
                  ...option,
                  votedByMe: !option.votedByMe,
                  votes: Math.max(0, option.votedByMe ? option.votes - 1 : option.votes + 1),
                };
              }

              if (option.id === optionId) {
                return {
                  ...option,
                  votedByMe: true,
                  votes: option.votedByMe ? option.votes : option.votes + 1,
                };
              }

              return {
                ...option,
                votedByMe: false,
                votes: alreadyVoted && option.votedByMe ? Math.max(0, option.votes - 1) : option.votes,
              };
            }),
          },
        };
      }),
    );
  }, []);

  const retryTransfer = useCallback(
    (messageId: string) => {
      const targetMessage = messages.find((message) => message.id === messageId);

      if (targetMessage?.kind === 'text' && targetMessage.status === 'failed') {
        void messagesActions.retryMessage(chat.id, messageId);
        return;
      }

      messagesActions.updateTransfer(chat.id, messageId, {
        progress: 0,
        status: targetMessage?.sender === 'them' ? 'downloading' : 'uploading',
      });
      simulateTransfer([messageId], targetMessage?.sender === 'them' ? 'downloading' : 'uploading');
    },
    [chat.id, messages, simulateTransfer],
  );

  const downloadTransfer = useCallback(
    (messageId: string) => {
      const targetMessage = messages.find((message) => message.id === messageId);

      messagesActions.updateTransfer(chat.id, messageId, {
        progress: 0,
        status: 'downloading',
      });
      void downloadManager.queue({
        chatId: chat.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        id: messageId,
        thumbnailUri: targetMessage?.mediaUri,
        uri: targetMessage?.mediaUri ?? targetMessage?.file?.uri ?? `mock://media/${messageId}`,
      });
      simulateTransfer([messageId], 'downloading');
    },
    [chat.id, messages, simulateTransfer],
  );

  const sendVoiceMessage = useCallback(
    (uri: string | null, durationMs: number) => {
      const nextMessage: ChatMessage = {
        id: `voice-${Date.now()}`,
        sender: 'me',
        kind: 'voice',
        timestamp: new Date().toISOString(),
        status: 'sending',
        duration: formatVoiceDuration(durationMs),
        durationMs,
        localAudioUri: uri ?? undefined,
        replyTo: replyTo ?? undefined,
        transferStatus: 'uploading',
        transferProgress: 0,
      };

      void messagesActions.sendPreparedMessage(chat, nextMessage);
      setReplyTo(null);
      simulateTransfer([nextMessage.id], 'uploading');
      requestAnimationFrame(() => scrollToBottom(true));
    },
    [chat, replyTo, scrollToBottom, simulateTransfer],
  );

  const openMediaViewer = useCallback(
    (message: ChatMessage) => {
      navigation.navigate('MediaViewerScreen', { chat, message });
    },
    [chat, navigation],
  );

  const goToSearchResult = useCallback(
    (index: number) => {
      if (searchResults.length === 0) {
        return;
      }

      const boundedIndex = (index + searchResults.length) % searchResults.length;
      setActiveSearchIndex(boundedIndex);
      scrollToMessage(searchResults[boundedIndex]);
    },
    [scrollToMessage, searchResults],
  );

  const openSearch = useCallback(() => {
    setSearchVisible(true);
    setActiveSearchIndex(0);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchVisible(false);
    setSearchQuery('');
    setActiveSearchIndex(0);
    setFocusedMessageId(null);
  }, []);

  useEffect(() => {
    if (!searchVisible || searchResults.length === 0) {
      return;
    }

    scrollToMessage(searchResults[Math.min(activeSearchIndex, searchResults.length - 1)]);
  }, [activeSearchIndex, scrollToMessage, searchResults, searchVisible]);

  const renderItem = useCallback(
    ({ item }: { item: TimelineItem }) => {
      if (item.type === 'date') {
        return <DateSeparator label={item.label} colors={colors} />;
      }

      return (
        <MessageBubble
          colors={colors}
          focused={focusedMessageId === item.message.id || searchResults[activeSearchIndex] === item.message.id}
          message={item.message}
          onDownloadTransfer={downloadTransfer}
          onLongPress={openMessageMenu}
          onOpenMedia={openMediaViewer}
          onPress={handleMessagePress}
          onReplyPress={scrollToMessage}
          onRetryTransfer={retryTransfer}
          onSwipeReply={applyReply}
          onToggleReaction={toggleReaction}
          onVotePoll={votePoll}
          searchQuery={searchVisible || focusedMessageId === item.message.id ? searchQuery : ''}
          selected={selectedMessageIds.has(item.message.id)}
        />
      );
    },
    [
      activeSearchIndex,
      applyReply,
      colors,
      downloadTransfer,
      focusedMessageId,
      handleMessagePress,
      openMediaViewer,
      openMessageMenu,
      retryTransfer,
      scrollToMessage,
      searchQuery,
      searchResults,
      searchVisible,
      selectedMessageIds,
      toggleReaction,
    ],
  );

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollButton(distanceFromBottom > 260);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardView}
      >
        {searchVisible ? (
          <SearchHeader
            colors={colors}
            currentIndex={activeSearchIndex}
            onChangeText={(text) => {
              setSearchQuery(text);
              setActiveSearchIndex(0);
            }}
            onClose={closeSearch}
            onNext={() => goToSearchResult(activeSearchIndex + 1)}
            onPrevious={() => goToSearchResult(activeSearchIndex - 1)}
            resultCount={searchResults.length}
            value={searchQuery}
          />
        ) : (
          <ChatHeader
            chat={chat}
            colors={colors}
            onBack={() => navigation.goBack()}
            onClearSelection={clearSelection}
            onCopySelected={copySelectedMessages}
            onDeleteSelected={deleteSelectedMessages}
            onForwardSelected={forwardSelectedMessages}
            onOpenInfo={() => navigation.navigate('ChatInfoScreen', { chat, messages })}
            onOpenSearch={openSearch}
            onOpenStarred={() => navigation.navigate('StarredMessagesScreen', { chat, messages })}
            onStartVideoCall={() => navigation.navigate('CallScreen', { contact: chat, mode: CallMode.Video })}
            onStartVoiceCall={() => navigation.navigate('CallScreen', { contact: chat, mode: CallMode.Voice })}
            onShareSelected={shareSelectedMessages}
            onReportSelected={reportSelectedMessages}
            onStarSelected={starSelectedMessages}
            selectionCount={selectionCount}
          />
        )}
        <View style={styles.body}>
          <View style={styles.encryptionBanner}>
            <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
            <Text numberOfLines={2} style={styles.encryptionText}>{encryptionService.getIndicatorText()}</Text>
          </View>
          {chatError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{chatError}</Text>
            </View>
          )}
          <FlatList
            ref={listRef}
            data={timelineItems}
            extraData={selectedMessageIds}
            initialNumToRender={18}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
            maxToRenderPerBatch={12}
            onContentSizeChange={() => {
              if (!refreshing && !showScrollButton) {
                scrollToBottom(false);
              }
            }}
            onScroll={handleScroll}
            onScrollToIndexFailed={({ index }) => {
              setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }), 260);
            }}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                enabled={olderMessages.length > 0}
                onRefresh={loadOlderMessages}
                progressBackgroundColor={colors.surface}
                refreshing={refreshing}
                tintColor={colors.primary}
              />
            }
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderItem}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            updateCellsBatchingPeriod={40}
            windowSize={9}
            ListFooterComponent={
              typingName ? (
                <View style={styles.typingContainer}>
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingText}>{typingName} is typing</Text>
                    <View style={styles.typingDots}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              ) : null
            }
          />
          {showScrollButton && (
            <TouchableOpacity activeOpacity={0.78} onPress={() => scrollToBottom(true)} style={styles.scrollButton}>
              <Ionicons name="chevron-down" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <MessageInput
          colors={colors}
          onCancelReply={() => setReplyTo(null)}
          onChangeText={setInputText}
          onAttachmentOptionPress={handleAttachmentOptionPress}
          onSend={sendMessage}
          onVoicePress={() => undefined}
          onVoiceRecorded={sendVoiceMessage}
          replyTo={replyTo}
          value={inputText}
        />
        <MessageMenu
          colors={colors}
          message={activeMessage}
          onAction={handleMenuAction}
          onClose={closeMenu}
          onReact={(emoji) => {
            if (activeMessage) {
              toggleReaction(activeMessage.id, emoji);
            }
            closeMenu();
          }}
          visible={menuVisible}
        />
        <AttachmentPreviewModal
          attachments={pendingAttachments}
          caption={attachmentCaption}
          colors={colors}
          onChangeCaption={setAttachmentCaption}
          onClose={() => {
            setPendingAttachments([]);
            setAttachmentCaption('');
          }}
          onRemove={(attachmentId) =>
            setPendingAttachments((currentAttachments) =>
              currentAttachments.filter((attachment) => attachment.id !== attachmentId),
            )
          }
          onSend={sendPendingAttachments}
          visible={pendingAttachments.length > 0}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    body: {
      backgroundColor: colors.chatWallpaper,
      flex: 1,
      position: 'relative',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 8,
      paddingTop: 8,
    },
    errorBanner: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
    },
    encryptionBanner: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#182229' : '#FFF7D6',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 28,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    encryptionText: {
      color: colors.textMuted,
      flexShrink: 1,
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 15,
      marginLeft: 6,
      textAlign: 'center',
    },
    typingContainer: {
      alignItems: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    typingBubble: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 7,
      flexDirection: 'row',
      minHeight: 32,
      paddingHorizontal: 10,
    },
    typingText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '400',
      marginRight: 7,
    },
    typingDots: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 16,
    },
    typingDot: {
      backgroundColor: colors.textMuted,
      borderRadius: 2,
      height: 4,
      marginHorizontal: 2,
      width: 4,
    },
    scrollButton: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 22,
      bottom: 12,
      elevation: 3,
      height: 44,
      justifyContent: 'center',
      position: 'absolute',
      right: 14,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      width: 44,
    },
  });
