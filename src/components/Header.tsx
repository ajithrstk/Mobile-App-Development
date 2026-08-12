import { Ionicons } from '@expo/vector-icons';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ThemeColors } from '../utils/colors';

type HeaderProps = {
  colors: ThemeColors;
  isDarkMode: boolean;
  onToggleTheme: () => void;
};

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function Header({ colors, isDarkMode, onToggleTheme }: HeaderProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onToggleTheme}
          style={styles.iconButton}
        >
          <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={23} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingHorizontal: 18,
      paddingTop: 16 + androidTopInset,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '400',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginLeft: 8,
    width: 40,
  },
});
