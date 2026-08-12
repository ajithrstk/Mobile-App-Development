import initialChats from '../data/chats';
import contacts from '../data/contacts';
import initialMessages from '../data/messages';
import { env } from '../config/env';
import { ConnectionState, networkManager } from '../services/network/networkManager';
import { ApiError, type ApiRequestConfig, type ApiResponse } from './types';

type MockMode = 'success' | 'error' | 'timeout' | 'slow';

let mode: MockMode = 'success';

function requestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delayForMode(): number {
  if (mode === 'slow') {
    return 1800;
  }

  return 280 + Math.floor(Math.random() * 520);
}

function withChatMessages(chatId: string) {
  return initialMessages.map((message, index) => ({
    ...message,
    id: `${chatId}-${message.id}`,
    chatId,
    clientId: `${chatId}-${message.id}`,
    timestamp: new Date(Date.now() - (initialMessages.length - index) * 1000 * 60 * 16).toISOString(),
  }));
}

function makeResponse<T>(data: T, message = 'OK'): ApiResponse<T> {
  return {
    data,
    message,
    requestId: requestId(),
    status: 200,
  };
}

export const mockAdapter = {
  setMode(nextMode: MockMode): void {
    mode = nextMode;
  },

  getMode(): MockMode {
    return mode;
  },

  async request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    if (networkManager.getState() === ConnectionState.Offline) {
      throw new ApiError('Offline', 'NETWORK_OFFLINE', 0, true);
    }

    if (mode === 'timeout') {
      await new Promise((resolve) => setTimeout(resolve, config.timeoutMs ?? env.requestTimeoutMs));
      throw new ApiError('Request timed out', 'TIMEOUT', 408, true);
    }

    await new Promise((resolve) => setTimeout(resolve, delayForMode()));

    if (mode === 'error') {
      throw new ApiError('Mock API failed', 'MOCK_FAILURE', 500, true);
    }

    if (config.url === '/contacts') {
      return makeResponse(contacts as T);
    }

    if (config.url === '/chats') {
      const now = Date.now();
      return makeResponse(
        initialChats.map((chat, index) => ({
          ...chat,
          latestAt: chat.latestAt ?? new Date(now - index * 1000 * 60 * 34).toISOString(),
        })) as T,
      );
    }

    const messageMatch = config.url.match(/^\/chats\/([^/]+)\/messages$/);

    if (messageMatch) {
      return makeResponse(withChatMessages(messageMatch[1]) as T);
    }

    return makeResponse((config.data ?? null) as T);
  },
};
