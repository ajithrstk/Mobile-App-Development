import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BroadcastList } from '../types/updates.types';
import type { ThemeColors } from '../../../utils/colors';

type BroadcastItemProps = {
  broadcast: BroadcastList;
  colors: ThemeColors;
  onDelete: () => void;
  onOpen: () => void;
};

export default function BroadcastItem({ broadcast, colors, onDelete, onOpen }: BroadcastItemProps) {
  const styles = createStyles(colors);

  return (
    <Pressable onPress={onOpen} style={styles.row}>
      <View style={styles.icon}><Ionicons name="megaphone-outline" size={22} color={colors.primary} /></View>
      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={styles.title}>{broadcast.name}</Text>
        <Text style={styles.subtitle}>{broadcast.recipientIds.length} recipients</Text>
      </View>
      <Pressable onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={19} color={colors.danger} />
      </Pressable>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    deleteButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 22,
      height: 44,
      justifyContent: 'center',
      marginRight: 12,
      width: 44,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 64,
      paddingHorizontal: 16,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
