import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { notificationService } from '../notifications/services/notificationService';
import type { RootStackParamList } from '../types';
import { usePersistentSettings } from '../hooks/usePersistentSettings';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type NotificationSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'NotificationSettingsScreen'>;

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, updateSettings } = usePersistentSettings();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <View style={styles.content}>
        <SettingSwitch
          colors={colors}
          label="Message notifications"
          onValueChange={(value) => void updateSettings({ notificationsEnabled: value })}
          value={settings.notificationsEnabled}
        />
        <SettingSwitch
          colors={colors}
          label="Message previews"
          onValueChange={(value) => void updateSettings({ messagePreviewEnabled: value })}
          value={settings.messagePreviewEnabled}
        />
        <SettingSwitch
          colors={colors}
          label="Call notifications"
          onValueChange={(value) => void updateSettings({ callNotificationsEnabled: value })}
          value={settings.callNotificationsEnabled}
        />
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={() => void notificationService.requestPermission()}
          style={styles.permissionButton}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          <Text style={styles.permissionText}>Request notification permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={() => void notificationService.clearBadgeCount()}
          style={styles.permissionButton}
        >
          <Ionicons name="notifications-off-outline" size={22} color={colors.primary} />
          <Text style={styles.permissionText}>Clear notification badge</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SettingSwitch({
  colors,
  label,
  onValueChange,
  value,
}: {
  colors: ThemeColors;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  const styles = createStyles(colors);

  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        ios_backgroundColor={colors.divider}
        onValueChange={onValueChange}
        thumbColor={value ? colors.badgeText : colors.textMuted}
        trackColor={{ false: colors.divider, true: colors.accent }}
        value={value}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      backgroundColor: colors.background,
      flex: 1,
      paddingTop: 8,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingBottom: 10,
      paddingHorizontal: 8,
      paddingTop: 16 + androidTopInset,
    },
    headerButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    permissionButton: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 58,
      paddingHorizontal: 16,
    },
    permissionText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
      marginLeft: 12,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    switchLabel: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
    switchRow: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 58,
      paddingHorizontal: 16,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '400',
      marginLeft: 8,
    },
  });
