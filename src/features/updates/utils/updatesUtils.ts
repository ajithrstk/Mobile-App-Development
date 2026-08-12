import type { Channel, ChannelSearchResult, ChannelUpdate } from '../types/updates.types';

export const CHANNEL_PAGE_SIZE = 8;
export const CHANNEL_UPDATE_PAGE_SIZE = 12;

export function formatUpdateTime(timestamp?: string): string {
  if (!timestamp) {
    return '';
  }

  const diffMinutes = Math.floor(Math.max(0, Date.now() - Date.parse(timestamp)) / 60000);

  if (diffMinutes < 1) {
    return 'Now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  if (diffMinutes < 60 * 24) {
    return `${Math.floor(diffMinutes / 60)}h`;
  }

  return `${Math.floor(diffMinutes / (60 * 24))}d`;
}

export function uniqueChannels(channels: Channel[]): Channel[] {
  const byId = new Map<string, Channel>();
  channels.forEach((channel) => byId.set(channel.id, { ...byId.get(channel.id), ...channel }));
  return [...byId.values()].sort((first, second) => Date.parse(second.latestAt ?? second.updatedAt) - Date.parse(first.latestAt ?? first.updatedAt));
}

export function uniqueUpdates(updates: ChannelUpdate[]): ChannelUpdate[] {
  const byId = new Map<string, ChannelUpdate>();
  updates.forEach((update) => byId.set(update.id, update));
  return [...byId.values()].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

export function searchChannels(channels: Channel[], query: string): ChannelSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return channels
    .map((channel): ChannelSearchResult | null => {
      if (channel.name.toLowerCase().includes(normalized)) {
        return { channel, reason: 'name' };
      }

      if (channel.username.toLowerCase().includes(normalized)) {
        return { channel, reason: 'username' };
      }

      if (channel.description.toLowerCase().includes(normalized)) {
        return { channel, reason: 'description' };
      }

      return null;
    })
    .filter((result): result is ChannelSearchResult => Boolean(result));
}
