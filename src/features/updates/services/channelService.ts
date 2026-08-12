import { apiClient } from '../../../api/client';
import contacts from '../../../data/contacts';
import { notificationService } from '../../../notifications/services/notificationService';
import { NotificationKind } from '../../../notifications/types/notification';
import { mockSocketService } from '../../../sockets/mockSocketService';
import { authStore } from '../../../state/auth/authStore';
import { storageService } from '../../../storage/storageService';
import type { Channel, ChannelSearchResult, ChannelUpdate, CreateChannelInput, PublishChannelUpdateInput, UpdatesCache } from '../types/updates.types';
import { CHANNEL_PAGE_SIZE, CHANNEL_UPDATE_PAGE_SIZE, searchChannels, uniqueChannels, uniqueUpdates } from '../utils/updatesUtils';

const cacheKey = 'chatterly.updates.cache';
const defaultPermissions = {
  followersCanForward: true,
  followersCanReact: true,
  notificationsDefaultOn: true,
};

const seedChannelSpecs = [
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Data+Analysts&background=101827&color=ffffff&bold=true',
    description: 'SQL, Tableau, Excel and analytics interview practice.',
    followed: true,
    followerCount: 184000,
    id: 'data-analysts',
    latestUpdate: 'Interviewer: You have 2 minutes to solve this Excel problem.',
    name: 'Data Analysts - SQL, Tableau',
    unreadCount: 97,
    username: 'dataanalysts',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Freshershunt&background=ffffff&color=111111&bold=true',
    description: 'Freshers jobs, walk-ins, internships and hiring alerts.',
    followed: true,
    followerCount: 921000,
    id: 'freshershunt',
    latestUpdate: 'IQVIA is hiring freshers. Company: IQVIA. Role: Intern.',
    name: 'Freshershunt',
    unreadCount: 892,
    username: 'freshershunt',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=OnlineStudy4U&background=f2fff5&color=178d46&bold=true',
    description: 'SSC CGL, reasoning, aptitude and daily exam prep.',
    followed: true,
    followerCount: 611000,
    id: 'online-study-4u',
    latestUpdate: 'SSC CGL Reasoning PYQ | Coding-Decoding questions asked.',
    name: 'OnlineStudy4U',
    unreadCount: 193,
    username: 'onlinestudy4u',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Tamil+Pokkisham&background=f7b500&color=4a1f00&bold=true',
    description: 'Tamil facts, history, books, culture and live sessions.',
    followed: true,
    followerCount: 1270000,
    id: 'tamil-pokkisham',
    latestUpdate: 'Live now: rare Tamil inscriptions explained.',
    name: 'Tamil Pokkisham',
    unreadCount: 173,
    username: 'tamilpokkisham',
    verified: false,
  },
  {
    avatarUri: 'https://loremflickr.com/160/160/college,campus?lock=422',
    description: 'Campus circulars, admissions, placement and event updates.',
    followed: true,
    followerCount: 49000,
    id: 'vsb-engineering',
    latestUpdate: 'Placement short: final year interview preparation tips.',
    name: 'VSB Engineering College',
    unreadCount: 49,
    username: 'vsbengineering',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Dominos&background=e21b2d&color=ffffff&bold=true',
    description: 'Local rider announcements and delivery partner updates.',
    followed: true,
    followerCount: 5400,
    id: 'dominos-riders',
    latestUpdate: 'The channel Bengaluru - Domino\'s Riders was created.',
    name: 'Bengaluru - Domino\'s Riders',
    unreadCount: 0,
    username: 'dominosriders',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Gemini+Prompt&background=fff1ff&color=7839ee&bold=true',
    description: 'AI prompts, Gemini workflows and productivity shortcuts.',
    followed: false,
    followerCount: 2200000,
    id: 'gemini-prompt-main',
    latestUpdate: 'Five prompts to summarize long PDFs in seconds.',
    name: 'Gemini Prompt',
    unreadCount: 0,
    username: 'geminiprompt',
    verified: false,
  },
  {
    avatarUri: 'https://loremflickr.com/160/160/indian,woman,portrait?lock=611',
    description: 'Prompt ideas for creators, students and small businesses.',
    followed: false,
    followerCount: 155000,
    id: 'gemini-prompt-creators',
    latestUpdate: 'Create reels scripts and thumbnails with one prompt.',
    name: 'Gemini Prompt Creators',
    unreadCount: 0,
    username: 'geminipromptcreators',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Telangana+Weather&background=21395b&color=ffffff&bold=true',
    description: 'Hyderabad and Telangana rainfall, alerts and weather maps.',
    followed: false,
    followerCount: 3300000,
    id: 'telangana-weatherman',
    latestUpdate: 'Evening thunderstorm watch for Hyderabad suburbs.',
    name: 'Telangana Weatherman',
    unreadCount: 0,
    username: 'telanganaweatherman',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Flipkart&background=ffdf00&color=1268b3&bold=true',
    description: 'Deals, sale alerts, delivery updates and shopping guides.',
    followed: false,
    followerCount: 1500000,
    id: 'flipkart',
    latestUpdate: 'Weekend deals: electronics, home and grocery offers.',
    name: 'Flipkart',
    unreadCount: 0,
    username: 'flipkartindia',
    verified: true,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Canada+Job+Bank&background=ffffff&color=d10000&bold=true',
    description: 'Canada job openings, resume tips and application alerts.',
    followed: false,
    followerCount: 698000,
    id: 'canada-job-bank',
    latestUpdate: 'New skilled worker openings posted this week.',
    name: 'Canada Job Bank',
    unreadCount: 0,
    username: 'canadajobbank',
    verified: false,
  },
  {
    avatarUri: 'https://ui-avatars.com/api/?name=Amazon.in&background=f7d9a2&color=111111&bold=true',
    description: 'Amazon India shopping updates, deals and service notices.',
    followed: false,
    followerCount: 836000,
    id: 'amazon-india',
    latestUpdate: 'Prime members: new early access offers are live.',
    name: 'Amazon.in',
    unreadCount: 0,
    username: 'amazonindia',
    verified: true,
  },
] satisfies Array<Pick<Channel, 'avatarUri' | 'description' | 'followed' | 'followerCount' | 'id' | 'latestUpdate' | 'name' | 'unreadCount' | 'username' | 'verified'>>;

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function currentUserId(): string {
  return authStore.getState().user?.id ?? 'mock-user';
}

