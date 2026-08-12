import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { AuthStackParamList } from '../../types';
import { authActions, useAuth } from '../../state/auth/authStore';
import type { ThemeColors } from '../../utils/colors';
import { useThemeColors } from '../../utils/colors';

type OTPVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'OTPVerificationScreen'>;

export default function OTPVerificationScreen({ route }: OTPVerificationScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const status = useAuth((state) => state.status);
  const error = useAuth((state) => state.error);
  const lastOtp = useAuth((state) => state.lastOtp);
  const [otp, setOtp] = useState('');
  const loading = status === 'loading';

  const verify = async () => {
    try {
      await authActions.verifyOtp(otp);
    } catch {
      // Error state is already written to the auth store for display.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Code sent to {route.params.phone}. Use {lastOtp ?? '123456'} in mock mode.</Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={setOtp}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={otp}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity activeOpacity={0.78} disabled={loading} onPress={verify} style={styles.button}>
          {loading ? <ActivityIndicator color={colors.badgeText} /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => authActions.requestOtp(route.params.phone)} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Resend code</Text>
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
  input: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 24, letterSpacing: 0, minHeight: 58, paddingHorizontal: 14, textAlign: 'center' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  secondaryButton: { alignItems: 'center', minHeight: 46, justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 22, textAlign: 'center' },
  title: { color: colors.text, fontSize: 25, fontWeight: '500', marginBottom: 8, textAlign: 'center' },
});
