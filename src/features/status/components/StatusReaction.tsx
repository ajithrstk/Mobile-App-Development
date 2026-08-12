import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../../../utils/colors';

const reactions = ['❤️', '😂', '😮', '😢', '🙏', '🔥'];

type StatusReactionProps = {
  colors: ThemeColors;
  onReact: (emoji: string) => void;
};

export default function StatusReaction({ colors, onReact }: StatusReactionProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      {reactions.map((emoji) => (
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
      height: 40,
      justifyContent: 'center',
      width: 42,
    },
    emoji: {
      fontSize: 24,
    },
    row: {
      alignSelf: 'center',
      backgroundColor: colors.mode === 'dark' ? 'rgba(32,44,51,0.94)' : 'rgba(255,255,255,0.94)',
      borderRadius: 22,
      flexDirection: 'row',
      marginBottom: 10,
      paddingHorizontal: 6,
    },
  });
