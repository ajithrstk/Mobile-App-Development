import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { appBootstrap } from './src/app/bootstrap';
import { backgroundService } from './src/background/services/backgroundService';
import RootNavigator from './src/navigation/RootNavigator';
import { notificationService } from './src/notifications/services/notificationService';
import ErrorBoundary from './src/services/logging/ErrorBoundary';
import { downloadManager } from './src/services/media/downloadManager';
import { networkManager } from './src/services/network/networkManager';
import { syncService } from './src/services/syncService';
import { uploadManager } from './src/services/upload/uploadManager';
import { authActions, useAuth } from './src/state/auth/authStore';
import { chatsActions } from './src/state/chats/chatsStore';
import { contactsActions } from './src/state/contacts/contactsStore';
import { groupsActions } from './src/features/groups/groupsStore';
import { bindNetworkStore } from './src/state/network/networkStore';
import { ThemeProvider, useTheme } from './src/utils/colors';
import { appLifecycleWorker } from './src/workers/appLifecycleWorker';

function AppContent() {
  const { isDarkMode } = useTheme();
  const status = useAuth((state) => state.status);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const bodyStyle = document.body.style as CSSStyleDeclaration & { webkitFontSmoothing?: string };
    bodyStyle.fontFamily = 'Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';
    bodyStyle.fontWeight = '400';
    bodyStyle.webkitFontSmoothing = 'antialiased';
  }, []);

  useEffect(() => {
    const cleanupNetwork = networkManager.initialize();
    const cleanupNetworkStore = bindNetworkStore();
    const cleanupBackground = backgroundService.initialize();
    const cleanupLifecycleWorker = appLifecycleWorker.initialize();

    void appBootstrap.initialize();
    void authActions.initialize();
    void notificationService.initialize().then(() => notificationService.createAndroidChannels());
    void uploadManager.initialize();

    return () => {
      syncService.cleanup();
      notificationService.cleanup();
      downloadManager.cleanup();
      cleanupLifecycleWorker();
      cleanupBackground();
      cleanupNetworkStore();
      cleanupNetwork();
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      syncService.cleanup();
      return undefined;
    }

    void contactsActions.initialize();
    void groupsActions.initialize();
    void chatsActions.initialize();
    const cleanupSync = syncService.initialize();

    return cleanupSync;
  }, [status]);

  return (
    <>
      <RootNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
