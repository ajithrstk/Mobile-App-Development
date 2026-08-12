import { StyleSheet, View } from 'react-native';
import type { ThemeColors } from '../../../utils/colors';

type StatusProgressProps = {
  colors: ThemeColors;
  count: number;
  activeIndex: number;
  progress: number;
};

export default function StatusProgress({ activeIndex, colors, count, progress }: StatusProgressProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      {Array.from({ length: Math.max(count, 1) }).map((_, index) => {
        const fillRatio = index < activeIndex ? 1 : index === activeIndex ? progress : 0;

        return (
          <View key={`status-progress-${index}`} style={styles.track}>
            <View style={[styles.fill, { flex: fillRatio }]} />
            {fillRatio < 1 && <View style={{ flex: 1 - fillRatio }} />}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fill: {
      backgroundColor: colors.badgeText,
      borderRadius: 2,
      height: 3,
    },
    row: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    track: {
      backgroundColor: 'rgba(255,255,255,0.34)',
      borderRadius: 2,
      flex: 1,
      height: 3,
      overflow: 'hidden',
    },
  });
