import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import StatusItem from '../../status/components/StatusItem';
import { useStatusFeed } from '../../status/hooks/useStatus';
import { statusActions } from '../../status/state/statusSlice';
import type { StatusThread } from '../../status/types/status.types';
import type { ThemeColors } from '../../../utils/colors';

type StatusSectionProps = {
  colors: ThemeColors;
  onCreateStatus: () => void;
  onOpenThread: (thread: StatusThread) => void;
};

export default function StatusSection({ colors, onCreateStatus, onOpenThread }: StatusSectionProps) {
  const { feed } = useStatusFeed();
  const styles = createStyles(colors);
  const previewThreads = [...feed.recent, ...feed.viewed].slice(0, 3);

  function openMyStatusMenu(): void {
    const latestStatus = feed.myStatuses[0];

    if (!latestStatus) {
      return;
    }

    Alert.alert('My status', 'Choose an option.', [
      { text: 'View', onPress: () => onOpenThread({ latestAt: latestStatus.createdAt, muted: false, owner: latestStatus.owner, statuses: feed.myStatuses, unseenCount: 0 }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void statusActions.deleteStatus(latestStatus.id);
        },
      },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: () => {
          feed.myStatuses.forEach((status) => void statusActions.deleteStatus(status.id));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Status</Text>
        <Pressable onPress={onCreateStatus}>
          <Text style={styles.link}>Add</Text>
        </Pressable>
      </View>
      <StatusItem colors={colors} myStatuses={feed.myStatuses} onCreate={onCreateStatus} onMenu={openMyStatusMenu} onPress={() => {
        if (feed.myStatuses[0]) {
          onOpenThread({
            latestAt: feed.myStatuses[0].createdAt,
            muted: false,
            owner: feed.myStatuses[0].owner,
            statuses: feed.myStatuses,
            unseenCount: 0,
          });
        }
      }} />
      {previewThreads.map((thread) => (
        <StatusItem colors={colors} key={thread.owner.id} onPress={() => onOpenThread(thread)} thread={thread} />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    link: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    section: {
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '600',
    },
  });
