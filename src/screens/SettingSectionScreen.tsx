import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { usePersistentSettings } from '../hooks/usePersistentSettings';
import type { AppLanguage, AppSettings, AppThemePreference } from '../services/settings/settingsService';
import type { RootStackParamList, SettingSection } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useTheme, useThemeColors } from '../utils/colors';

type SettingSectionScreenProps = NativeStackScreenProps<RootStackParamList, 'SettingSectionScreen'>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

const themeChoices: Array<{ label: string; subtitle: string; value: AppThemePreference }> = [
  { label: 'System default', subtitle: 'Use your device appearance', value: 'system' },
  { label: 'Light', subtitle: 'Bright WhatsApp-style interface', value: 'light' },
  { label: 'Dark', subtitle: 'Dark interface for low light', value: 'dark' },
];

const languageChoices: Array<{ label: string; subtitle: string; value: AppLanguage }> = [
  { label: 'English', subtitle: 'Default app language', value: 'en' },
  { label: 'Tamil', subtitle: 'Tamil interface labels', value: 'ta' },
  { label: 'Hindi', subtitle: 'Hindi interface labels', value: 'hi' },
];

type SectionRow =
  | {
      icon: IoniconName;
      key: keyof AppSettings;
      kind: 'switch';
      subtitle: string;
      title: string;
    }
  | {
      icon: IoniconName;
      kind: 'action';
      onPress: () => void;
      subtitle: string;
      title: string;
      value?: string;
    };

function sectionTitle(section: SettingSection): string {
  const titles: Record<SettingSection, string> = {
    account: 'Account',
    about: 'About',
    call: 'Video & voice',
    chat: 'Chats',
    general: 'General',
    help: 'Help and feedback',
    keyboard: 'Keyboard shortcuts',
    language: 'Language',
    privacy: 'Privacy',
    theme: 'Theme selection',
  };

  return titles[section];
}

