import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import type { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import ChatNavigator from './ChatNavigator';
import { openNotificationTarget } from '../notifications/handlers/notificationNavigation';
import { notificationService } from '../notifications/services/notificationService';
import { useAuth } from '../state/auth/authStore';
import { useThemeColors } from '../utils/colors';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const colors = useThemeColors();
  const initialized = useAuth((state) => state.initialized);
  const status = useAuth((state) => state.status);

  useEffect(() => {
    const unsubscribe = notificationService.on('tap', (payload) => {
      if (navigationRef.isReady() && status === 'authenticated') {
        openNotificationTarget(navigationRef, payload);
      }
    });

    return unsubscribe;
  }, [status]);

  if (!initialized) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {status === 'authenticated' ? (
        <ChatNavigator />
      ) : (
        <AuthNavigator initialRouteName={status === 'profileRequired' ? 'ProfileSetupScreen' : 'LoginScreen'} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
