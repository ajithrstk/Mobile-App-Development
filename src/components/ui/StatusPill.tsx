import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../../utils/colors';

type StatusPillProps = {
  colors: ThemeColors;
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export default function StatusPill({ colors, label, tone = 'default' }: StatusPillProps) {
  const styles = createStyles(colors, tone);

  return (
    <View style={styles.pill}>
      <Text numberOfLines={1} style={styles.text}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, tone: NonNullable<StatusPillProps['tone']>) => {
  const toneColor = tone === 'success'
    ? colors.primary
    : tone === 'warning'
      ? '#B98900'
      : tone === 'danger'
        ? colors.danger
        : colors.textMuted;

  return StyleSheet.create({
    pill: {
      alignSelf: 'flex-start',
      borderColor: toneColor,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 24,
      justifyContent: 'center',
      paddingHorizontal: 9,
    },
    text: {
      color: toneColor,
      fontSize: 12,
      fontWeight: '500',
    },
  });
};