export default function SettingSectionScreen({ navigation, route }: SettingSectionScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setThemePreference, themePreference } = useTheme();
  const { settings, updateSettings } = usePersistentSettings();
  const { section } = route.params;

  const showInfo = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const rows = useMemo<SectionRow[]>(() => {
    if (section === 'general') {
      return [
        {
          icon: 'power-outline',
          key: 'startOnLaunch',
          kind: 'switch',
          subtitle: 'Start Chatterly with your device',
          title: 'Open at startup',
        },
        {
          icon: 'remove-circle-outline',
          key: 'closeToBackground',
          kind: 'switch',
          subtitle: 'Keep chats available after closing',
          title: 'Close to background',
        },
        {
          icon: 'contrast-outline',
          kind: 'action',
          onPress: () => navigation.navigate('SettingSectionScreen', { section: 'theme' }),
          subtitle: 'System default, light or dark',
          title: 'Theme selection',
          value: themePreference === 'system' ? 'System' : themePreference === 'dark' ? 'Dark' : 'Light',
        },
        {
          icon: 'briefcase-outline',
          kind: 'action',
          onPress: () => navigation.navigate('EnterpriseDashboardScreen'),
          subtitle: 'Devices, files, admins and analytics',
          title: 'Enterprise Workplace',
        },
      ];
    }

    if (section === 'account') {
      return [
        {
          icon: 'shield-checkmark-outline',
          key: 'securityNotifications',
          kind: 'switch',
          subtitle: 'Alert when account security changes',
          title: 'Security notifications',
        },
        {
          icon: 'information-circle-outline',
          kind: 'action',
          onPress: () => showInfo('Account info', 'Your phone number and profile are stored locally in this demo app.'),
          subtitle: 'Phone number and profile details',
          title: 'Account info',
        },
        {
          icon: 'briefcase-outline',
          kind: 'action',
          onPress: () => navigation.navigate('EnterpriseDashboardScreen'),
          subtitle: 'Manage workplace access',
          title: 'Enterprise Workplace',
        },
      ];
    }

    if (section === 'privacy') {
      return [
        {
          icon: 'checkmark-done-outline',
          key: 'readReceipts',
          kind: 'switch',
          subtitle: 'Send read receipts in chats',
          title: 'Read receipts',
        },
        {
          icon: 'timer-outline',
          key: 'disappearingMessages',
          kind: 'switch',
          subtitle: 'Use disappearing messages by default',
          title: 'Disappearing messages',
        },
        {
          icon: 'ban-outline',
          kind: 'action',
          onPress: () => showInfo('Blocked contacts', 'You have no blocked contacts.'),
          subtitle: 'Review blocked contacts',
          title: 'Blocked contacts',
        },
      ];
    }

    if (section === 'chat') {
      return [
        {
          icon: 'contrast-outline',
          kind: 'action',
          onPress: () => navigation.navigate('SettingSectionScreen', { section: 'theme' }),
          subtitle: 'System default, light or dark',
          title: 'Theme',
          value: themePreference === 'system' ? 'System' : themePreference === 'dark' ? 'Dark' : 'Light',
        },
        {
          icon: 'images-outline',
          key: 'saveIncomingMedia',
          kind: 'switch',
          subtitle: 'Save incoming media on this device',
          title: 'Media visibility',
        },
        {
          icon: 'folder-outline',
          kind: 'action',
          onPress: () => navigation.navigate('StorageScreen'),
          subtitle: 'Storage usage and auto-download',
          title: 'Storage and data',
        },
      ];
    }

    if (section === 'call') {
      return [
        {
          icon: 'notifications-outline',
          key: 'callNotificationsEnabled',
          kind: 'switch',
          subtitle: 'Show alerts for incoming calls',
          title: 'Call notifications',
        },
        {
          icon: 'videocam-outline',
          key: 'cameraEnabled',
          kind: 'switch',
          subtitle: 'Allow video during calls',
          title: 'Camera',
        },
        {
          icon: 'mic-outline',
          key: 'microphoneEnabled',
          kind: 'switch',
          subtitle: 'Allow voice during calls',
          title: 'Microphone',
        },
      ];
    }

    if (section === 'keyboard') {
      return [
        {
          icon: 'flash-outline',
          key: 'keyboardShortcutsEnabled',
          kind: 'switch',
          subtitle: 'Enable quick keyboard actions',
          title: 'Quick actions',
        },
        {
          icon: 'search-outline',
          kind: 'action',
          onPress: () => showInfo('Search shortcut', 'Use the search field at the top of lists to filter chats and settings.'),
          subtitle: 'Find chats and settings faster',
          title: 'Search',
          value: '/',
        },
        {
          icon: 'chatbubble-ellipses-outline',
          kind: 'action',
          onPress: () => showInfo('New chat shortcut', 'Use the compose button on the Chats tab to start a conversation.'),
          subtitle: 'Start a conversation quickly',
          title: 'New chat',
          value: 'N',
        },
      ];
    }

    if (section === 'help') {
      return [
        {
          icon: 'help-buoy-outline',
          kind: 'action',
          onPress: () => showInfo('Help centre', 'Help articles are available in the app guide.'),
          subtitle: 'Get help using Chatterly',
          title: 'Help centre',
        },
        {
          icon: 'mail-outline',
          kind: 'action',
          onPress: () => showInfo('Contact us', 'Send feedback to the Chatterly support team from your connected support channel.'),
          subtitle: 'Share feedback or report a problem',
          title: 'Contact us',
        },
        {
          icon: 'document-text-outline',
          kind: 'action',
          onPress: () => showInfo('Privacy policy', 'Chatterly stores demo data locally for this mobile task.'),
          subtitle: 'Review privacy information',
          title: 'Privacy policy',
        },
      ];
    }

    return [];
  }, [navigation, section, themePreference]);

  const updateSwitch = (key: keyof AppSettings, value: boolean) => {
    void updateSettings({ [key]: value } as Partial<AppSettings>);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{sectionTitle(section)}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        {section === 'theme' && (
          <View style={styles.card}>
            {themeChoices.map((item) => {
              const selected = item.value === themePreference;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => void setThemePreference(item.value)}
                  style={({ pressed }) => [styles.choiceRow, selected && styles.choiceRowActive, pressed && styles.rowPressed]}
                >
                  <View style={styles.choiceText}>
                    <Text style={styles.choiceLabel}>{item.label}</Text>
                    <Text style={styles.choiceSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {section === 'language' && (
          <View style={styles.card}>
            {languageChoices.map((item) => {
              const selected = item.value === settings.language;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => void updateSettings({ language: item.value })}
                  style={({ pressed }) => [styles.choiceRow, selected && styles.choiceRowActive, pressed && styles.rowPressed]}
                >
                  <View style={styles.choiceText}>
                    <Text style={styles.choiceLabel}>{item.label}</Text>
                    <Text style={styles.choiceSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {rows.length > 0 && (
          <View style={styles.card}>
            {rows.map((item) => (
              <Pressable
                key={item.title}
                onPress={item.kind === 'action' ? item.onPress : undefined}
                style={({ pressed }) => [styles.settingRow, pressed && item.kind === 'action' && styles.rowPressed]}
              >
                <View style={styles.iconColumn}>
                  <Ionicons name={item.icon} size={22} color={colors.textMuted} />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceLabel}>{item.title}</Text>
                  <Text style={styles.choiceSubtitle}>{item.subtitle}</Text>
                </View>
                {item.kind === 'switch' ? (
                  <Switch
                    ios_backgroundColor={colors.divider}
                    onValueChange={(value) => updateSwitch(item.key, value)}
                    thumbColor={settings[item.key] ? colors.badgeText : colors.textMuted}
                    trackColor={{ false: colors.divider, true: colors.accent }}
                    value={Boolean(settings[item.key])}
                  />
                ) : (
                  <View style={styles.actionMeta}>
                    {item.value && <Text style={styles.valueText}>{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: {
      backgroundColor: colors.background,
      flex: 1,
    },
    card: {
      marginTop: 4,
    },
    actionMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      marginLeft: 12,
    },
    choiceLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '400',
    },
    choiceRow: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 66,
      paddingRight: 4,
    },
    choiceRowActive: {
      backgroundColor: colors.mode === 'dark' ? '#182229' : '#F7F5F3',
      borderRadius: 10,
      borderBottomWidth: 0,
      marginVertical: 2,
      paddingLeft: 12,
    },
    choiceSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 19,
      marginTop: 3,
    },
    choiceText: {
      flex: 1,
      minWidth: 0,
    },
    content: {
      paddingBottom: 30,
      paddingHorizontal: 22,
      paddingTop: 20,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      minHeight: 56 + androidTopInset,
      paddingHorizontal: 10,
      paddingTop: androidTopInset,
    },
    headerButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      marginRight: 8,
      width: 44,
    },
    iconColumn: {
      alignItems: 'center',
      height: 54,
      justifyContent: 'center',
      marginRight: 14,
      width: 36,
    },
    radio: {
      alignItems: 'center',
      borderColor: colors.textMuted,
      borderRadius: 13,
      borderWidth: 2,
      height: 26,
      justifyContent: 'center',
      marginLeft: 18,
      width: 26,
    },
    radioDot: {
      backgroundColor: colors.primary,
      borderRadius: 7,
      height: 14,
      width: 14,
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    rowPressed: {
      backgroundColor: colors.mode === 'dark' ? '#1E2A31' : '#F7F5F3',
    },
    settingRow: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 70,
      paddingRight: 4,
    },
    title: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '400',
    },
    valueText: {
      color: colors.textMuted,
      fontSize: 13,
      marginRight: 6,
    },
  });
