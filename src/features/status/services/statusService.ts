import contacts, { getContactChat } from '../../../data/contacts';
import { mockSocketService } from '../../../sockets/mockSocketService';
import { authStore } from '../../../state/auth/authStore';
import { messagesActions } from '../../../state/messages/messagesStore';
import { storageService } from '../../../storage/storageService';
import type { Chat } from '../../../types';
import { networkManager, ConnectionState } from '../../../services/network/networkManager';
import type {
  CreateStatusInput,
  StatusFeed,
  StatusPrivacy,
  StatusReactionInfo,
  StatusReplyInfo,
  StatusReplyKind,
  StatusUpdate,
  StatusViewerInfo,
} from '../types/status.types';
import { groupStatusFeed, isStatusExpired, STATUS_EXPIRY_MS } from '../utils/statusUtils';

const statusStorageKey = 'chatterly.status.updates';
const statusPrivacyStorageKey = 'chatterly.status.privacy';
const myMockId = 'me';

const defaultPrivacy: StatusPrivacy = {
  contactIds: [],
  mode: 'contacts',
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function currentUserId(): string {
  return authStore.getState().user?.id ?? myMockId;
}

function myChat(): Chat {
  const user = authStore.getState().user;
  const fallback = getContactChat(contacts[0]);

  return {
    ...fallback,
    id: 'my-status-chat',
    name: user?.name?.trim() || 'My Status',
    unread: 0,
  };
}

function createSeedStatuses(): StatusUpdate[] {
  const now = Date.now();
  const seedContacts = contacts.slice(2, 16).filter((contact) => !contact.inviteOnly);

  return seedContacts.map((contact, index) => {
    const createdAt = new Date(now - (index + 1) * 1000 * 60 * 36).toISOString();
    const isVideo = index % 5 === 0;
    const isImage = index % 3 === 0;

    return {
      caption: isImage || isVideo ? ['Lunch break', 'On the road', 'Tiny update'][index % 3] : undefined,
      createdAt,
      expiresAt: new Date(Date.parse(createdAt) + STATUS_EXPIRY_MS).toISOString(),
      id: `seed-status-${contact.id}`,
      kind: isVideo ? 'video' : isImage ? 'image' : 'text',
      media: isImage || isVideo
        ? {
            compressed: true,
            durationMs: isVideo ? 14000 : null,
            fileName: isVideo ? 'status-video.mp4' : 'status-photo.jpg',
            thumbnailUri: undefined,
            uri: `mock://status-media/${contact.id}`,
          }
        : undefined,
      muted: index % 7 === 0,
      owner: {
        avatar: contact.avatar,
        chat: getContactChat(contact),
        id: contact.id,
        isMe: false,
        name: contact.name,
      },
      privacy: defaultPrivacy,
      reactions: [],
      replies: [],
      text: isImage || isVideo ? undefined : ['Working on something fun', 'Coffee and code', 'Almost there'][index % 3],
      textStyle: {
        alignment: 'center',
        backgroundColor: ['#128C7E', '#7B3F98', '#455A64'][index % 3],
        color: '#FFFFFF',
        fontFamily: 'system',
        fontSize: 25,
      },
      uploadProgress: 1,
      uploadStatus: 'success',
      viewedByMe: index % 4 === 0,
      viewers: [],
    };
  });
}

function applyPrivacy(statuses: StatusUpdate[]): StatusUpdate[] {
  const userId = currentUserId();

  return statuses.filter((status) => {
    if (status.owner.id === userId || status.owner.isMe) {
      return true;
    }

    if (status.privacy.mode === 'contacts') {
      return true;
    }

    if (status.privacy.mode === 'contacts-except') {
      return !status.privacy.contactIds.includes(status.owner.id);
    }

    return status.privacy.contactIds.includes(status.owner.id);
  });
}

async function loadStatuses(): Promise<StatusUpdate[]> {
  const stored = await storageService.get<StatusUpdate[] | null>(statusStorageKey, null);
  const statuses = stored ?? createSeedStatuses();
  const activeStatuses = statuses.filter((status) => !isStatusExpired(status));

  if (!stored || activeStatuses.length !== statuses.length) {
    await storageService.set(statusStorageKey, activeStatuses);
  }

  return activeStatuses;
}

async function saveStatuses(statuses: StatusUpdate[]): Promise<void> {
  await storageService.set(statusStorageKey, statuses.filter((status) => !isStatusExpired(status)));
}

export const statusService = {
  async createStatus(input: CreateStatusInput): Promise<StatusUpdate> {
    const statuses = await loadStatuses();
    const user = authStore.getState().user;
    const createdAt = new Date().toISOString();
    const status: StatusUpdate = {
      caption: input.caption?.trim() || undefined,
      createdAt,
      expiresAt: new Date(Date.parse(createdAt) + STATUS_EXPIRY_MS).toISOString(),
      id: createId('status'),
      kind: input.kind,
      media: input.media
        ? {
            ...input.media,
            compressed: true,
            thumbnailUri: input.media.thumbnailUri ?? input.media.uri,
          }
        : undefined,
      muted: false,
      owner: {
        avatar: user?.avatarUri ? { uri: user.avatarUri } : undefined,
        chat: myChat(),
        id: currentUserId(),
        isMe: true,
        name: user?.name?.trim() || 'My Status',
      },
      privacy: input.privacy,
      reactions: [],
      replies: [],
      text: input.text?.trim() || undefined,
      textStyle: input.textStyle,
      uploadProgress: networkManager.getState() === ConnectionState.Offline ? 0 : 1,
      uploadStatus: networkManager.getState() === ConnectionState.Offline ? 'failed' : 'success',
      viewedByMe: true,
      viewers: [],
    };

    const nextStatuses = [status, ...statuses.filter((item) => item.id !== status.id)];
    await saveStatuses(nextStatuses);
    mockSocketService.emit('status:created', { status });
    return status;
  },

  async getStatusFeed(): Promise<StatusFeed> {
    const statuses = applyPrivacy(await loadStatuses());
    return groupStatusFeed(statuses, currentUserId());
  },

  async getMyStatus(): Promise<StatusUpdate[]> {
    const statuses = await loadStatuses();
    return statuses.filter((status) => status.owner.id === currentUserId() || status.owner.isMe);
  },

  async viewStatus(statusId: string): Promise<StatusViewerInfo | null> {
    const statuses = await loadStatuses();
    const status = statuses.find((item) => item.id === statusId);

    if (!status || isStatusExpired(status)) {
      return null;
    }

    const viewer: StatusViewerInfo = {
      avatar: authStore.getState().user?.avatarUri ? { uri: authStore.getState().user?.avatarUri } : undefined,
      contactId: currentUserId(),
      name: authStore.getState().user?.name || 'You',
      viewedAt: new Date().toISOString(),
    };

    const nextStatuses = statuses.map((item) => (
      item.id === statusId
        ? {
            ...item,
            viewedByMe: true,
            viewers: item.viewers.some((activeViewer) => activeViewer.contactId === viewer.contactId)
              ? item.viewers
              : [viewer, ...item.viewers],
          }
        : item
    ));
    await saveStatuses(nextStatuses);
    mockSocketService.emit('status:viewed', { statusId, viewer });
    return viewer;
  },

  async deleteStatus(statusId: string): Promise<void> {
    const statuses = await loadStatuses();
    await saveStatuses(statuses.filter((status) => status.id !== statusId));
    mockSocketService.emit('status:deleted', { statusId });
  },

  async reactToStatus(statusId: string, emoji: string): Promise<StatusReactionInfo> {
    const reaction: StatusReactionInfo = {
      contactId: currentUserId(),
      emoji,
      reactedAt: new Date().toISOString(),
    };
    const statuses = await loadStatuses();
    const nextStatuses = statuses.map((status) => (
      status.id === statusId
        ? {
            ...status,
            reactions: [reaction, ...status.reactions.filter((item) => item.contactId !== reaction.contactId || item.emoji !== emoji)],
          }
        : status
    ));
    await saveStatuses(nextStatuses);
    mockSocketService.emit('status:reaction', { reaction, statusId });
    return reaction;
  },

  async replyToStatus(status: StatusUpdate, kind: StatusReplyKind, value: string): Promise<StatusReplyInfo> {
    const reply: StatusReplyInfo = {
      chatId: status.owner.chat.id,
      contactId: currentUserId(),
      createdAt: new Date().toISOString(),
      id: createId('status-reply'),
      kind,
      mediaUri: kind === 'image' ? value : undefined,
      text: kind === 'text' ? value : kind === 'voice' ? 'Voice reply' : 'Image reply',
      voiceUri: kind === 'voice' ? value : undefined,
    };
    const statuses = await loadStatuses();
    await saveStatuses(statuses.map((item) => item.id === status.id ? { ...item, replies: [reply, ...item.replies] } : item));
    await messagesActions.sendMessage(status.owner.chat, reply.text ?? 'Status reply');
    mockSocketService.emit('status:reply', { reply, statusId: status.id });
    return reply;
  },

  async getStatusViewers(statusId: string): Promise<StatusViewerInfo[]> {
    const statuses = await loadStatuses();
    return statuses.find((status) => status.id === statusId)?.viewers ?? [];
  },

  async updateStatusPrivacy(privacy: StatusPrivacy): Promise<StatusPrivacy> {
    await storageService.set(statusPrivacyStorageKey, privacy);
    return privacy;
  },

  async getStatusPrivacy(): Promise<StatusPrivacy> {
    return storageService.get<StatusPrivacy>(statusPrivacyStorageKey, defaultPrivacy);
  },

  async cleanupExpiredStatuses(): Promise<string[]> {
    const statuses = await storageService.get<StatusUpdate[]>(statusStorageKey, []);
    const expired = statuses.filter((status) => isStatusExpired(status)).map((status) => status.id);
    await saveStatuses(statuses.filter((status) => !expired.includes(status.id)));
    expired.forEach((statusId) => mockSocketService.emit('status:expired', { statusId }));
    return expired;
  },
};
