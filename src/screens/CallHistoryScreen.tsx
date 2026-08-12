import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SearchBar from '../components/SearchBar';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import { callHistoryService } from '../calls/services/callHistoryService';
import { CallDirection, CallMode, CallState, type CallLog } from '../calls/types/call';
import { chatsById } from '../data/chats';
import type { RootStackParamList } from '../types';
import { formatCallDuration, getCallDirectionLabel, getCallModeLabel } from '../utils/callFormatting';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type CallHistoryNavigation = NativeStackNavigationProp<RootStackParamList>;

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

function formatCallTime(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(isoDate));
}

function getStatusColor(log: CallLog, colors: ThemeColors): string {
  if (log.state === CallState.Missed || log.state === CallState.Rejected) {
    return colors.danger;
  }

  return log.direction === CallDirection.Incoming ? colors.primary : colors.accent;
}

export default function CallHistoryScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<CallHistoryNavigation>();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [query, setQuery] = useState('');

  const loadLogs = useCallback(() => {
    void callHistoryService.list().then(setLogs);
  }, []);

  useFocusEffect(loadLogs);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return logs;
    }

    return logs.filter((log) => {
      const chat = chatsById[log.contactId];
      return [
        chat?.name,
        log.direction,
        log.mode,
        log.state,
      ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });
  }, [logs, query]);

  const deleteLog = useCallback((logId: string) => {
    Alert.alert('Delete call log?', 'This call will be removed from your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void callHistoryService.remove(logId).then(loadLogs);
        },
      },
    ]);
  }, [loadLogs]);

  const redial = useCallback((log: CallLog) => {
    const chat = chatsById[log.contactId];

    if (chat) {
      navigation.navigate('CallScreen', { contact: chat, mode: log.mode });
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
        <TouchableOpacity
          accessibilityLabel="Simulate incoming call"
          onPress={() => {
            const chat = chatsById['1'];
            navigation.navigate('IncomingCallScreen', {
              callId: `incoming-${Date.now()}`,
              contact: chat,
              mode: CallMode.Voice,
            });
          }}
          style={styles.headerButton}
        >
          <Ionicons name="call-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <NetworkStatusBanner colors={colors} />
        <SearchBar colors={colors} onChangeText={setQuery} value={query} />
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredLogs.length === 0 ? styles.emptyList : undefined}
          renderItem={({ item }) => {
            const chat = chatsById[item.contactId];
            const iconColor = getStatusColor(item, colors);

            return (
              <TouchableOpacity
                activeOpacity={0.72}
                onLongPress={() => deleteLog(item.id)}
                onPress={() => navigation.navigate('CallDetailsScreen', { logId: item.id })}
                style={styles.row}
              >
                <Image source={chat.avatar} style={styles.avatar} />
                <View style={styles.rowText}>
                  <Text numberOfLines={1} style={[styles.name, item.state === CallState.Missed && styles.missedName]}>
                    {chat.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name={item.direction === CallDirection.Incoming ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={15}
                      color={iconColor}
                    />
                    <Text numberOfLines={1} style={styles.meta}>
                      {getCallDirectionLabel(item.direction)} {getCallModeLabel(item.mode)} • {formatCallTime(item.startedAt)}
                    </Text>
                  </View>
                  <Text style={styles.duration}>{item.durationSeconds > 0 ? formatCallDuration(item.durationSeconds) : item.state}</Text>
                </View>
                <TouchableOpacity accessibilityLabel="Redial" onPress={() => redial(item)} style={styles.actionButton}>
                  <Ionicons name={item.mode === CallMode.Video ? 'videocam-outline' : 'call-outline'} size={23} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity accessibilityLabel="Delete call log" onPress={() => deleteLog(item.id)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={21} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No calls found</Text>
              <Text style={styles.emptySubtitle}>Missed, incoming, outgoing, voice, and video calls appear here.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      marginLeft: 4,
      width: 42,
    },
    avatar: {
      borderRadius: 24,
      height: 48,
      width: 48,
    },
    content: {
      backgroundColor: colors.background,
      flex: 1,
    },
    duration: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '400',
      marginTop: 4,
      textTransform: 'capitalize',
    },
    emptyContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    emptyList: {
      flexGrow: 1,
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 6,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '500',
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingHorizontal: 18,
      paddingTop: 16 + androidTopInset,
    },
    headerButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    meta: {
      color: colors.textMuted,
      flex: 1,
      fontSize: 13,
      marginLeft: 5,
    },
    metaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 4,
    },
    missedName: {
      color: colors.danger,
    },
    name: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '400',
    },
    row: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 76,
      paddingHorizontal: 16,
    },
    rowText: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '400',
    },
  });
