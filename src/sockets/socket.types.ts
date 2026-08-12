import type { StatusReactionInfo, StatusReplyInfo, StatusUpdate, StatusViewerInfo } from '../features/status/types/status.types';
import type { Channel, ChannelUpdate } from '../features/updates/types/updates.types';
import type { ChatMessage, MessageDeliveryStatus } from '../types/message';

export type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type MockSocketEvents = {
  connect: undefined;
  disconnect: string;
  reconnect_attempt: number;
  'message:sent': { chatId: string; messageId: string; status: MessageDeliveryStatus };
  'message:delivered': { chatId: string; messageId: string; status: MessageDeliveryStatus };
  'message:seen': { chatId: string; messageId: string; status: MessageDeliveryStatus };
  'message:new': { chatId: string; message: ChatMessage };
  'user:online': { userId: string };
  'user:offline': { userId: string };
  'typing:start': { chatId: string; userId: string; userName: string };
  'typing:stop': { chatId: string; userId: string };
  'status:created': { status: StatusUpdate };
  'status:viewed': { statusId: string; viewer: StatusViewerInfo };
  'status:deleted': { statusId: string };
  'status:expired': { statusId: string };
  'status:reaction': { statusId: string; reaction: StatusReactionInfo };
  'status:reply': { statusId: string; reply: StatusReplyInfo };
  'channel:created': { channel: Channel };
  'channel:updated': { channel: Channel };
  'channel:deleted': { channelId: string };
  'channel:followed': { channelId: string };
  'channel:unfollowed': { channelId: string };
  'channel:update': { channelId: string; update: ChannelUpdate };
  'channel:reaction': { channelId: string; updateId: string; emoji: string };
  'broadcast:message': { broadcastId: string; recipientIds: string[]; text: string };
};
