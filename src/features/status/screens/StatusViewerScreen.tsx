import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import StatusViewer from '../components/StatusViewer';
import { statusActions } from '../state/statusSlice';
import type { StatusReplyKind, StatusUpdate } from '../types/status.types';
import contacts, { getContactChat } from '../../../data/contacts';
import type { RootStackParamList } from '../../../types';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'StatusViewerScreen'>;

function statusToForwardMessage(status: StatusUpdate) {
  return {
    id: `forward-status-${status.id}`,
    kind: status.kind === 'video' ? 'video' as const : status.kind === 'image' ? 'image' as const : 'text' as const,
    mediaUri: status.media?.uri,
    sender: 'me' as const,
    status: 'sent' as const,
    text: status.text ?? status.caption ?? 'Status update',
    timestamp: new Date().toISOString(),
  };
}

export default function StatusViewerScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const { initialIndex = 0, thread } = route.params;

  const reply = async (status: StatusUpdate, kind: StatusReplyKind, value: string) => {
    await statusActions.replyToStatus(status, kind, value);
    navigation.replace('ChatScreen', { chat: status.owner.chat });
  };

  const replyToViewer = (status: StatusUpdate) => {
    const viewer = status.viewers[0];

    if (!viewer) {
      Alert.alert('No views yet', 'Once someone views your status, you can reply from here.');
      return;
    }

    const contact = contacts.find((item) => item.id === viewer.contactId);

    if (!contact) {
      Alert.alert('Viewer unavailable', 'This viewer is not available in contacts yet.');
      return;
    }

    navigation.navigate('ChatScreen', { chat: getContactChat(contact) });
  };

  return (
    <StatusViewer
      colors={colors}
      initialIndex={initialIndex}
      onClose={() => navigation.goBack()}
      onCopy={(status) => Alert.alert('Copied', status.text ?? status.caption ?? 'Status media link copied.')}
      onDelete={(status) => {
        Alert.alert('Delete status?', 'This status update will be removed for everyone in this mock feed.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void statusActions.deleteStatus(status.id).then(() => navigation.goBack());
            },
          },
        ]);
      }}
      onDetails={(status) => {
        Alert.alert(
          'Viewed by',
          status.viewers.length === 0
            ? 'No views yet.'
            : status.viewers.map((viewer) => `${viewer.name} - ${new Date(viewer.viewedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`).join('\n'),
        );
      }}
      onDownload={(status) => Alert.alert('Saved', status.media?.fileName ? `${status.media.fileName} saved to downloads.` : 'Text status saved.')}
      onForward={(status) => navigation.navigate('ForwardSelectionScreen', { messages: [statusToForwardMessage(status)], sourceChat: status.owner.chat })}
      onOwnerReply={replyToViewer}
      onReact={(status, emoji) => {
        void statusActions.reactToStatus(status.id, emoji);
      }}
      onReply={(status, kind, value) => {
        void reply(status, kind, value);
      }}
      onShare={(status) => Alert.alert('Share status', status.text ?? status.caption ?? 'Status media ready to share.')}
      onView={(statusId) => {
        void statusActions.viewStatus(statusId);
      }}
      statuses={thread.statuses}
    />
  );
}
