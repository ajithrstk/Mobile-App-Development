import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';

export type GroupRole = 'admin' | 'member';
export type GroupPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GroupWorkStatus = 'todo' | 'inProgress' | 'blocked' | 'done';
export type GroupDeliveryStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
export type GroupFileCategory = 'media' | 'document' | 'link' | 'audio' | 'archive';
export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type GroupMember = {
  id: string;
  name: string;
  phone: string;
  avatar?: ImageSourcePropType;
  role: GroupRole;
  joinedAt: string;
};

export type GroupTask = {
  id: string;
  groupId: string;
  title: string;
  assignees: string[];
  priority: GroupPriority;
  dueAt: string;
  status: GroupWorkStatus;
  reminderAt?: string;
  commentCount: number;
  attachmentCount: number;
};

export type GroupDocument = {
  id: string;
  groupId: string;
  title: string;
  owner: string;
  version: number;
  updatedAt: string;
  category: GroupFileCategory;
  reviewers: string[];
};

export type GroupEvent = {
  id: string;
  groupId: string;
  title: string;
  startsAt: string;
  rsvp: { yes: number; maybe: number; no: number };
  reminderEnabled: boolean;
};

export type GroupAnnouncement = {
  id: string;
  groupId: string;
  title: string;
  channel: string;
  scheduledAt?: string;
  readOnly: boolean;
  deliveryStatus: GroupDeliveryStatus;
  reach: number;
};

export type GroupProfile = {
  id: string;
  chatId: string;
  name: string;
  description: string;
  avatar: ImageSourcePropType;
  inviteLink: string;
  members: GroupMember[];
  admins: string[];
  pinnedMessageIds: string[];
  announcementOnly: boolean;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
};

export type GroupsStateData = {
  groups: GroupProfile[];
  tasks: GroupTask[];
  documents: GroupDocument[];
  events: GroupEvent[];
  announcements: GroupAnnouncement[];
  generatedAt: string;
};
