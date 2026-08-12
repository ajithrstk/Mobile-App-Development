import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../utils/colors';

type DateSeparatorProps = {
  label: string;
  colors: ThemeColors;
};

export default function DateSeparator({ label, colors }: DateSeparatorProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: 10,
    },
    label: {
      backgroundColor: colors.mode === 'dark' ? '#1F2D29' : '#E8F0ED',
      borderRadius: 7,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
  });
