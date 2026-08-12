import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SearchBar from '../components/SearchBar';
import contacts from '../data/contacts';
import { getContactChat } from '../data/contacts';
import { chatsActions } from '../state/chats/chatsStore';
import { messagesActions } from '../state/messages/messagesStore';
import type { RootStackParamList } from '../types';
import type { ContactProfile } from '../types/contact';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';
import { getMessagePreview } from '../utils/chat';

type ForwardSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'ForwardSelectionScreen'>;

export default function ForwardSelectionScreen({ navigation, route }: ForwardSelectionScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const messages = route.params.messages;

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return contacts.slice(0, 80);
    }

    return contacts.filter((contact) => contact.name.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const toggleContact = (contactId: string) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(contactId)) {
        nextIds.delete(contactId);
      } else {
        nextIds.add(contactId);
      }

      return nextIds;
    });
  };

  const sendForward = () => {
    const selectedContacts = contacts.filter((contact) => selectedIds.has(contact.id));

    if (selectedContacts.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const selectedChats = selectedContacts.map(getContactChat);

    selectedChats.forEach((targetChat, chatIndex) => {
      chatsActions.upsertChat(targetChat);
      messages.forEach((message, messageIndex) => {
        const forwardedMessage = {
          ...message,
          chatId: targetChat.id,
          clientId: undefined,
          id: `forwarded-${timestamp}-${chatIndex}-${messageIndex}-${message.id}`,
          reactions: undefined,
          sender: 'me' as const,
          status: 'sent' as const,
          timestamp: new Date(timestamp + messageIndex * 1000).toISOString(),
          forwarded: true,
        };
        messagesActions.upsert(targetChat.id, forwardedMessage);
      });
    });

    if (selectedContacts.length === 1) {
      navigation.replace('ChatScreen', {
        chat: selectedChats[0],
        targetMessageId: `forwarded-${timestamp}-0-${messages.length - 1}-${messages[messages.length - 1].id}`,
      });
      return;
    }

    Alert.alert('Forwarded', `${messages.length} message${messages.length === 1 ? '' : 's'} sent to ${selectedContacts.length} chats.`);
    navigation.goBack();
  };

  const renderContact = ({ item }: { item: ContactProfile }) => {
    const selected = selectedIds.has(item.id);

    return (
      <TouchableOpacity activeOpacity={0.72} onPress={() => toggleContact(item.id)} style={styles.contactRow}>
        {item.avatar ? (
          <Image source={item.avatar} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={22} color={colors.icon} />
          </View>
        )}
        <View style={styles.contactText}>
          <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
          <Text numberOfLines={1} style={styles.status}>{item.status}</Text>
        </View>
        <View style={[styles.checkbox, selected && styles.selectedCheckbox]}>
          {selected && <Ionicons name="checkmark" size={17} color={colors.badgeText} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Forward to</Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {messages.map(getMessagePreview).join(', ')}
          </Text>
        </View>
        <TouchableOpacity
          disabled={selectedIds.size === 0}
          onPress={sendForward}
          style={[styles.sendButton, selectedIds.size === 0 && styles.disabledButton]}
        >
          <Ionicons name="send" size={20} color={colors.badgeText} />
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <SearchBar colors={colors} onChangeText={setQuery} placeholder="Search contacts" value={query} />
        <FlatList
          data={filteredContacts}
          initialNumToRender={18}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          maxToRenderPerBatch={12}
          renderItem={renderContact}
          windowSize={8}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No contacts found</Text>
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
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '400',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderRadius: 21,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    disabledButton: {
      opacity: 0.38,
    },
    body: {
      backgroundColor: colors.background,
      flex: 1,
    },
    contactRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 72,
      paddingHorizontal: 14,
    },
    avatar: {
      borderRadius: 24,
      height: 48,
      width: 48,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      justifyContent: 'center',
    },
    contactText: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flex: 1,
      justifyContent: 'center',
      marginLeft: 12,
      minHeight: 72,
    },
    name: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    status: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    checkbox: {
      alignItems: 'center',
      borderColor: colors.divider,
      borderRadius: 12,
      borderWidth: 2,
      height: 24,
      justifyContent: 'center',
      marginLeft: 12,
      width: 24,
    },
    selectedCheckbox: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyTitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '500',
    },
  });
