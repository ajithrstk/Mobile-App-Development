import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../../../utils/colors';

const emojiOptions = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE4F'];

type UpdateReactionProps = {
  colors: ThemeColors;
  onReact: (emoji: string) => void;
};

export default function UpdateReaction({ colors, onReact }: UpdateReactionProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      {emojiOptions.map((emoji) => (
        <Pressable key={emoji} onPress={() => onReact(emoji)} style={styles.button}>
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      width: 36,
    },
    emoji: {
      fontSize: 19,
    },
    row: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      flexDirection: 'row',
      paddingHorizontal: 4,
    },
  });
