import { messagesActions } from '../../state/messages/messagesStore';
import { chatsActions } from '../../state/chats/chatsStore';
import { NotificationKind, type NotificationPayload } from '../types/notification';
import { chatsById } from '../../data/chats';

class NotificationActionService {
  async directReply(payload: NotificationPayload, text: string): Promise<void> {
    if (!payload.chatId || !text.trim()) {
      return;
    }

    const chat = chatsById[payload.chatId];

    if (chat) {
      await messagesActions.sendMessage(chat, text);
    }
  }

  async markAsRead(payload: NotificationPayload): Promise<void> {
    if (!payload.chatId) {
      return;
    }

    chatsActions.markChatRead(payload.chatId);

    if (payload.kind === NotificationKind.Message || payload.kind === NotificationKind.GroupMessage || payload.kind === NotificationKind.MediaMessage) {
      messagesActions.markSeen(payload.chatId);
    }
  }
}

export const notificationActionService = new NotificationActionService();
