import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { AuthStackParamList } from '../../types';
import { authActions, useAuth } from '../../state/auth/authStore';
import type { ThemeColors } from '../../utils/colors';
import { useThemeColors } from '../../utils/colors';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'LoginScreen'>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const status = useAuth((state) => state.status);
  const error = useAuth((state) => state.error);
  const [phone, setPhone] = useState('+91 ');
  const loading = status === 'loading';

  const submit = async () => {
    await authActions.requestOtp(phone);
    navigation.navigate('OTPVerificationScreen', { phone });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.logo}><Text style={styles.logoText}>C</Text></View>
        <Text style={styles.title}>Sign in to Chatterly</Text>
        <Text style={styles.subtitle}>Use any valid phone number. Mock OTP is 123456.</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={phone}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity activeOpacity={0.78} disabled={loading} onPress={submit} style={styles.button}>
          {loading ? <ActivityIndicator color={colors.badgeText} /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 18 },
  buttonText: { color: colors.badgeText, fontSize: 16, fontWeight: '500' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
  input: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 18, minHeight: 54, paddingHorizontal: 14 },
  logo: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.primary, borderRadius: 28, height: 56, justifyContent: 'center', marginBottom: 20, width: 56 },
  logoText: { color: colors.badgeText, fontSize: 28, fontWeight: '500' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 22, textAlign: 'center' },
  title: { color: colors.text, fontSize: 25, fontWeight: '500', marginBottom: 8, textAlign: 'center' },
});
