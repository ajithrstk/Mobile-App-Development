import { ApiError } from '../../api/types';
import { authStore } from '../auth/authStore';
import { messageService } from '../../services/messageService';
import { messageCache } from '../../storage/messageCache';
import type { Chat } from '../../types';
import type { ChatMessage, MessageDeliveryStatus, ReplyPreview, TransferStatus } from '../../types/message';
import { createStore, useStore } from '../createStore';
import { chatsActions } from '../chats/chatsStore';

type MessagesState = {
  activeChatId: string | null;
  messagesByChat: Record<string, ChatMessage[]>;
  statusByChat: Record<string, 'idle' | 'loading' | 'ready' | 'error'>;
  errorByChat: Record<string, string | undefined>;
};

export const messagesStore = createStore<MessagesState>({
  activeChatId: null,
  errorByChat: {},
  messagesByChat: {},
  statusByChat: {},
});

const statusRank: Record<MessageDeliveryStatus, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  seen: 3,
  read: 3,
  failed: 4,
};

function uniqueSorted(messages: ChatMessage[]): ChatMessage[] {
  const byKey = new Map<string, ChatMessage>();
  messages.forEach((message) => byKey.set(message.clientId ?? message.id, message));
  return [...byKey.values()].sort((first, second) => Date.parse(first.timestamp) - Date.parse(second.timestamp));
}

function replaceMessages(chatId: string, updater: (messages: ChatMessage[]) => ChatMessage[]): ChatMessage[] {
  const current = messagesStore.getState().messagesByChat[chatId] ?? [];
  const messages = uniqueSorted(updater(current));
  messagesStore.setState((state) => ({
    ...state,
    messagesByChat: { ...state.messagesByChat, [chatId]: messages },
  }));
  void messageCache.saveMessages(chatId, messages);
  return messages;
}

function setChatError(chatId: string, message?: string): void {
  messagesStore.setState((state) => ({
    ...state,
    errorByChat: { ...state.errorByChat, [chatId]: message },
  }));
}

