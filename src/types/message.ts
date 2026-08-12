import type { ImageSourcePropType } from 'react-native';

export type MessageSender = 'me' | 'them';
export type MessageKind = 'text' | 'image' | 'video' | 'voice' | 'file' | 'audio' | 'location' | 'poll';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'read' | 'failed';
export type MessageMenuAction = 'reply' | 'forward' | 'copy' | 'star' | 'pin' | 'delete';
export type AttachmentOption = 'document' | 'camera' | 'gallery' | 'audio' | 'location' | 'contact' | 'poll';
export type TransferStatus = 'idle' | 'uploading' | 'downloading' | 'complete' | 'failed';
export type FileCategory = 'pdf' | 'doc' | 'sheet' | 'presentation' | 'zip' | 'txt' | 'audio' | 'generic';

export type ReplyPreview = {
  id: string;
  sender: MessageSender;
  text: string;
};

export type MessageReaction = {
  emoji: string;
  count: number;
  reactedByMe?: boolean;
};

export type FileAttachment = {
  uri?: string;
  name: string;
  size?: number;
  mimeType?: string;
  category: FileCategory;
};

export type LocationAttachment = {
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
};

export type PollOption = {
  id: string;
  text: string;
  votes: number;
  votedByMe?: boolean;
};

export type PollAttachment = {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
};

export type ChatMessage = {
  id: string;
  chatId?: string;
  clientId?: string;
  sender: MessageSender;
  senderId?: string;
  kind: MessageKind;
  timestamp: string;
  status?: MessageDeliveryStatus;
  text?: string;
  image?: ImageSourcePropType;
  mediaUri?: string;
  fileName?: string;
  mediaSize?: {
    width: number;
    height: number;
  };
  durationMs?: number | null;
  duration?: string;
  starred?: boolean;
  forwarded?: boolean;
  reactions?: MessageReaction[];
  replyTo?: ReplyPreview;
  file?: FileAttachment;
  location?: LocationAttachment;
  mentions?: string[];
  poll?: PollAttachment;
  transferStatus?: TransferStatus;
  transferProgress?: number;
  localAudioUri?: string;
};
