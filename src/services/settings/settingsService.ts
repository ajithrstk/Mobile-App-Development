import { jsonStorage } from '../storage/jsonStorage';

export type AppThemePreference = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'ta' | 'hi';

export type AppSettings = {
  notificationsEnabled: boolean;
  messagePreviewEnabled: boolean;
  callNotificationsEnabled: boolean;
  cameraEnabled: boolean;
  closeToBackground: boolean;
  disappearingMessages: boolean;
  keyboardShortcutsEnabled: boolean;
  microphoneEnabled: boolean;
  saveIncomingMedia: boolean;
  readReceipts: boolean;
  securityNotifications: boolean;
  startOnLaunch: boolean;
  theme: AppThemePreference;
  language: AppLanguage;
};

const settingsStorageKey = 'chatterly.settings';

export const defaultSettings: AppSettings = {
  cameraEnabled: true,
  callNotificationsEnabled: true,
  closeToBackground: true,
  disappearingMessages: false,
  keyboardShortcutsEnabled: true,
  language: 'en',
  messagePreviewEnabled: true,
  microphoneEnabled: true,
  notificationsEnabled: true,
  readReceipts: true,
  saveIncomingMedia: true,
  securityNotifications: true,
  startOnLaunch: false,
  theme: 'system',
};

class SettingsService {
  async getSettings(): Promise<AppSettings> {
    return jsonStorage.getItem<AppSettings>(settingsStorageKey, defaultSettings);
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const currentSettings = await this.getSettings();
    const nextSettings = {
      ...currentSettings,
      ...patch,
    };

    await jsonStorage.setItem(settingsStorageKey, nextSettings);
    return nextSettings;
  }
}

export const settingsService = new SettingsService();
