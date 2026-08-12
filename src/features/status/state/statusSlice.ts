import { createStore, useStore } from '../../../state/createStore';
import type {
  CreateStatusInput,
  StatusFeed,
  StatusPrivacy,
  StatusReactionInfo,
  StatusReplyInfo,
  StatusReplyKind,
  StatusThread,
  StatusUpdate,
  StatusViewerInfo,
} from '../types/status.types';
import { statusService } from '../services/statusService';
import { groupStatusFeed, isStatusExpired } from '../utils/statusUtils';
import { authStore } from '../../../state/auth/authStore';

type StatusState = {
  feed: StatusFeed;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  privacy: StatusPrivacy;
};

const emptyFeed: StatusFeed = {
  muted: [],
  myStatuses: [],
  recent: [],
  viewed: [],
};

export const statusStore = createStore<StatusState>({
  error: null,
  feed: emptyFeed,
  privacy: {
    contactIds: [],
    mode: 'contacts',
  },
  status: 'idle',
});

function flattenFeed(feed: StatusFeed): StatusUpdate[] {
  return [
    ...feed.myStatuses,
    ...feed.recent.flatMap((thread) => thread.statuses),
    ...feed.viewed.flatMap((thread) => thread.statuses),
    ...feed.muted.flatMap((thread) => thread.statuses),
  ];
}

function currentUserId(): string {
  return authStore.getState().user?.id ?? 'me';
}

function rebuildFeed(statuses: StatusUpdate[]): StatusFeed {
  return groupStatusFeed(statuses.filter((status) => !isStatusExpired(status)), currentUserId());
}

function upsertStatus(status: StatusUpdate): void {
  const statuses = flattenFeed(statusStore.getState().feed);
  statusStore.setState({ feed: rebuildFeed([status, ...statuses.filter((item) => item.id !== status.id)]) });
}

function removeStatus(statusId: string): void {
  statusStore.setState({ feed: rebuildFeed(flattenFeed(statusStore.getState().feed).filter((status) => status.id !== statusId)) });
}

function patchStatus(statusId: string, updater: (status: StatusUpdate) => StatusUpdate): void {
  statusStore.setState({
    feed: rebuildFeed(flattenFeed(statusStore.getState().feed).map((status) => status.id === statusId ? updater(status) : status)),
  });
}

export const statusActions = {
  async initialize(): Promise<void> {
    statusStore.setState({ status: 'loading' });

    try {
      await statusService.cleanupExpiredStatuses();
      const [feed, privacy] = await Promise.all([
        statusService.getStatusFeed(),
        statusService.getStatusPrivacy(),
      ]);
      statusStore.setState({ error: null, feed, privacy, status: 'ready' });
    } catch {
      statusStore.setState({ error: 'Could not load status updates.', status: 'error' });
    }
  },

  async refresh(): Promise<void> {
    await this.initialize();
  },

  async createStatus(input: CreateStatusInput): Promise<StatusUpdate> {
    const status = await statusService.createStatus(input);
    upsertStatus(status);
    return status;
  },

  async viewStatus(statusId: string): Promise<StatusViewerInfo | null> {
    const viewer = await statusService.viewStatus(statusId);

    if (viewer) {
      patchStatus(statusId, (status) => ({
        ...status,
        viewedByMe: true,
        viewers: status.viewers.some((item) => item.contactId === viewer.contactId) ? status.viewers : [viewer, ...status.viewers],
      }));
    }

    return viewer;
  },

  async deleteStatus(statusId: string): Promise<void> {
    await statusService.deleteStatus(statusId);
    removeStatus(statusId);
  },

  async reactToStatus(statusId: string, emoji: string): Promise<StatusReactionInfo> {
    const reaction = await statusService.reactToStatus(statusId, emoji);
    patchStatus(statusId, (status) => ({
      ...status,
      reactions: [reaction, ...status.reactions.filter((item) => item.contactId !== reaction.contactId || item.emoji !== reaction.emoji)],
    }));
    return reaction;
  },

  async replyToStatus(status: StatusUpdate, kind: StatusReplyKind, value: string) {
    const reply = await statusService.replyToStatus(status, kind, value);
    patchStatus(status.id, (item) => ({ ...item, replies: [reply, ...item.replies] }));
    return reply;
  },

  async updatePrivacy(privacy: StatusPrivacy): Promise<void> {
    const nextPrivacy = await statusService.updateStatusPrivacy(privacy);
    statusStore.setState({ privacy: nextPrivacy });
  },

  applyCreated(status: StatusUpdate): void {
    upsertStatus(status);
  },

  applyViewed(statusId: string, viewer: StatusViewerInfo): void {
    patchStatus(statusId, (status) => ({
      ...status,
      viewers: status.viewers.some((item) => item.contactId === viewer.contactId) ? status.viewers : [viewer, ...status.viewers],
    }));
  },

  applyDeleted(statusId: string): void {
    removeStatus(statusId);
  },

  applyExpired(statusId: string): void {
    removeStatus(statusId);
  },

  applyReaction(statusId: string, reaction: StatusReactionInfo): void {
    patchStatus(statusId, (status) => ({
      ...status,
      reactions: [reaction, ...status.reactions.filter((item) => item.contactId !== reaction.contactId || item.emoji !== reaction.emoji)],
    }));
  },

  applyReply(statusId: string, reply: StatusReplyInfo): void {
    patchStatus(statusId, (status) => ({
      ...status,
      replies: [reply, ...status.replies.filter((item) => item.id !== reply.id)],
    }));
  },
};

export function getAllStatusThreads(): StatusThread[] {
  const { feed } = statusStore.getState();
  const myThread: StatusThread[] = feed.myStatuses.length > 0
    ? [{
        latestAt: feed.myStatuses[0].createdAt,
        muted: false,
        owner: feed.myStatuses[0].owner,
        statuses: feed.myStatuses,
        unseenCount: 0,
      }]
    : [];

  return [...myThread, ...feed.recent, ...feed.viewed, ...feed.muted];
}

export function useStatus<Selected>(selector: (state: StatusState) => Selected): Selected {
  return useStore(statusStore, selector);
}
