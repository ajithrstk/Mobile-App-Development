import type { ImageSourcePropType } from 'react-native';
import type { Chat } from '../../../types';

export type ChannelUpdateKind = 'text' | 'image' | 'video' | 'link';
export type ChannelRole = 'owner' | 'admin' | 'viewer';

export type Channel = {
  id: string;
  name: string;
  username: string;
  description: string;
  avatar?: ImageSourcePropType;
  avatarUri?: string;
  verified: boolean;
  followed: boolean;
  muted: boolean;
  unreadCount: number;
  followerCount: number;
  adminIds: string[];
  ownerId: string;
  latestUpdate?: string;
  latestAt?: string;
  createdAt: string;
  updatedAt: string;
  permissions: ChannelPermissions;
};

export type ChannelPermissions = {
  followersCanForward: boolean;
  followersCanReact: boolean;
  notificationsDefaultOn: boolean;
};

export type ChannelUpdateReaction = {
  emoji: string;
  count: number;
  reactedByMe?: boolean;
};

export type LinkPreview = {
  title: string;
  description: string;
  url: string;
};

export type ChannelUpdate = {
  id: string;
  channelId: string;
  kind: ChannelUpdateKind;
  text: string;
  mediaUri?: string;
  thumbnailUri?: string;
  linkPreview?: LinkPreview;
  reactions: ChannelUpdateReaction[];
  createdAt: string;
  authorId: string;
  reported?: boolean;
};

export type BroadcastList = {
  id: string;
  name: string;
  recipientIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ChannelSearchResult = {
  channel: Channel;
  reason: 'name' | 'username' | 'description';
};

export type UpdatesCache = {
  channels: Channel[];
  updatesByChannelId: Record<string, ChannelUpdate[]>;
  broadcasts: BroadcastList[];
  recentSearches: string[];
};

export type CreateChannelInput = {
  name: string;
  username: string;
  description: string;
  avatarUri?: string;
};

export type PublishChannelUpdateInput = {
  channelId: string;
  kind: ChannelUpdateKind;
  text: string;
  mediaUri?: string;
  linkPreview?: LinkPreview;
};

export type BroadcastMessageInput = {
  broadcastId: string;
  text: string;
  recipientChats: Chat[];
};
