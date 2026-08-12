import { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authActions, useAuth } from '../../state/auth/authStore';
import type { ThemeColors } from '../../utils/colors';
import { useThemeColors } from '../../utils/colors';

export default function ProfileSetupScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const status = useAuth((state) => state.status);
  const error = useAuth((state) => state.error);
  const [name, setName] = useState('Chatterly User');
  const [about, setAbout] = useState('Available');
  const loading = status === 'loading';

  const submit = async () => {
    await authActions.setupProfile({ about, name });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Set up profile</Text>
        <Text style={styles.subtitle}>This profile is stored locally with your mock session.</Text>
        <TextInput onChangeText={setName} placeholder="Display name" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
        <TextInput onChangeText={setAbout} placeholder="About" placeholderTextColor={colors.textMuted} style={styles.input} value={about} />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity activeOpacity={0.78} disabled={loading} onPress={submit} style={styles.button}>
          {loading ? <ActivityIndicator color={colors.badgeText} /> : <Text style={styles.buttonText}>Start messaging</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 18 },
  buttonText: { color: colors.badgeText, fontSize: 16, fontWeight: '500' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
  input: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 16, marginTop: 12, minHeight: 52, paddingHorizontal: 14 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 10, textAlign: 'center' },
  title: { color: colors.text, fontSize: 25, fontWeight: '500', marginBottom: 8, textAlign: 'center' },
});
