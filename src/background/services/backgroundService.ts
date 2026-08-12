import { AppState, type AppStateStatus } from 'react-native';
import { networkManager } from '../../services/network/networkManager';
import { logger } from '../../services/logging/logger';
import { notificationService } from '../../notifications/services/notificationService';

class BackgroundService {
  private appStateSubscription?: { remove: () => void };
  private active = false;

  initialize(): () => void {
    if (this.active) {
      return () => undefined;
    }

    this.active = true;
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    logger.info('Background service initialized');

    return () => this.cleanup();
  }

  private handleAppStateChange = (nextState: AppStateStatus): void => {
    logger.info('App state changed', { state: nextState });

    if (nextState === 'active') {
      void notificationService.clearBadgeCount();
      networkManager.setOnline(true);
    }

    if (nextState === 'background' || nextState === 'inactive') {
      networkManager.initialize();
    }
  };

  private cleanup(): void {
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;
    this.active = false;
    logger.info('Background service cleaned up');
  }
}

export const backgroundService = new BackgroundService();
