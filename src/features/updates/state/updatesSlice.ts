import { mockSocketService } from '../../../sockets/mockSocketService';
import { createStore, useStore } from '../../../state/createStore';
import type { BroadcastList, Channel, ChannelSearchResult, ChannelUpdate, CreateChannelInput, PublishChannelUpdateInput } from '../types/updates.types';
import { uniqueChannels, uniqueUpdates } from '../utils/updatesUtils';
import { broadcastService } from '../services/broadcastService';
import { channelService } from '../services/channelService';

type UpdatesState = {
  broadcasts: BroadcastList[];
  channels: Channel[];
  updatesByChannelId: Record<string, ChannelUpdate[]>;
  channelHasMoreById: Record<string, boolean>;
  channelPage: number;
  hasMoreChannels: boolean;
  recentSearches: string[];
  searchResults: ChannelSearchResult[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
};

export const updatesStore = createStore<UpdatesState>({
  broadcasts: [],
  channelHasMoreById: {},
  channelPage: 0,
  channels: [],
  error: null,
  hasMoreChannels: true,
  recentSearches: [],
  searchResults: [],
  status: 'idle',
  updatesByChannelId: {},
});

function upsertChannel(channel: Channel): void {
  updatesStore.setState((state) => ({
    ...state,
    channels: uniqueChannels([channel, ...state.channels]),
  }));
}

function removeChannel(channelId: string): void {
  updatesStore.setState((state) => {
    const updatesByChannelId = { ...state.updatesByChannelId };
    delete updatesByChannelId[channelId];

    return {
      ...state,
      channels: state.channels.filter((channel) => channel.id !== channelId),
      updatesByChannelId,
    };
  });
}

function upsertChannelUpdate(channelId: string, update: ChannelUpdate): void {
  updatesStore.setState((state) => ({
    ...state,
    channels: state.channels.map((channel) => (
      channel.id === channelId
        ? { ...channel, latestAt: update.createdAt, latestUpdate: update.text, unreadCount: channel.muted ? channel.unreadCount : channel.unreadCount + 1 }
        : channel
    )),
    updatesByChannelId: {
      ...state.updatesByChannelId,
      [channelId]: uniqueUpdates([update, ...(state.updatesByChannelId[channelId] ?? [])]),
    },
  }));
}

let socketCleanup: (() => void) | null = null;
let socketSubscriberCount = 0;

export const updatesActions = {
  async initialize(): Promise<void> {
    updatesStore.setState({ status: 'loading' });

    try {
      const [channelsPage, broadcasts, recentSearches] = await Promise.all([
        channelService.getChannels(0),
        broadcastService.getBroadcasts(),
        channelService.getRecentSearches(),
      ]);
      updatesStore.setState({
        broadcasts,
        channelPage: 0,
        channels: channelsPage.items,
        error: null,
        hasMoreChannels: channelsPage.hasMore,
        recentSearches,
        status: 'ready',
      });
    } catch {
      updatesStore.setState({ error: 'Could not load updates.', status: 'error' });
    }
  },

  async refresh(): Promise<void> {
    await this.initialize();
  },

  async loadMoreChannels(): Promise<void> {
    const state = updatesStore.getState();

    if (!state.hasMoreChannels || state.status === 'loading') {
      return;
    }

    const nextPage = state.channelPage + 1;
    const page = await channelService.getChannels(nextPage);
    updatesStore.setState({
      channelPage: nextPage,
      channels: uniqueChannels([...state.channels, ...page.items]),
      hasMoreChannels: page.hasMore,
    });
  },

  async loadChannelUpdates(channelId: string, page = 0): Promise<void> {
    const pageResult = await channelService.getChannelUpdates(channelId, page);
    updatesStore.setState((state) => ({
      ...state,
      channelHasMoreById: { ...state.channelHasMoreById, [channelId]: pageResult.hasMore },
      updatesByChannelId: {
        ...state.updatesByChannelId,
        [channelId]: uniqueUpdates([...(state.updatesByChannelId[channelId] ?? []), ...pageResult.items]),
      },
    }));
  },

  async createChannel(input: CreateChannelInput): Promise<Channel> {
    const channel = await channelService.createChannel(input);
    upsertChannel(channel);
    return channel;
  },

  async updateChannel(channelId: string, patch: Partial<CreateChannelInput & Pick<Channel, 'adminIds' | 'muted' | 'permissions'>>): Promise<Channel> {
    const channel = await channelService.updateChannel(channelId, patch);
    upsertChannel(channel);
    return channel;
  },

  async deleteChannel(channelId: string): Promise<void> {
    await channelService.deleteChannel(channelId);
    removeChannel(channelId);
  },

  async followChannel(channelId: string, followed: boolean): Promise<void> {
    const previousChannels = updatesStore.getState().channels;
    updatesStore.setState({ channels: previousChannels.map((channel) => channel.id === channelId ? { ...channel, followed } : channel) });

    try {
      const channel = await channelService.followChannel(channelId, followed);
      if (channel) {
        upsertChannel(channel);
      }
    } catch {
      updatesStore.setState({ channels: previousChannels, error: 'Could not update follow state.' });
    }
  },

  async muteChannel(channelId: string, muted: boolean): Promise<void> {
    const channel = await channelService.muteChannel(channelId, muted);
    if (channel) {
      upsertChannel(channel);
    }
  },

  async publishUpdate(input: PublishChannelUpdateInput): Promise<ChannelUpdate> {
    const update = await channelService.publishUpdate(input);
    upsertChannelUpdate(input.channelId, update);
    return update;
  },

  async reactToUpdate(channelId: string, updateId: string, emoji: string): Promise<void> {
    const update = await channelService.reactToUpdate(channelId, updateId, emoji);
    if (update) {
      upsertChannelUpdate(channelId, update);
    }
  },

  async search(query: string): Promise<void> {
    const [results, recentSearches] = await Promise.all([
      channelService.search(query),
      channelService.getRecentSearches(),
    ]);
    updatesStore.setState({ recentSearches, searchResults: results });
  },

  async clearRecentSearches(): Promise<void> {
    await channelService.clearRecentSearches();
    updatesStore.setState({ recentSearches: [] });
  },

  async loadBroadcasts(): Promise<void> {
    updatesStore.setState({ broadcasts: await broadcastService.getBroadcasts() });
  },

  async createBroadcast(name: string, recipientIds: string[]): Promise<void> {
    const list = await broadcastService.createBroadcast(name, recipientIds);
    updatesStore.setState((state) => ({ ...state, broadcasts: [list, ...state.broadcasts] }));
  },

  async updateBroadcast(id: string, name: string, recipientIds: string[]): Promise<void> {
    const list = await broadcastService.updateBroadcast(id, { name, recipientIds });
    if (list) {
      updatesStore.setState((state) => ({ ...state, broadcasts: state.broadcasts.map((item) => item.id === id ? list : item) }));
    }
  },

  async deleteBroadcast(id: string): Promise<void> {
    await broadcastService.deleteBroadcast(id);
    updatesStore.setState((state) => ({ ...state, broadcasts: state.broadcasts.filter((item) => item.id !== id) }));
  },

  async sendBroadcastMessage(broadcastId: string, text: string): Promise<void> {
    await broadcastService.sendBroadcastMessage({ broadcastId, recipientChats: [], text });
  },

  bindSocketEvents(): () => void {
    socketSubscriberCount += 1;

    if (socketCleanup) {
      return () => {
        socketSubscriberCount = Math.max(0, socketSubscriberCount - 1);
        if (socketSubscriberCount === 0 && socketCleanup) {
          socketCleanup();
          socketCleanup = null;
        }
      };
    }

    const cleanups = [
      mockSocketService.on('channel:created', ({ channel }) => upsertChannel(channel)),
      mockSocketService.on('channel:updated', ({ channel }) => upsertChannel(channel)),
      mockSocketService.on('channel:deleted', ({ channelId }) => removeChannel(channelId)),
      mockSocketService.on('channel:followed', ({ channelId }) => updatesStore.setState((state) => ({ ...state, channels: state.channels.map((channel) => channel.id === channelId ? { ...channel, followed: true } : channel) }))),
      mockSocketService.on('channel:unfollowed', ({ channelId }) => updatesStore.setState((state) => ({ ...state, channels: state.channels.map((channel) => channel.id === channelId ? { ...channel, followed: false } : channel) }))),
      mockSocketService.on('channel:update', ({ channelId, update }) => {
        upsertChannelUpdate(channelId, update);
        const channel = updatesStore.getState().channels.find((item) => item.id === channelId);
        if (channel) {
          void channelService.notifyChannelUpdate(channel, update);
        }
      }),
      mockSocketService.on('channel:reaction', ({ channelId }) => {
        void this.loadChannelUpdates(channelId, 0);
      }),
      mockSocketService.on('broadcast:message', () => {
        void this.loadBroadcasts();
      }),
    ];

    socketCleanup = () => cleanups.forEach((cleanup) => cleanup());

    return () => {
      socketSubscriberCount = Math.max(0, socketSubscriberCount - 1);
      if (socketSubscriberCount === 0 && socketCleanup) {
        socketCleanup();
        socketCleanup = null;
      }
    };
  },
};

export function useUpdates<Selected>(selector: (state: UpdatesState) => Selected): Selected {
  return useStore(updatesStore, selector);
}
