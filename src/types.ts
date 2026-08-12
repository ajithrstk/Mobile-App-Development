import type { ImageSourcePropType } from 'react-native';
import { CallMode } from './calls/types/call';
import type { StatusThread } from './features/status/types/status.types';
import type { ChatMessage } from './types/message';

export type ChatAction = 'pin' | 'mute' | 'archive' | 'delete';
export type ChatStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'read' | 'typing' | 'failed';

export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  muted: boolean;
  pinned: boolean;
  archived: boolean;
  avatar: ImageSourcePropType;
  online: boolean;
  verified: boolean;
  status: ChatStatus;
  latestAt?: string;
  contactId?: string;
};

export type AuthStackParamList = {
  LoginScreen: undefined;
  OTPVerificationScreen: { phone: string };
  ProfileSetupScreen: undefined;
};

export type SettingSection = 'account' | 'about' | 'call' | 'chat' | 'general' | 'help' | 'keyboard' | 'language' | 'privacy' | 'theme';

export type RootStackParamList = {
  MainTabs: undefined;
  AuthStack: undefined;
  ChatScreen: { chat: Chat; forwardedMessages?: ChatMessage[]; targetMessageId?: string; searchQuery?: string };
  GlobalSearchScreen: undefined;
  ContactsScreen: undefined;
  GroupsScreen: undefined;
  ForwardSelectionScreen: { sourceChat: Chat; messages: ChatMessage[] };
  StarredMessagesScreen: { chat: Chat; messages: ChatMessage[] };
  ChatInfoScreen: { chat: Chat; messages: ChatMessage[] };
  MediaLinksDocsScreen: { chat: Chat; messages: ChatMessage[] };
  MediaViewerScreen: { message: ChatMessage; chat?: Chat };
  CallScreen: { contact: Chat; mode: CallMode; callId?: string; resumeExisting?: boolean };
  IncomingCallScreen: { contact: Chat; mode: CallMode; callId: string };
  CallHistoryScreen: undefined;
  CallDetailsScreen: { logId: string };
  SettingsScreen: undefined;
  EditProfileScreen: undefined;
  EnterpriseDashboardScreen: undefined;
  NotificationSettingsScreen: undefined;
  StorageScreen: undefined;
  SettingSectionScreen: { section: SettingSection };
  StatusViewerScreen: { thread: StatusThread; initialIndex?: number };
  CreateStatusScreen: { initialMode: 'text' | 'camera' | 'gallery' };
  ChannelScreen: { channelId: string };
  ChannelInfoScreen: { channelId: string };
  CreateChannelScreen: undefined;
  ChannelAdminScreen: { channelId: string };
  BroadcastListScreen: undefined;
  ChannelSearchScreen: undefined;
};

export type BottomTabParamList = {
  Chats: undefined;
  Updates: undefined;
  Communities: undefined;
  Calls: undefined;
  Settings: undefined;
};
