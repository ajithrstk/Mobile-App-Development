import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MessageReaction } from '../types/message';
import type { ThemeColors } from '../utils/colors';

type ReactionBarProps = {
  reactions?: MessageReaction[];
  colors: ThemeColors;
  onToggleReaction: (emoji: string) => void;
};

export default function ReactionBar({ reactions, colors, onToggleReaction }: ReactionBarProps) {
  const visibleReactions = reactions?.filter((reaction) => reaction.count > 0) ?? [];
  const styles = createStyles(colors);

  if (visibleReactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleReactions.map((reaction) => (
        <TouchableOpacity
          activeOpacity={0.72}
          key={reaction.emoji}
          onPress={() => onToggleReaction(reaction.emoji)}
          style={[styles.reaction, reaction.reactedByMe && styles.activeReaction]}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          <Text style={styles.count}>{reaction.count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 5,
    },
    reaction: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.divider,
      borderRadius: 13,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      marginRight: 4,
      marginTop: 2,
      minHeight: 26,
      paddingHorizontal: 7,
    },
    activeReaction: {
      borderColor: colors.accent,
    },
    emoji: {
      fontSize: 16,
      lineHeight: 20,
    },
    count: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 3,
    },
  });
