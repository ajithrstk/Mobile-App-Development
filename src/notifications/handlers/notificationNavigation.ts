import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';
import { chatsById } from '../../data/chats';
import { CallMode } from '../../calls/types/call';
import { NotificationKind, type NotificationPayload } from '../types/notification';

export function openNotificationTarget(
  navigation: NavigationContainerRef<RootStackParamList>,
  payload: NotificationPayload,
): void {
  if ((payload.kind === NotificationKind.Message || payload.kind === NotificationKind.GroupMessage || payload.kind === NotificationKind.MediaMessage) && payload.chatId) {
    const chat = chatsById[payload.chatId];

    if (chat) {
      navigation.navigate('ChatScreen', { chat });
    }
    return;
  }

  if (payload.kind === NotificationKind.IncomingCall && payload.callId && payload.chatId) {
    const chat = chatsById[payload.chatId];

    if (chat) {
      navigation.navigate('IncomingCallScreen', {
        callId: payload.callId,
        contact: chat,
        mode: CallMode.Voice,
      });
    }
    return;
  }

  if (
    (payload.kind === NotificationKind.ChannelUpdate || payload.kind === NotificationKind.ChannelMention || payload.kind === NotificationKind.ChannelInvitation)
    && payload.channelId
  ) {
    navigation.navigate('ChannelScreen', { channelId: payload.channelId });
  }
}
