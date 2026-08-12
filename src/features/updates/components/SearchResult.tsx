import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChannelSearchResult } from '../types/updates.types';
import type { ThemeColors } from '../../../utils/colors';

type SearchResultProps = {
  colors: ThemeColors;
  result: ChannelSearchResult;
  onPress: () => void;
};

export default function SearchResult({ colors, onPress, result }: SearchResultProps) {
  const styles = createStyles(colors);

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.avatar}><Text style={styles.initial}>{result.channel.name.charAt(0)}</Text></View>
      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>{result.channel.name}</Text>
          {result.channel.verified && <Ionicons name="checkmark-circle" size={14} color={colors.verified} />}
        </View>
        <Text numberOfLines={1} style={styles.subtitle}>Matched {result.reason} - @{result.channel.username}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 22,
      height: 44,
      justifyContent: 'center',
      marginRight: 12,
      width: 44,
    },
    initial: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    name: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginRight: 4,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 62,
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
  });
