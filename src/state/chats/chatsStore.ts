import { chatService } from '../../services/chatService';
import { messageCache } from '../../storage/messageCache';
import initialChats from '../../data/chats';
import type { Chat } from '../../types';
import type { ChatMessage } from '../../types/message';
import { getMessagePreview } from '../../utils/chat';
import { createStore, useStore } from '../createStore';

type ChatsState = {
  chats: Chat[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
};

export const chatsStore = createStore<ChatsState>({ chats: [], error: null, status: 'idle' });
const seedChatsById = new Map(initialChats.map((chat) => [chat.id, chat]));

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((first, second) => {
    if (first.pinned !== second.pinned) {
      return first.pinned ? -1 : 1;
    }

    return Date.parse(second.latestAt ?? '1970-01-01') - Date.parse(first.latestAt ?? '1970-01-01');
  });
}

function upsertChat(chats: Chat[], nextChat: Chat): Chat[] {
  const exists = chats.some((chat) => chat.id === nextChat.id);
  const nextChats = exists ? chats.map((chat) => (chat.id === nextChat.id ? { ...chat, ...nextChat } : chat)) : [nextChat, ...chats];
  return sortChats(nextChats);
}

function normalizeChatAvatars(chats: Chat[]): Chat[] {
  return chats.map((chat) => ({
    ...chat,
    avatar: seedChatsById.get(chat.id)?.avatar ?? chat.avatar,
  }));
}

async function persistPreference(chatId: string, preference: 'archived' | 'muted' | 'pinned', value: boolean): Promise<void> {
  if (preference === 'archived') {
    await chatService.archiveChat(chatId, value);
    return;
  }

  if (preference === 'muted') {
    await chatService.muteChat(chatId, value);
    return;
  }

  await chatService.pinChat(chatId, value);
}

function updatePreferenceLocally(chatId: string, preference: 'archived' | 'muted' | 'pinned', value: boolean): Chat[] {
  const chats = sortChats(chatsStore.getState().chats.map((chat) => (
    chat.id === chatId ? { ...chat, [preference]: value } : chat
  )));

  chatsStore.setState({ chats });
  void messageCache.saveChats(chats);
  return chats;
}

export const chatsActions = {
  async initialize(): Promise<void> {
    const cached = normalizeChatAvatars(await messageCache.loadChats());
    if (cached.length > 0) {
      void messageCache.saveChats(cached);
    }
    chatsStore.setState({ chats: sortChats(cached), status: cached.length > 0 ? 'ready' : 'loading' });

    try {
      const chats = await chatService.fetchChats();
      const merged = sortChats(chats.map((chat, index) => ({
        ...chat,
        latestAt: chat.latestAt ?? new Date(Date.now() - index * 1000 * 60 * 20).toISOString(),
      })));
      await messageCache.saveChats(merged);
      chatsStore.setState({ chats: merged, error: null, status: 'ready' });
    } catch {
      chatsStore.setState({ error: 'Could not refresh chats.', status: cached.length > 0 ? 'ready' : 'error' });
    }
  },

  upsertChat(chat: Chat): void {
    const chats = upsertChat(chatsStore.getState().chats, chat);
    chatsStore.setState({ chats });
    void messageCache.saveChats(chats);
  },

  async updatePreference(chatId: string, preference: 'archived' | 'muted' | 'pinned', value?: boolean): Promise<void> {
    const previousChats = chatsStore.getState().chats;
    const targetChat = previousChats.find((chat) => chat.id === chatId);

    if (!targetChat) {
      return;
    }

    const nextValue = value ?? !targetChat[preference];
    updatePreferenceLocally(chatId, preference, nextValue);

    try {
      await persistPreference(chatId, preference, nextValue);
      chatsStore.setState({ error: null });
    } catch {
      chatsStore.setState({ chats: previousChats, error: 'Could not update chat preference.' });
      void messageCache.saveChats(previousChats);
    }
  },

  applyLatestMessage(chatId: string, message: ChatMessage, isActiveChat: boolean): void {
    const chats = sortChats(chatsStore.getState().chats.map((chat) => {
      if (chat.id !== chatId) {
        return chat;
      }

      const unread = message.sender === 'them' && !isActiveChat && !chat.muted ? chat.unread + 1 : chat.unread;

      return {
        ...chat,
        lastMessage: getMessagePreview(message),
        latestAt: message.timestamp,
        status: message.sender === 'them' ? 'delivered' : message.status ?? chat.status,
        time: new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        unread,
      };
    }));
    chatsStore.setState({ chats });
    void messageCache.saveChats(chats);
  },

  markChatRead(chatId: string): void {
    const chats = chatsStore.getState().chats.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat));
    chatsStore.setState({ chats });
    void messageCache.saveChats(chats);
  },
};

export function useChats<Selected>(selector: (state: ChatsState) => Selected): Selected {
  return useStore(chatsStore, selector);
}