const seedChannels: Channel[] = seedChannelSpecs.map((spec, index) => {
  const latestAt = new Date(Date.now() - index * 1000 * 60 * 46).toISOString();

  return {
    adminIds: index < 2 ? [currentUserId()] : [],
    avatarUri: spec.avatarUri,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (index + 4)).toISOString(),
    description: spec.description,
    followed: spec.followed,
    followerCount: spec.followerCount,
    id: spec.id,
    latestAt,
    latestUpdate: spec.latestUpdate,
    muted: false,
    name: spec.name,
    ownerId: index === 0 ? currentUserId() : `contact-${index + 1}`,
    permissions: defaultPermissions,
    unreadCount: spec.unreadCount,
    updatedAt: latestAt,
    username: spec.username,
    verified: spec.verified,
  };
});

function seedUpdates(channelId: string): ChannelUpdate[] {
  const texts = [
    'Interviewer round note: solve this in two minutes and explain every formula.',
    'Fresh update is live. Tap follow to keep receiving important alerts.',
    'Short lesson: save this and revise before your next interview.',
    'New link added with complete details, eligibility and application steps.',
    'Quick checklist: read the instructions twice, then start the solution.',
  ];

  return Array.from({ length: 14 }).map((_, index) => ({
    authorId: index % 2 === 0 ? currentUserId() : `admin-${channelId}`,
    channelId,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 38).toISOString(),
    id: `${channelId}-update-${index + 1}`,
    kind: index % 7 === 0 ? 'link' : index % 5 === 0 ? 'video' : index % 3 === 0 ? 'image' : 'text',
    linkPreview: index % 7 === 0 ? { description: 'Open the full channel post details.', title: 'Read more', url: 'https://chatterly.local/channel' } : undefined,
    mediaUri: index % 5 === 0 || index % 3 === 0 ? `mock://channel-media/${channelId}/${index}` : undefined,
    reactions: [
      { count: 2 + index, emoji: '\uD83D\uDC4D' },
      { count: 1 + (index % 4), emoji: '\u2764\uFE0F' },
    ],
    text: texts[index % texts.length],
    thumbnailUri: `mock://channel-thumb/${channelId}/${index}`,
  }));
}

