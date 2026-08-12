import { localDatabase } from '../database/localDatabase';
import { notificationService } from '../notifications/services/notificationService';
import { NotificationKind } from '../notifications/types/notification';
import { mockSocketService } from '../sockets/mockSocketService';
import { authStore } from '../state/auth/authStore';
import { chatsActions } from '../state/chats/chatsStore';
import { contactsActions } from '../state/contacts/contactsStore';
import { groupsActions } from '../features/groups/groupsStore';
import { messagesActions } from '../state/messages/messagesStore';
import { presenceActions } from '../state/presence/presenceStore';
import { userActions } from '../state/user/userStore';
import { messageCache } from '../storage/messageCache';
import { messageService } from './messageService';
import { downloadManager } from './media/downloadManager';
import { ConnectionState, networkManager } from './network/networkManager';

class SyncService {
  private cleanupCallbacks: Array<() => void> = [];
  private syncing = false;

  initialize(): () => void {
    this.cleanup();

    this.cleanupCallbacks = [
      mockSocketService.on('connect', () => presenceActions.setSocketConnected(true)),
      mockSocketService.on('disconnect', () => presenceActions.setSocketConnected(false)),
      mockSocketService.on('reconnect_attempt', (attempts) => presenceActions.setReconnectAttempts(attempts)),
      mockSocketService.on('message:sent', (payload) => messagesActions.updateStatus(payload.chatId, payload.messageId, payload.status)),
      mockSocketService.on('message:delivered', (payload) => messagesActions.updateStatus(payload.chatId, payload.messageId, payload.status)),
      mockSocketService.on('message:seen', (payload) => messagesActions.updateStatus(payload.chatId, payload.messageId, payload.status)),
      mockSocketService.on('message:new', ({ chatId, message }) => {
        messagesActions.upsert(chatId, message);
        void notificationService.showGroupedMessageNotification({
          body: message.text ?? message.fileName ?? 'New message',
          chatId,
          createdAt: new Date().toISOString(),
          groupKey: `chat-${chatId}`,
          id: `message-${message.id}`,
          kind: NotificationKind.Message,
          muted: false,
          silent: false,
          title: 'Chatterly',
        });
      }),
      mockSocketService.on('user:online', ({ userId }) => presenceActions.setUserOnline(userId, true)),
      mockSocketService.on('user:offline', ({ userId }) => presenceActions.setUserOnline(userId, false)),
      mockSocketService.on('typing:start', ({ chatId, userName }) => presenceActions.setTyping(chatId, userName)),
      mockSocketService.on('typing:stop', ({ chatId }) => presenceActions.setTyping(chatId, undefined)),
      networkManager.on('state', (state) => {
        if (state === ConnectionState.Connected) {
          void this.syncAll('network-reconnect');
        }
      }),
    ];

    const user = authStore.getState().user;
    userActions.setCurrentUser(user);
    if (user) {
      mockSocketService.connect(user.id);
      void this.syncAll('startup');
    }

    return () => this.cleanup();
  }

  async syncPendingMessages(): Promise<void> {
    if (this.syncing || networkManager.getState() !== ConnectionState.Connected) {
      return;
    }

    this.syncing = true;
    const pending = await messageCache.loadPendingMessages();

    for (const message of pending) {
      if (!message.chatId) {
        continue;
      }

      try {
        messagesActions.updateStatus(message.chatId, message.id, 'sending');
        await messageService.transmit(message);
      } catch {
        messagesActions.updateStatus(message.chatId, message.id, 'failed');
      }
    }

    this.syncing = false;
  }

  async syncAll(reason: string): Promise<void> {
    if (networkManager.getState() !== ConnectionState.Connected) {
      return;
    }

    await localDatabase.upsert('syncEvents', {
      id: `sync-${Date.now()}`,
      reason,
      type: 'sync-start',
    });

    try {
      await this.syncPendingMessages();
      await Promise.all([
        contactsActions.initialize(),
        groupsActions.initialize(),
        chatsActions.initialize(),
        downloadManager.cleanupExpiredMedia(),
      ]);
      await localDatabase.upsert('backgroundCheckpoints', {
        id: 'last-successful-sync',
        reason,
        syncedAt: new Date().toISOString(),
        type: 'sync-checkpoint',
      });
    } catch {
      await localDatabase.upsert('syncEvents', {
        id: `sync-failed-${Date.now()}`,
        reason,
        type: 'sync-failed',
      });
    }
  }

  cleanup(): void {
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
    this.cleanupCallbacks = [];
    mockSocketService.cleanup();
    presenceActions.setSocketConnected(false);
    userActions.setCurrentUser(null);
  }
}

export const syncService = new SyncService();
