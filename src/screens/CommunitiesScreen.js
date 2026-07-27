import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import colors from '../utils/colors';

export default function CommunitiesScreen() {
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingBottom: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  title: {
    color: colors.icon,
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '700',
    marginTop: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