function seedUpdatesByChannelId(): Record<string, ChannelUpdate[]> {
  return Object.fromEntries(seedChannels.map((channel) => [channel.id, seedUpdates(channel.id)]));
}

async function getCache(): Promise<UpdatesCache> {
  const fallback: UpdatesCache = {
    broadcasts: [],
    channels: seedChannels,
    recentSearches: [],
    updatesByChannelId: seedUpdatesByChannelId(),
  };
  const cache = await storageService.get<UpdatesCache>(cacheKey, fallback);

  if (!cache.channels || cache.channels.length === 0) {
    await storageService.set(cacheKey, fallback);
    return fallback;
  }

  const seedIds = new Set(seedChannels.map((channel) => channel.id));
  const cachedCustomChannels = (cache.channels ?? []).filter((channel) => !seedIds.has(channel.id));
  const cachedUpdatesByChannelId = cache.updatesByChannelId ?? {};
  const updatesByChannelId = {
    ...cachedUpdatesByChannelId,
    ...Object.fromEntries(seedChannels.map((channel) => [
      channel.id,
      cachedUpdatesByChannelId[channel.id]?.length ? cachedUpdatesByChannelId[channel.id] : seedUpdates(channel.id),
    ])),
  };

  const normalizedCache: UpdatesCache = {
    broadcasts: cache.broadcasts ?? [],
    channels: [...seedChannels, ...cachedCustomChannels].map((channel) => ({
      ...channel,
      adminIds: channel.adminIds ?? [],
      avatarUri: channel.avatarUri,
      description: channel.description ?? '',
      followed: Boolean(channel.followed),
      followerCount: channel.followerCount ?? 0,
      muted: Boolean(channel.muted),
      ownerId: channel.ownerId ?? 'mock-owner',
      permissions: channel.permissions ?? defaultPermissions,
      unreadCount: channel.unreadCount ?? 0,
      updatedAt: channel.updatedAt ?? channel.createdAt ?? new Date().toISOString(),
      username: channel.username ?? channel.name.toLowerCase().replace(/\s+/g, ''),
      verified: Boolean(channel.verified),
    })),
    recentSearches: cache.recentSearches ?? [],
    updatesByChannelId,
  };

  await storageService.set(cacheKey, normalizedCache);
  return normalizedCache;
}

async function setCache(cache: UpdatesCache): Promise<void> {
  await storageService.set(cacheKey, cache);
}

