import { runtimeConfigService } from '../config/runtimeConfig';
import { localDatabase } from '../database/localDatabase';
import { encryptionService } from '../encryption/encryptionService';
import { analyticsService } from '../observability/analyticsService';
import { securityService } from '../security/securityService';
import { downloadManager } from '../services/media/downloadManager';
import { logger } from '../services/logging/logger';

class AppBootstrap {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await localDatabase.initialize();
    await runtimeConfigService.initialize();
    await Promise.all([
      analyticsService.initialize(),
      encryptionService.initialize(),
      securityService.initialize(),
      downloadManager.initialize(),
    ]);
    this.initialized = true;
    logger.info('Production facades initialized');
  }
}

export const appBootstrap = new AppBootstrap();
