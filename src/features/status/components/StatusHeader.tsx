import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../../../utils/colors';

type StatusHeaderProps = {
  colors: ThemeColors;
  onCamera: () => void;
  onText: () => void;
  onPrivacy: () => void;
};

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function StatusHeader({ colors, onCamera, onPrivacy, onText }: StatusHeaderProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Updates</Text>
      <View style={styles.actions}>
        <Pressable accessibilityLabel="Create text status" onPress={onText} style={styles.iconButton}>
          <Ionicons name="pencil" size={21} color={colors.icon} />
        </Pressable>
        <Pressable accessibilityLabel="Create media status" onPress={onCamera} style={styles.iconButton}>
          <Ionicons name="camera-outline" size={23} color={colors.icon} />
        </Pressable>
        <Pressable accessibilityLabel="Status privacy" onPress={onPrivacy} style={styles.iconButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.icon} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingLeft: 18,
      paddingRight: 8,
      paddingTop: 16 + androidTopInset,
    },
    iconButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '400',
    },
  });
