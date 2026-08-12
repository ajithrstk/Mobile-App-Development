import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import {
  defaultAutoDownloadPreferences,
  storageManagementService,
  type AutoDownloadPreferences,
  type StorageUsage,
} from '../services/storage/storageManagementService';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type StorageScreenProps = NativeStackScreenProps<RootStackParamList, 'StorageScreen'>;
type PreferenceKey = keyof AutoDownloadPreferences;

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StorageScreen({ navigation }: StorageScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [preferences, setPreferences] = useState(defaultAutoDownloadPreferences);

  const loadStorage = useCallback(() => {
    void Promise.all([
      storageManagementService.getUsage(),
      storageManagementService.getAutoDownloadPreferences(),
    ]).then(([nextUsage, nextPreferences]) => {
      setUsage(nextUsage);
      setPreferences(nextPreferences);
    });
  }, []);

  useEffect(loadStorage, [loadStorage]);

  const clearCache = useCallback(() => {
    Alert.alert('Clear cache?', 'Temporary files will be deleted and storage usage will update.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void storageManagementService.clearCache().then(setUsage);
        },
      },
    ]);
  }, []);

  const deleteSelectedMedia = useCallback(() => {
    Alert.alert('Delete selected media?', 'Selected local media placeholders will be removed from storage accounting.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setUsage((currentUsage) => currentUsage ? { ...currentUsage, media: 0, total: Math.max(0, currentUsage.total - currentUsage.media) } : currentUsage);
        },
      },
    ]);
  }, []);

  const updatePreference = useCallback((key: PreferenceKey, value: boolean) => {
    const nextPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(nextPreferences);
    void storageManagementService.setAutoDownloadPreferences(nextPreferences);
  }, [preferences]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Storage</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.usageHeader}>
          <Text style={styles.totalLabel}>Total application storage</Text>
          <Text style={styles.totalValue}>{usage ? formatBytes(usage.total) : 'Calculating'}</Text>
        </View>
        <UsageRow colors={colors} label="Cache" value={usage?.cache ?? 0} />
        <UsageRow colors={colors} label="Media" value={usage?.media ?? 0} />
        <UsageRow colors={colors} label="Documents" value={usage?.documents ?? 0} />
        <UsageRow colors={colors} label="Audio" value={usage?.audio ?? 0} />
        <UsageRow colors={colors} label="Video" value={usage?.video ?? 0} />
        <UsageRow colors={colors} label="Downloaded files" value={usage?.downloads ?? 0} />

        <View style={styles.actions}>
          <TouchableOpacity onPress={clearCache} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={styles.actionText}>Clear cache</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteSelectedMedia} style={styles.actionButton}>
            <Ionicons name="images-outline" size={20} color={colors.danger} />
            <Text style={styles.actionText}>Delete selected media</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Auto-download</Text>
        {Object.keys(preferences).map((key) => (
          <PreferenceSwitch
            colors={colors}
            key={key}
            label={key.replace(/([A-Z])/g, ' $1')}
            onValueChange={(value) => updatePreference(key as PreferenceKey, value)}
            value={preferences[key as PreferenceKey]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function UsageRow({ colors, label, value }: { colors: ThemeColors; label: string; value: number }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.usageRow}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{formatBytes(value)}</Text>
    </View>
  );
}

function PreferenceSwitch({
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
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
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
    actionButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 8,
      minHeight: 48,
      paddingHorizontal: 12,
    },
    actionText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 9,
    },
    actions: {
      marginTop: 14,
    },
    content: {
      backgroundColor: colors.background,
      flex: 1,
      padding: 16,
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
    preferenceLabel: {
      color: colors.text,
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    preferenceRow: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 48,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '500',
      marginBottom: 8,
      marginTop: 16,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '400',
      marginLeft: 8,
    },
    totalLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
    totalValue: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '500',
      marginTop: 5,
    },
    usageHeader: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 12,
      padding: 14,
    },
    usageLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    usageRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    usageValue: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
  });
