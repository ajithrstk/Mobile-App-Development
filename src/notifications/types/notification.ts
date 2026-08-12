export enum NotificationKind {
  Message = 'message',
  GroupMessage = 'group-message',
  MediaMessage = 'media-message',
  IncomingCall = 'incoming-call',
  MissedCall = 'missed-call',
  ChannelUpdate = 'channel-update',
  ChannelMention = 'channel-mention',
  ChannelInvitation = 'channel-invitation',
  BroadcastMessage = 'broadcast-message',
}

export type NotificationPayload = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  chatId?: string;
  channelId?: string;
  callId?: string;
  groupKey?: string;
  muted?: boolean;
  scheduledFor?: string;
  silent?: boolean;
  createdAt: string;
};

export type NotificationPermissionStatus = 'granted' | 'denied' | 'unavailable';
