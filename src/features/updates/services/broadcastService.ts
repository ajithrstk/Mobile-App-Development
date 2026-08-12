import contacts, { getContactChat } from '../../../data/contacts';
import { mockSocketService } from '../../../sockets/mockSocketService';
import { messagesActions } from '../../../state/messages/messagesStore';
import { storageService } from '../../../storage/storageService';
import type { BroadcastList, BroadcastMessageInput } from '../types/updates.types';

const storageKey = 'chatterly.broadcast.lists';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function loadBroadcasts(): Promise<BroadcastList[]> {
  return storageService.get<BroadcastList[]>(storageKey, []);
}

async function saveBroadcasts(lists: BroadcastList[]): Promise<void> {
  await storageService.set(storageKey, lists);
}

export const broadcastService = {
  async getBroadcasts(): Promise<BroadcastList[]> {
    return loadBroadcasts();
  },

  async createBroadcast(name: string, recipientIds: string[]): Promise<BroadcastList> {
    const now = new Date().toISOString();
    const list: BroadcastList = {
      createdAt: now,
      id: createId('broadcast'),
      name: name.trim() || 'Broadcast list',
      recipientIds: Array.from(new Set(recipientIds)),
      updatedAt: now,
    };
    await saveBroadcasts([list, ...(await loadBroadcasts())]);
    return list;
  },

  async updateBroadcast(id: string, patch: Partial<Pick<BroadcastList, 'name' | 'recipientIds'>>): Promise<BroadcastList | null> {
    let updated: BroadcastList | null = null;
    const lists = (await loadBroadcasts()).map((list) => {
      if (list.id !== id) {
        return list;
      }

      updated = {
        ...list,
        ...patch,
        recipientIds: patch.recipientIds ? Array.from(new Set(patch.recipientIds)) : list.recipientIds,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    await saveBroadcasts(lists);
    return updated;
  },

  async deleteBroadcast(id: string): Promise<void> {
    await saveBroadcasts((await loadBroadcasts()).filter((list) => list.id !== id));
  },

  async sendBroadcastMessage(input: BroadcastMessageInput): Promise<void> {
    const list = (await loadBroadcasts()).find((item) => item.id === input.broadcastId);
    const recipientChats = input.recipientChats.length > 0
      ? input.recipientChats
      : contacts.filter((contact) => list?.recipientIds.includes(contact.id)).map(getContactChat);

    await Promise.all(recipientChats.map((chat) => messagesActions.sendMessage(chat, input.text)));
    mockSocketService.emit('broadcast:message', {
      broadcastId: input.broadcastId,
      recipientIds: recipientChats.map((chat) => chat.contactId ?? chat.id),
      text: input.text,
    });
  },
};
