import { Platform } from 'react-native';
import { appConfig } from './appConfig';
import { env } from './env';
import { jsonStorage } from '../services/storage/jsonStorage';
import { logger } from '../services/logging/logger';

export type AppEnvironment = 'development' | 'staging' | 'production';

export type FeatureFlags = {
  backgroundSync: boolean;
  directReplyNotifications: boolean;
  mockEncryption: boolean;
  mediaDownloadManager: boolean;
  socketFailover: boolean;
  screenshotProtection: boolean;
};

export type RuntimeConfig = {
  abTests: Record<string, string>;
  environment: AppEnvironment;
  featureFlags: FeatureFlags;
  forceUpdate: {
    enabled: boolean;
    minimumVersion: string;
    message: string;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  versionCompatibility: {
    apiVersion: string;
    appVersion: string;
  };
};

const storageKey = 'chatterly.runtime-config';

const defaultFeatureFlags: FeatureFlags = {
  backgroundSync: true,
  directReplyNotifications: true,
  mediaDownloadManager: true,
  mockEncryption: true,
  screenshotProtection: true,
  socketFailover: true,
};

export const defaultRuntimeConfig: RuntimeConfig = {
  abTests: {
    chatComposer: 'whatsapp-classic',
    messageRetry: 'inline-tap',
  },
  environment: env.isDevelopment ? 'development' : 'production',
  featureFlags: defaultFeatureFlags,
  forceUpdate: {
    enabled: false,
    message: 'A newer version of Chatterly is required.',
    minimumVersion: '1.0.0',
  },
  maintenance: {
    enabled: false,
    message: 'Chatterly is temporarily unavailable while maintenance is in progress.',
  },
  versionCompatibility: {
    apiVersion: 'mock-v1',
    appVersion: '1.0.0',
  },
};

class RuntimeConfigService {
  private config = defaultRuntimeConfig;
  private initialized = false;

  async initialize(): Promise<RuntimeConfig> {
    if (this.initialized) {
      return this.config;
    }

    const storedConfig = await jsonStorage.getItem<RuntimeConfig>(storageKey, defaultRuntimeConfig);
    this.config = {
      ...defaultRuntimeConfig,
      ...storedConfig,
      featureFlags: {
        ...defaultRuntimeConfig.featureFlags,
        ...storedConfig.featureFlags,
      },
    };
    this.initialized = true;

    logger.info('Runtime config initialized', {
      apiVersion: this.config.versionCompatibility.apiVersion,
      appName: appConfig.appName,
      environment: this.config.environment,
      platform: Platform.OS,
    });

    return this.config;
  }

  getConfig(): RuntimeConfig {
    return this.config;
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return Boolean(this.config.featureFlags[flag]);
  }

  async applyRemoteConfig(patch: Partial<RuntimeConfig>): Promise<RuntimeConfig> {
    this.config = {
      ...this.config,
      ...patch,
      featureFlags: {
        ...this.config.featureFlags,
        ...patch.featureFlags,
      },
    };
    await jsonStorage.setItem(storageKey, this.config);
    logger.info('Runtime config updated', {
      environment: this.config.environment,
      maintenance: this.config.maintenance.enabled,
    });
    return this.config;
  }
}

export const runtimeConfigService = new RuntimeConfigService();