export const messagesActions = {
  async loadChat(chatId: string): Promise<void> {
    messagesStore.setState((state) => ({
      ...state,
      activeChatId: chatId,
      statusByChat: { ...state.statusByChat, [chatId]: 'loading' },
    }));

    const cached = await messageCache.loadMessages(chatId);
    if (cached.length > 0) {
      messagesStore.setState((state) => ({
        ...state,
        messagesByChat: { ...state.messagesByChat, [chatId]: cached },
        statusByChat: { ...state.statusByChat, [chatId]: 'ready' },
      }));
    }

    try {
      const remote = await messageService.fetchMessages(chatId);
      const merged = replaceMessages(chatId, (current) => [...current, ...remote]);
      messagesStore.setState((state) => ({
        ...state,
        errorByChat: { ...state.errorByChat, [chatId]: undefined },
        statusByChat: { ...state.statusByChat, [chatId]: 'ready' },
      }));
      const latest = merged[merged.length - 1];
      if (latest) {
        chatsActions.applyLatestMessage(chatId, latest, true);
      }
    } catch {
      messagesStore.setState((state) => ({
        ...state,
        errorByChat: { ...state.errorByChat, [chatId]: 'Could not refresh messages.' },
        statusByChat: { ...state.statusByChat, [chatId]: cached.length > 0 ? 'ready' : 'error' },
      }));
    }
  },

  setActiveChat(chatId: string | null): void {
    messagesStore.setState({ activeChatId: chatId });
  },

  upsert(chatId: string, message: ChatMessage): void {
    replaceMessages(chatId, (messages) => [...messages, { ...message, chatId }]);
    chatsActions.applyLatestMessage(chatId, message, messagesStore.getState().activeChatId === chatId);
  },

  async sendMessage(chat: Chat, text: string, replyTo?: ReplyPreview): Promise<void> {
    const user = authStore.getState().user;
    const message = messageService.createOutgoingMessage({ chat, replyTo, senderId: user?.id ?? 'mock-user', text });
    await this.sendPreparedMessage(chat, message);
  },

  async sendPreparedMessage(chat: Chat, message: ChatMessage): Promise<void> {
    const user = authStore.getState().user;
    const outgoingMessage: ChatMessage = {
      ...message,
      chatId: chat.id,
      clientId: message.clientId ?? message.id,
      sender: 'me',
      senderId: message.senderId ?? user?.id ?? 'mock-user',
      status: message.status === 'failed' ? 'failed' : 'sending',
    };

    this.upsert(chat.id, outgoingMessage);

    try {
      await messageService.transmit(outgoingMessage);
      setChatError(chat.id, undefined);
    } catch (error) {
      this.updateStatus(chat.id, outgoingMessage.id, 'failed');
      setChatError(chat.id, error instanceof ApiError ? error.message : 'Message failed. Tap retry.');
    }
  },

  async retryMessage(chatId: string, messageId: string): Promise<void> {
    const message = messagesStore.getState().messagesByChat[chatId]?.find((item) => item.id === messageId || item.clientId === messageId);

    if (!message) {
      return;
    }

    this.updateStatus(chatId, message.id, 'sending');

    try {
      await messageService.transmit({ ...message, status: 'sending' });
      setChatError(chatId, undefined);
    } catch (error) {
      this.updateStatus(chatId, message.id, 'failed');
      setChatError(chatId, error instanceof ApiError ? error.message : 'Message failed. Tap retry.');
    }
  },

  updateStatus(chatId: string, messageId: string, status: MessageDeliveryStatus): void {
    replaceMessages(chatId, (messages) => messages.map((message) => (
      message.id === messageId || message.clientId === messageId
        ? {
            ...message,
            status: !message.status || message.status === 'failed' || status === 'failed' || statusRank[status] >= statusRank[message.status]
              ? status
              : message.status,
          }
        : message
    )));
  },

  updateTransfer(chatId: string, messageId: string, transfer: { status: TransferStatus; progress: number; messageStatus?: MessageDeliveryStatus }): void {
    replaceMessages(chatId, (messages) => messages.map((message) => (
      message.id === messageId || message.clientId === messageId
        ? {
            ...message,
            status: transfer.messageStatus ?? message.status,
            transferProgress: transfer.progress,
            transferStatus: transfer.status,
          }
      : message
    )));
  },

  updateMessage(chatId: string, messageId: string, updater: (message: ChatMessage) => ChatMessage): void {
    replaceMessages(chatId, (messages) => messages.map((message) => (
      message.id === messageId || message.clientId === messageId ? updater(message) : message
    )));
  },

  toggleStar(chatId: string, messageIds: string[], value?: boolean): void {
    const targetIds = new Set(messageIds);
    replaceMessages(chatId, (messages) => messages.map((message) => (
      targetIds.has(message.id) || (message.clientId && targetIds.has(message.clientId))
        ? { ...message, starred: value ?? !message.starred }
        : message
    )));
  },

  deleteForMe(chatId: string, messageIds: string[]): void {
    const targetIds = new Set(messageIds);
    replaceMessages(chatId, (messages) => messages.filter((message) => (
      !targetIds.has(message.id) && (!message.clientId || !targetIds.has(message.clientId))
    )));
  },

  deleteForEveryone(chatId: string, messageIds: string[]): void {
    const targetIds = new Set(messageIds);
    replaceMessages(chatId, (messages) => messages.map((message) => (
      targetIds.has(message.id) || (message.clientId && targetIds.has(message.clientId))
        ? {
            ...message,
            contact: undefined,
            deleted: true,
            file: undefined,
            fileName: undefined,
            image: undefined,
            kind: 'text',
            linkPreview: undefined,
            location: undefined,
            mediaUri: undefined,
            poll: undefined,
            reactions: undefined,
            text: undefined,
            transferProgress: undefined,
            transferStatus: undefined,
          }
        : message
    )));
  },

  toggleReaction(chatId: string, messageId: string, emoji: string): void {
    this.updateMessage(chatId, messageId, (message) => {
      const currentReactions = message.reactions ?? [];
      const previousMine = currentReactions.find((reaction) => reaction.reactedByMe);

      if (previousMine?.emoji === emoji) {
        return {
          ...message,
          reactions: currentReactions
            .map((reaction) => reaction.emoji === emoji ? { ...reaction, count: Math.max(0, reaction.count - 1), reactedByMe: false } : reaction)
            .filter((reaction) => reaction.count > 0),
        };
      }

      const withoutPreviousMine = currentReactions
        .map((reaction) => reaction.reactedByMe ? { ...reaction, count: Math.max(0, reaction.count - 1), reactedByMe: false } : reaction)
        .filter((reaction) => reaction.count > 0);
      const existingReaction = withoutPreviousMine.find((reaction) => reaction.emoji === emoji);

      return {
        ...message,
        reactions: existingReaction
          ? withoutPreviousMine.map((reaction) => reaction.emoji === emoji ? { ...reaction, count: reaction.count + 1, reactedByMe: true } : reaction)
          : [...withoutPreviousMine, { emoji, count: 1, reactedByMe: true }],
      };
    });
  },

  markSeen(chatId: string): void {
    const seenCandidateIds = (messagesStore.getState().messagesByChat[chatId] ?? [])
      .filter((message) => message.status !== 'failed' && message.status !== 'seen' && message.status !== 'read')
      .map((message) => message.id);

    void messageService.markSeen(chatId, seenCandidateIds).catch(() => {
      setChatError(chatId, 'Could not update read receipts. They will retry later.');
    });
    chatsActions.markChatRead(chatId);
  },
};

export function useMessages<Selected>(selector: (state: MessagesState) => Selected): Selected {
  return useStore(messagesStore, selector);
}
