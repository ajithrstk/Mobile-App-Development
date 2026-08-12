import { apiClient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/types';
import { encryptionService } from '../encryption/encryptionService';
import { mockSocketService } from '../sockets/mockSocketService';
import { messageCache } from '../storage/messageCache';
import type { Chat } from '../types';
import type { ChatMessage, MessageDeliveryStatus, ReplyPreview } from '../types/message';
import { ConnectionState, networkManager } from './network/networkManager';

export type SendMessageInput = {
  chat: Chat;
  text: string;
  senderId: string;
  replyTo?: ReplyPreview;
};

function createClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const messageService = {
  async fetchMessages(chatId: string): Promise<ChatMessage[]> {
    const response = await apiClient.request<ChatMessage[]>({ url: endpoints.messages(chatId) });
    return response.data;
  },

  createOutgoingMessage(input: SendMessageInput): ChatMessage {
    const clientId = createClientId();

    return {
      chatId: input.chat.id,
      clientId,
      id: clientId,
      kind: 'text',
      replyTo: input.replyTo,
      sender: 'me',
      senderId: input.senderId,
      status: 'sending',
      text: input.text.trim(),
      timestamp: new Date().toISOString(),
    };
  },

  async transmit(message: ChatMessage): Promise<void> {
    const chatId = message.chatId;

    if (!chatId) {
      throw new ApiError('Message is missing chat information.', 'MOCK_FAILURE', 400, false);
    }

    const encryptionEnvelope = await encryptionService.encryptMessage(message);

    if (networkManager.getState() === ConnectionState.Offline) {
      await messageCache.savePendingMessage(message);
      networkManager.enqueue({
        attempts: 0,
        createdAt: new Date().toISOString(),
        id: `send-${message.id}`,
        kind: 'message',
        run: async () => this.transmit(message),
      });
      return;
    }

    if (message.text?.toLowerCase().includes('/fail')) {
      throw new ApiError('Message delivery failed. Tap retry to send again.', 'MOCK_FAILURE', 500, true);
    }

    await apiClient.request<ChatMessage>({
      data: {
        ...message,
        encryption: encryptionEnvelope,
      },
      method: 'POST',
      url: endpoints.sendMessage(chatId),
    });
    await messageCache.removePendingMessage(message.id);
    mockSocketService.sendMessage(chatId, message);
  },

  async updateStatus(chatId: string, messageId: string, status: MessageDeliveryStatus): Promise<void> {
    await apiClient.request<{ chatId: string; messageId: string; status: MessageDeliveryStatus }>({
      data: { chatId, messageId, status },
      method: 'PATCH',
      url: endpoints.updateMessageStatus(chatId, messageId),
    });
  },

  async markSeen(chatId: string, messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) {
      return;
    }

    if (networkManager.getState() === ConnectionState.Offline) {
      messageIds.forEach((messageId) => {
        networkManager.enqueue({
          attempts: 0,
          createdAt: new Date().toISOString(),
          id: `status-${chatId}-${messageId}-seen`,
          kind: 'api',
          run: async () => {
            await this.updateStatus(chatId, messageId, 'seen');
            mockSocketService.markSeen(chatId, [messageId]);
          },
        });
      });
      return;
    }

    await Promise.all(messageIds.map((messageId) => this.updateStatus(chatId, messageId, 'seen')));
    mockSocketService.markSeen(chatId, messageIds);
  },
};
