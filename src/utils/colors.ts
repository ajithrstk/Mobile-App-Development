import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { settingsService, type AppThemePreference } from '../services/settings/settingsService';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  mode: ThemeMode;
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  divider: string;
  text: string;
  textMuted: string;
  icon: string;
  badgeText: string;
  danger: string;
  overlay: string;
  skeletonBase: string;
  skeletonHighlight: string;
  swipeArchive: string;
  swipePin: string;
  verified: string;
  sent: string;
  delivered: string;
  read: string;
  chatWallpaper: string;
  outgoingBubble: string;
};

const lightColors: ThemeColors = {
  mode: 'light',
  primary: '#008069',
  primaryDark: '#006D5B',
  accent: '#00A884',
  background: '#FFFFFF',
  surface: '#F0F2F5',
  divider: '#E9EDEF',
  text: '#111B21',
  textMuted: '#667781',
  icon: '#54656F',
  badgeText: '#FFFFFF',
  danger: '#EA0038',
  overlay: 'rgba(0, 0, 0, 0.36)',
  skeletonBase: '#EEF1F3',
  skeletonHighlight: '#FAFAFA',
  swipeArchive: '#6D7A80',
  swipePin: '#008069',
  verified: '#53BDEB',
  sent: '#7C8A86',
  delivered: '#7C8A86',
  read: '#53BDEB',
  chatWallpaper: '#EFEAE2',
  outgoingBubble: '#D9FDD3',
};

const darkColors: ThemeColors = {
  mode: 'dark',
  primary: '#00A884',
  primaryDark: '#008069',
  accent: '#00A884',
  background: '#111B21',
  surface: '#202C33',
  divider: '#2A3942',
  text: '#E9EDEF',
  textMuted: '#8696A0',
  icon: '#AEBAC1',
  badgeText: '#FFFFFF',
  danger: '#FF6B6B',
  overlay: 'rgba(0, 0, 0, 0.54)',
  skeletonBase: '#202C33',
  skeletonHighlight: '#2A3942',
  swipeArchive: '#53636A',
  swipePin: '#008069',
  verified: '#53BDEB',
  sent: '#9AA7A3',
  delivered: '#9AA7A3',
  read: '#53BDEB',
  chatWallpaper: '#0B141A',
  outgoingBubble: '#005C4B',
};

type ThemeContextValue = {
  colors: ThemeColors;
  isDarkMode: boolean;
  setThemePreference: (preference: AppThemePreference) => Promise<void>;
  themePreference: AppThemePreference;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<AppThemePreference>('system');
  const themeMode = themePreference === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themePreference;
  const colors = themeMode === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    let mounted = true;

    void settingsService.getSettings().then((settings) => {
      if (mounted) {
        setThemePreferenceState(settings.theme);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      colors,
      isDarkMode: themeMode === 'dark',
      setThemePreference: async (preference: AppThemePreference) => {
        setThemePreferenceState(preference);
        await settingsService.updateSettings({ theme: preference });
      },
      themePreference,
      toggleTheme: () => {
        const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
        setThemePreferenceState(nextTheme);
        void settingsService.updateSettings({ theme: nextTheme });
      },
    }),
    [colors, themeMode, themePreference],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}

const colors = lightColors;

export default colors;
