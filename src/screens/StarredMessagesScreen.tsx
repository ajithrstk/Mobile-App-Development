import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FileMessage from '../components/FileMessage';
import VoiceMessage from '../components/VoiceMessage';
import type { RootStackParamList } from '../types';
import type { ChatMessage } from '../types/message';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';
import { formatMessageTime, getMessagePreview } from '../utils/chat';

type StarredMessagesScreenProps = NativeStackScreenProps<RootStackParamList, 'StarredMessagesScreen'>;

export default function StarredMessagesScreen({ navigation, route }: StarredMessagesScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const starredMessages = useMemo(
    () => route.params.messages.filter((message) => message.starred),
    [route.params.messages],
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={() => navigation.navigate('ChatScreen', { chat: route.params.chat })}
      style={styles.messageRow}
    >
      <View style={styles.starShell}>
        <Ionicons name="star" size={19} color={colors.accent} />
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.sender}>{item.sender === 'me' ? 'You' : route.params.chat.name}</Text>
        {item.kind === 'file' || item.kind === 'audio' ? (
          <FileMessage colors={colors} message={item} onDownload={() => undefined} onRetry={() => undefined} />
        ) : item.kind === 'voice' ? (
          <VoiceMessage colors={colors} message={item} width={360} />
        ) : (
          <Text numberOfLines={3} style={styles.preview}>{getMessagePreview(item)}</Text>
        )}
        <Text style={styles.time}>{formatMessageTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Starred Messages</Text>
      </View>
      <View style={styles.body}>
        <FlatList
          contentContainerStyle={starredMessages.length === 0 ? styles.emptyList : undefined}
          data={starredMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={34} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No starred messages</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 62,
      paddingHorizontal: 8,
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 42,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '400',
    },
    body: {
      backgroundColor: colors.background,
      flex: 1,
    },
    messageRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    starShell: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      marginRight: 10,
      width: 28,
    },
    messageContent: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flex: 1,
      paddingBottom: 12,
    },
    sender: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    preview: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
    },
    time: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 5,
    },
    emptyList: {
      flexGrow: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    emptyTitle: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
      marginTop: 10,
    },
  });
