import type { Chat } from '../types';
import type { ChatMessage } from '../types/message';
import { storageKeys } from './storageKeys';
import { storageService } from './storageService';

type MessagesByChat = Record<string, ChatMessage[]>;

function uniqueMessages(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();

  return messages.filter((message) => {
    const key = message.clientId ?? message.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

class MessageCache {
  async loadChats(): Promise<Chat[]> {
    return storageService.get<Chat[]>(storageKeys.chats, []);
  }

  async saveChats(chats: Chat[]): Promise<void> {
    await storageService.set(storageKeys.chats, chats);
  }

  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const byChat = await storageService.get<MessagesByChat>(storageKeys.messagesByChat, {});
    return byChat[chatId] ?? [];
  }

  async saveMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
    const byChat = await storageService.get<MessagesByChat>(storageKeys.messagesByChat, {});
    await storageService.set(storageKeys.messagesByChat, {
      ...byChat,
      [chatId]: uniqueMessages(messages),
    });
  }

  async savePendingMessage(message: ChatMessage): Promise<void> {
    const pending = await this.loadPendingMessages();
    await storageService.set(storageKeys.pendingMessages, uniqueMessages([...pending, message]));
  }

  async removePendingMessage(messageId: string): Promise<void> {
    const pending = await this.loadPendingMessages();
    await storageService.set(
      storageKeys.pendingMessages,
      pending.filter((message) => message.id !== messageId && message.clientId !== messageId),
    );
  }

  async loadPendingMessages(): Promise<ChatMessage[]> {
    return storageService.get<ChatMessage[]>(storageKeys.pendingMessages, []);
  }
}

export const messageCache = new MessageCache();
