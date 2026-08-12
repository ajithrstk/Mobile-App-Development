import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useScreenMetric } from '../hooks/useScreenMetric';
import { authActions, useAuth } from '../state/auth/authStore';
import type { RootStackParamList, SettingSection } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type SettingsNavigation = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SettingsItem = {
  id: string;
  section?: SettingSection;
  title: string;
  subtitle: string;
  icon: IoniconName;
  onPress: () => void;
};

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<SettingsNavigation>();
  useScreenMetric('SettingsScreen');
  const user = useAuth((state) => state.user);
  const [query, setQuery] = useState('');
  const profileName = user?.name?.trim();
  const showTitle = Boolean(profileName && profileName !== 'Chatterly User');

  const openSection = (section: SettingSection) => {
    navigation.navigate('SettingSectionScreen', { section });
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to use Chatterly.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void authActions.logout() },
    ]);
  };

  const items: SettingsItem[] = [
    {
      icon: 'laptop-outline',
      id: 'general',
      onPress: () => openSection('general'),
      section: 'general',
      subtitle: 'Startup and close',
      title: 'General',
    },
    {
      icon: 'person-circle-outline',
      id: 'profile',
      onPress: () => navigation.navigate('EditProfileScreen'),
      subtitle: 'Name, profile picture, username',
      title: 'Profile',
    },
    {
      icon: 'key-outline',
      id: 'account',
      onPress: () => openSection('account'),
      section: 'account',
      subtitle: 'Security notifications, account info',
      title: 'Account',
    },
    {
      icon: 'lock-closed-outline',
      id: 'privacy',
      onPress: () => openSection('privacy'),
      section: 'privacy',
      subtitle: 'Blocked contacts, disappearing messages',
      title: 'Privacy',
    },
    {
      icon: 'chatbox-outline',
      id: 'chats',
      onPress: () => openSection('chat'),
      section: 'chat',
      subtitle: 'Theme, wallpaper, chat settings',
      title: 'Chats',
    },
    {
      icon: 'videocam-outline',
      id: 'video',
      onPress: () => openSection('call'),
      section: 'call',
      subtitle: 'Camera, microphone & speakers',
      title: 'Video & voice',
    },
    {
      icon: 'notifications-outline',
      id: 'notifications',
      onPress: () => navigation.navigate('NotificationSettingsScreen'),
      subtitle: 'Messages, groups, sounds',
      title: 'Notifications',
    },
    {
      icon: 'keypad-outline',
      id: 'keyboard',
      onPress: () => openSection('keyboard'),
      section: 'keyboard',
      subtitle: 'Quick actions',
      title: 'Keyboard shortcuts',
    },
    {
      icon: 'help-circle-outline',
      id: 'help',
      onPress: () => openSection('help'),
      section: 'help',
      subtitle: 'Help centre, contact us, privacy policy',
      title: 'Help and feedback',
    },
  ];

  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    return `${item.title} ${item.subtitle}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.body} contentContainerStyle={styles.content}>
        {showTitle && <Text numberOfLines={1} style={styles.title}>{profileName}</Text>}
        <View style={[styles.searchBox, !showTitle && styles.searchBoxNoTitle]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <View style={styles.section}>
          {visibleItems.map((item) => (
            <Pressable key={item.id} onPress={item.onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <View style={styles.iconColumn}>
                <Ionicons name={item.icon} size={24} color={colors.textMuted} />
              </View>
              <View style={styles.rowText}>
                <Text numberOfLines={1} style={styles.rowTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {visibleItems.length === 0 && <Text style={styles.emptyText}>No settings found</Text>}

        <View style={styles.spacer} />

        {(!normalizedQuery || 'log out logout sign out'.includes(normalizedQuery)) && (
          <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.logoutRow, pressed && styles.rowPressed]}>
            <View style={styles.iconColumn}>
              <Ionicons name="log-out-outline" size={24} color={colors.danger} />
            </View>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
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
    content: {
      flexGrow: 1,
      paddingBottom: 28,
      paddingHorizontal: 20,
      paddingTop: 18 + androidTopInset,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 28,
      textAlign: 'center',
    },
    iconColumn: {
      alignItems: 'center',
      height: 54,
      justifyContent: 'center',
      marginRight: 18,
      width: 42,
    },
    logoutRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 58,
      paddingRight: 10,
    },
    logoutText: {
      color: colors.danger,
      flex: 1,
      fontSize: 17,
      fontWeight: '400',
    },
    row: {
      alignItems: 'center',
      borderRadius: 14,
      flexDirection: 'row',
      minHeight: 76,
      paddingRight: 10,
    },
    rowPressed: {
      backgroundColor: colors.mode === 'dark' ? '#1E2A31' : '#F7F5F3',
    },
    rowSubtitle: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 21,
      marginTop: 3,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '400',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    searchBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderRadius: 24,
      borderWidth: 2,
      flexDirection: 'row',
      height: 54,
      marginTop: 24,
      paddingHorizontal: 18,
    },
    searchBoxNoTitle: {
      marginTop: 0,
    },
    searchInput: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '400',
      marginLeft: 12,
      padding: 0,
    },
    section: {
      marginTop: 22,
    },
    spacer: {
      flexGrow: 1,
      minHeight: 8,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '400',
    },
  });
