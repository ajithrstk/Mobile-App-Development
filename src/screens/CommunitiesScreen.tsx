import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function CommunitiesScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
      </View>
      <View style={styles.content}>
        <MaterialCommunityIcons name="account-group-outline" size={56} color={colors.primary} />
        <Text style={styles.emptyTitle}>Stay close to your groups</Text>
        <Text style={styles.emptyText}>Community conversations will be listed here.</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 16 + androidTopInset,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '400',
  },
  content: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
