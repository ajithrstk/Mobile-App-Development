import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CallMode, type CallLog } from '../calls/types/call';
import { callHistoryService } from '../calls/services/callHistoryService';
import { chatsById } from '../data/chats';
import type { RootStackParamList } from '../types';
import { formatCallDuration, getCallDirectionLabel, getCallModeLabel, getCallStateLabel } from '../utils/callFormatting';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type CallDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'CallDetailsScreen'>;

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function CallDetailsScreen({ navigation, route }: CallDetailsScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [log, setLog] = useState<CallLog | null>(null);

  useEffect(() => {
    void callHistoryService.list().then((logs) => {
      setLog(logs.find((item) => item.id === route.params.logId) ?? null);
    });
  }, [route.params.logId]);

  if (!log) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={25} color={colors.icon} />
          </TouchableOpacity>
          <Text style={styles.title}>Call details</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Call log unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chat = chatsById[log.contactId];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Call details</Text>
      </View>
      <View style={styles.content}>
        <Image source={chat.avatar} style={styles.avatar} />
        <Text numberOfLines={1} style={styles.name}>{chat.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('CallScreen', { contact: chat, mode: CallMode.Voice })} style={styles.action}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CallScreen', { contact: chat, mode: CallMode.Video })} style={styles.action}>
            <Ionicons name="videocam-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.details}>
          <Text style={styles.detail}>Type: {getCallModeLabel(log.mode)}</Text>
          <Text style={styles.detail}>Direction: {getCallDirectionLabel(log.direction)}</Text>
          <Text style={styles.detail}>Status: {getCallStateLabel(log.state)}</Text>
          <Text style={styles.detail}>Duration: {formatCallDuration(log.durationSeconds)}</Text>
          <Text style={styles.detail}>Started: {new Date(log.startedAt).toLocaleString()}</Text>
          <Text style={styles.detail}>Ended: {new Date(log.endedAt).toLocaleString()}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    action: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      height: 48,
      justifyContent: 'center',
      marginHorizontal: 6,
      width: 58,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 16,
    },
    avatar: {
      borderRadius: 46,
      height: 92,
      width: 92,
    },
    content: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      padding: 22,
    },
    detail: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
      marginBottom: 12,
    },
    details: {
      alignSelf: 'stretch',
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 24,
      paddingTop: 18,
    },
    empty: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '500',
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
    name: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '500',
      marginTop: 12,
      maxWidth: '92%',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '400',
      marginLeft: 8,
    },
  });
