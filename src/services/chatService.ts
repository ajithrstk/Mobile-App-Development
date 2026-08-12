import { apiClient } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Chat } from '../types';
import type { ContactProfile } from '../types/contact';

export const contactsService = {
  async fetchContacts(): Promise<ContactProfile[]> {
    const response = await apiClient.request<ContactProfile[]>({ url: endpoints.contacts });
    return response.data;
  },
};

export const chatService = {
  async fetchChats(): Promise<Chat[]> {
    const response = await apiClient.request<Chat[]>({ url: endpoints.chats });
    return response.data;
  },

  async archiveChat(chatId: string, archived: boolean): Promise<{ chatId: string; archived: boolean }> {
    const response = await apiClient.request<{ chatId: string; archived: boolean }>({
      data: { archived, chatId },
      method: 'PATCH',
      url: endpoints.chatPreference(chatId),
    });
    return response.data;
  },

  async pinChat(chatId: string, pinned: boolean): Promise<{ chatId: string; pinned: boolean }> {
    const response = await apiClient.request<{ chatId: string; pinned: boolean }>({
      data: { chatId, pinned },
      method: 'PATCH',
      url: endpoints.chatPreference(chatId),
    });
    return response.data;
  },

  async muteChat(chatId: string, muted: boolean): Promise<{ chatId: string; muted: boolean }> {
    const response = await apiClient.request<{ chatId: string; muted: boolean }>({
      data: { chatId, muted },
      method: 'PATCH',
      url: endpoints.chatPreference(chatId),
    });
    return response.data;
  },
};
