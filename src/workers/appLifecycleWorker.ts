import { AppState, type AppStateStatus } from 'react-native';
import { syncPendingOperations } from '../background/tasks/syncPendingOperations';
import { downloadManager } from '../services/media/downloadManager';
import { logger } from '../services/logging/logger';
import { analyticsService } from '../observability/analyticsService';

class AppLifecycleWorker {
  private appStateSubscription?: { remove: () => void };
  private syncInterval?: ReturnType<typeof setInterval>;
  private initialized = false;

  initialize(): () => void {
    if (this.initialized) {
      return () => undefined;
    }

    this.initialized = true;
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    this.syncInterval = setInterval(() => {
      void this.runBackgroundSync('scheduled');
    }, 1000 * 60 * 4);
    logger.info('Lifecycle worker initialized');

    return () => this.cleanup();
  }

  async runBackgroundSync(reason: string): Promise<void> {
    const finishTrace = analyticsService.startScreenLoad(`background_sync_${reason}`);

    try {
      await syncPendingOperations();
      await downloadManager.cleanupExpiredMedia();
    } finally {
      finishTrace();
    }
  }

  private handleAppStateChange = (nextState: AppStateStatus): void => {
    if (nextState === 'active') {
      void this.runBackgroundSync('foreground');
    }
  };

  private cleanup(): void {
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    this.initialized = false;
    logger.info('Lifecycle worker cleaned up');
  }
}

export const appLifecycleWorker = new AppLifecycleWorker();
