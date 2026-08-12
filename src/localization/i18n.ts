import { defaultSettings, type AppLanguage } from '../services/settings/settingsService';

type TranslationKey =
  | 'encryption.mockIndicator'
  | 'network.offline'
  | 'network.reconnecting'
  | 'retry.tapToRetry';

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    'encryption.mockIndicator': 'Mock encrypted for demo',
    'network.offline': 'Waiting for network',
    'network.reconnecting': 'Reconnecting',
    'retry.tapToRetry': 'Tap to retry',
  },
  hi: {
    'encryption.mockIndicator': 'Demo ke liye mock encrypted',
    'network.offline': 'Network ka intezar',
    'network.reconnecting': 'Dobara jud raha hai',
    'retry.tapToRetry': 'Retry ke liye tap karein',
  },
  ta: {
    'encryption.mockIndicator': 'Demo mock encryption',
    'network.offline': 'Network varum varai kaathirukkirathu',
    'network.reconnecting': 'Meendum inaikkirathu',
    'retry.tapToRetry': 'Retry panna tap pannunga',
  },
};

class I18n {
  private language: AppLanguage = defaultSettings.language;

  setLanguage(language: AppLanguage): void {
    this.language = language;
  }

  t(key: TranslationKey): string {
    return translations[this.language][key] ?? translations.en[key];
  }
}

export const i18n = new I18n();
