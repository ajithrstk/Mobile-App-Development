import type { ImageSourcePropType } from 'react-native';
import type { Chat } from '../../../types';

export type StatusMediaKind = 'text' | 'image' | 'video';
export type StatusUploadStatus = 'idle' | 'uploading' | 'success' | 'failed' | 'cancelled';
export type StatusPrivacyMode = 'contacts' | 'contacts-except' | 'only-share-with';
export type StatusTextAlignment = 'left' | 'center' | 'right';
export type StatusFontFamily = 'system' | 'serif' | 'mono' | 'casual';

export type StatusOwner = {
  id: string;
  name: string;
  avatar?: ImageSourcePropType;
  chat: Chat;
  isMe: boolean;
};

export type StatusPrivacy = {
  mode: StatusPrivacyMode;
  contactIds: string[];
};

export type StatusTextStyle = {
  backgroundColor: string;
  color: string;
  alignment: StatusTextAlignment;
  fontFamily: StatusFontFamily;
  fontSize: number;
};

export type StatusMedia = {
  uri: string;
  thumbnailUri?: string;
  width?: number;
  height?: number;
  durationMs?: number | null;
  fileName?: string;
  trimStartMs?: number;
  trimEndMs?: number;
  compressed?: boolean;
};

export type StatusViewerInfo = {
  contactId: string;
  name: string;
  avatar?: ImageSourcePropType;
  viewedAt: string;
};

export type StatusReactionInfo = {
  contactId: string;
  emoji: string;
  reactedAt: string;
};

export type StatusReplyKind = 'text' | 'image' | 'voice';

export type StatusReplyInfo = {
  id: string;
  chatId: string;
  contactId: string;
  kind: StatusReplyKind;
  text?: string;
  mediaUri?: string;
  voiceUri?: string;
  createdAt: string;
};

export type StatusUpdate = {
  id: string;
  owner: StatusOwner;
  kind: StatusMediaKind;
  text?: string;
  textStyle?: StatusTextStyle;
  media?: StatusMedia;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewedByMe: boolean;
  muted: boolean;
  privacy: StatusPrivacy;
  uploadStatus: StatusUploadStatus;
  uploadProgress: number;
  viewers: StatusViewerInfo[];
  reactions: StatusReactionInfo[];
  replies: StatusReplyInfo[];
};

export type StatusThread = {
  owner: StatusOwner;
  statuses: StatusUpdate[];
  latestAt: string;
  unseenCount: number;
  muted: boolean;
};

export type StatusFeed = {
  myStatuses: StatusUpdate[];
  recent: StatusThread[];
  viewed: StatusThread[];
  muted: StatusThread[];
};

export type CreateStatusInput = {
  kind: StatusMediaKind;
  text?: string;
  textStyle?: StatusTextStyle;
  media?: StatusMedia;
  caption?: string;
  privacy: StatusPrivacy;
};

export type StatusSocketEvent =
  | { type: 'created'; status: StatusUpdate }
  | { type: 'viewed'; statusId: string; viewer: StatusViewerInfo }
  | { type: 'deleted'; statusId: string }
  | { type: 'expired'; statusId: string }
  | { type: 'reaction'; statusId: string; reaction: StatusReactionInfo }
  | { type: 'reply'; statusId: string; reply: StatusReplyInfo };