export const channelService = {
  async getChannels(page = 0): Promise<{ items: Channel[]; hasMore: boolean }> {
    await apiClient.request<null>({ url: '/channels' }).catch(() => undefined);
    const cache = await getCache();
    const channels = uniqueChannels(cache.channels);
    const start = page * CHANNEL_PAGE_SIZE;
    return {
      hasMore: start + CHANNEL_PAGE_SIZE < channels.length,
      items: channels.slice(start, start + CHANNEL_PAGE_SIZE),
    };
  },

  async getChannel(channelId: string): Promise<Channel | null> {
    await apiClient.request<null>({ url: `/channels/${channelId}` }).catch(() => undefined);
    return (await getCache()).channels.find((channel) => channel.id === channelId) ?? null;
  },

  async createChannel(input: CreateChannelInput): Promise<Channel> {
    if (!input.name.trim() || !input.username.trim()) {
      throw new Error('Channel name and username are required.');
    }

    const cache = await getCache();
    const now = new Date().toISOString();
    const channel: Channel = {
      adminIds: [currentUserId()],
      avatarUri: input.avatarUri,
      createdAt: now,
      description: input.description.trim(),
      followed: true,
      followerCount: 1,
      id: createId('channel'),
      latestAt: now,
      latestUpdate: 'Channel created',
      muted: false,
      name: input.name.trim(),
      ownerId: currentUserId(),
      permissions: defaultPermissions,
      unreadCount: 0,
      updatedAt: now,
      username: input.username.trim().replace(/^@/, ''),
      verified: false,
    };
    const welcomeUpdate: ChannelUpdate = {
      authorId: currentUserId(),
      channelId: channel.id,
      createdAt: now,
      id: `${channel.id}-welcome`,
      kind: 'text',
      reactions: [],
      text: `Welcome to ${channel.name}. New updates will appear here.`,
    };
    const nextCache = {
      ...cache,
      channels: uniqueChannels([channel, ...cache.channels]),
      updatesByChannelId: { ...cache.updatesByChannelId, [channel.id]: [welcomeUpdate] },
    };
    await apiClient.request<Channel, CreateChannelInput>({ data: input, method: 'POST', url: '/channels' }).catch(() => undefined);
    await setCache(nextCache);
    mockSocketService.emit('channel:created', { channel });
    mockSocketService.emit('channel:update', { channelId: channel.id, update: welcomeUpdate });
    return channel;
  },

  async updateChannel(channelId: string, patch: Partial<CreateChannelInput & Pick<Channel, 'adminIds' | 'muted' | 'permissions'>>): Promise<Channel> {
    const cache = await getCache();
    const channel = cache.channels.find((item) => item.id === channelId);

    if (!channel || !this.canAdmin(channel)) {
      throw new Error('You are not authorized to manage this channel.');
    }

    const updated: Channel = { ...channel, ...patch, updatedAt: new Date().toISOString() };
    await setCache({ ...cache, channels: uniqueChannels(cache.channels.map((item) => item.id === channelId ? updated : item)) });
    mockSocketService.emit('channel:updated', { channel: updated });
    return updated;
  },

  async deleteChannel(channelId: string): Promise<void> {
    const cache = await getCache();
    const channel = cache.channels.find((item) => item.id === channelId);

    if (!channel || !this.canAdmin(channel)) {
      throw new Error('You are not authorized to delete this channel.');
    }

    const updatesByChannelId = { ...cache.updatesByChannelId };
    delete updatesByChannelId[channelId];
    await setCache({ ...cache, channels: cache.channels.filter((item) => item.id !== channelId), updatesByChannelId });
    mockSocketService.emit('channel:deleted', { channelId });
  },

  async followChannel(channelId: string, followed: boolean): Promise<Channel | null> {
    const cache = await getCache();
    let nextChannel: Channel | null = null;
    const channels = cache.channels.map((channel) => {
      if (channel.id !== channelId) {
        return channel;
      }

      nextChannel = {
        ...channel,
        followed,
        followerCount: Math.max(0, channel.followerCount + (followed ? 1 : -1)),
      };
      return nextChannel;
    });
    await apiClient.request<null>({ method: followed ? 'POST' : 'DELETE', url: `/channels/${channelId}/follow` }).catch(() => undefined);
    await setCache({ ...cache, channels });
    mockSocketService.emit(followed ? 'channel:followed' : 'channel:unfollowed', { channelId });
    return nextChannel;
  },

  async muteChannel(channelId: string, muted: boolean): Promise<Channel | null> {
    const cache = await getCache();
    let updated: Channel | null = null;
    const channels = cache.channels.map((channel) => {
      if (channel.id !== channelId) {
        return channel;
      }

      updated = { ...channel, muted };
      return updated;
    });
    await setCache({ ...cache, channels });
    if (updated) {
      mockSocketService.emit('channel:updated', { channel: updated });
    }
    return updated;
  },

  async getChannelUpdates(channelId: string, page = 0): Promise<{ items: ChannelUpdate[]; hasMore: boolean }> {
    await apiClient.request<null>({ url: `/channels/${channelId}/updates` }).catch(() => undefined);
    const updates = uniqueUpdates((await getCache()).updatesByChannelId[channelId] ?? []);
    const start = page * CHANNEL_UPDATE_PAGE_SIZE;
    return {
      hasMore: start + CHANNEL_UPDATE_PAGE_SIZE < updates.length,
      items: updates.slice(start, start + CHANNEL_UPDATE_PAGE_SIZE),
    };
  },

  async publishUpdate(input: PublishChannelUpdateInput): Promise<ChannelUpdate> {
    const cache = await getCache();
    const channel = cache.channels.find((item) => item.id === input.channelId);

    if (!channel || !this.canAdmin(channel)) {
      throw new Error('You are not authorized to publish in this channel.');
    }

    const update: ChannelUpdate = {
      authorId: currentUserId(),
      channelId: input.channelId,
      createdAt: new Date().toISOString(),
      id: createId('channel-update'),
      kind: input.kind,
      linkPreview: input.linkPreview,
      mediaUri: input.mediaUri,
      reactions: [],
      text: input.text.trim(),
      thumbnailUri: input.mediaUri,
    };
    const updates = uniqueUpdates([update, ...(cache.updatesByChannelId[input.channelId] ?? [])]);
    const channels = cache.channels.map((item) => item.id === input.channelId ? { ...item, latestAt: update.createdAt, latestUpdate: update.text, unreadCount: 0 } : item);
    await apiClient.request<ChannelUpdate, PublishChannelUpdateInput>({ data: input, method: 'POST', url: `/channels/${input.channelId}/updates` }).catch(() => undefined);
    await setCache({ ...cache, channels, updatesByChannelId: { ...cache.updatesByChannelId, [input.channelId]: updates } });
    mockSocketService.emit('channel:update', { channelId: input.channelId, update });
    return update;
  },

  async reactToUpdate(channelId: string, updateId: string, emoji: string): Promise<ChannelUpdate | null> {
    const cache = await getCache();
    let updated: ChannelUpdate | null = null;
    const updates = (cache.updatesByChannelId[channelId] ?? []).map((item) => {
      if (item.id !== updateId) {
        return item;
      }

      const existing = item.reactions.find((reaction) => reaction.emoji === emoji);
      updated = {
        ...item,
        reactions: existing
          ? item.reactions.map((reaction) => reaction.emoji === emoji ? { ...reaction, count: reaction.reactedByMe ? Math.max(0, reaction.count - 1) : reaction.count + 1, reactedByMe: !reaction.reactedByMe } : reaction)
          : [{ count: 1, emoji, reactedByMe: true }, ...item.reactions],
      };
      return updated;
    });
    await setCache({ ...cache, updatesByChannelId: { ...cache.updatesByChannelId, [channelId]: updates } });
    mockSocketService.emit('channel:reaction', { channelId, emoji, updateId });
    return updated;
  },

  async search(query: string): Promise<ChannelSearchResult[]> {
    const cache = await getCache();
    const results = searchChannels(cache.channels, query);
    const trimmed = query.trim();

    if (trimmed) {
      await setCache({ ...cache, recentSearches: [trimmed, ...cache.recentSearches.filter((item) => item !== trimmed)].slice(0, 8) });
    }

    return results;
  },

  async getRecentSearches(): Promise<string[]> {
    return (await getCache()).recentSearches;
  },

  async clearRecentSearches(): Promise<void> {
    const cache = await getCache();
    await setCache({ ...cache, recentSearches: [] });
  },

  canAdmin(channel: Channel): boolean {
    const userId = currentUserId();
    return channel.ownerId === userId || (channel.adminIds ?? []).includes(userId);
  },

  async notifyChannelUpdate(channel: Channel, update: ChannelUpdate): Promise<void> {
    if (channel.muted) {
      return;
    }

    await notificationService.showGroupedMessageNotification({
      body: update.text,
      channelId: channel.id,
      createdAt: new Date().toISOString(),
      groupKey: `channel-${channel.id}`,
      id: `channel-update-${update.id}`,
      kind: NotificationKind.ChannelUpdate,
      muted: channel.muted,
      title: channel.name,
    });
  },
};

export const updateSeedContacts = contacts;
