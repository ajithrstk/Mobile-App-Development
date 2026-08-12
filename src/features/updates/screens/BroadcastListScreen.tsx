import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import BroadcastItem from '../components/BroadcastItem';
import { useBroadcasts } from '../hooks/useBroadcast';
import type { BroadcastList } from '../types/updates.types';
import contacts from '../../../data/contacts';
import type { RootStackParamList } from '../../../types';
import type { ContactProfile } from '../../../types/contact';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BroadcastListScreen'>;

export default function BroadcastListScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { broadcasts, createBroadcast, deleteBroadcast, sendBroadcastMessage, updateBroadcast } = useBroadcasts();
  const [selected, setSelected] = useState<BroadcastList | null>(null);
  const [name, setName] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  function openBroadcast(list: BroadcastList): void {
    setSelected(list);
    setName(list.name);
    setSelectedRecipients(list.recipientIds);
  }

  async function saveList(): Promise<void> {
    if (selected) {
      await updateBroadcast(selected.id, name, selectedRecipients);
      Alert.alert('Saved', 'Broadcast list updated.');
      return;
    }

    await createBroadcast(name || 'Broadcast list', selectedRecipients);
    setName('');
    setSelectedRecipients([]);
  }

  async function send(): Promise<void> {
    if (!selected || !message.trim()) {
      Alert.alert('Message required', 'Choose a broadcast list and type a message.');
      return;
    }

    await sendBroadcastMessage(selected.id, message);
    Alert.alert('Broadcast sent', `${selected.recipientIds.length} individual messages were queued.`);
    setMessage('');
  }

  function toggleContact(contact: ContactProfile): void {
    setSelectedRecipients((current) => (
      current.includes(contact.id) ? current.filter((id) => id !== contact.id) : [...current, contact.id]
    ));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
          </Pressable>
          <Text style={styles.headerTitle}>Broadcast lists</Text>
          <Pressable onPress={() => { setSelected(null); setName(''); setSelectedRecipients([]); }} style={styles.iconButton}>
            <Ionicons name="add" size={24} color={colors.icon} />
          </Pressable>
        </View>
        <FlatList
          ListHeaderComponent={(
            <View>
              <View style={styles.editor}>
                <Text style={styles.sectionTitle}>{selected ? 'Edit broadcast' : 'New broadcast'}</Text>
                <TextInput onChangeText={setName} placeholder="List name" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
                <TextInput onChangeText={setMessage} placeholder="Message to send" placeholderTextColor={colors.textMuted} style={[styles.input, styles.messageInput]} multiline value={message} />
                <View style={styles.editorActions}>
                  <Pressable onPress={() => void saveList()} style={styles.primaryButton}><Text style={styles.primaryText}>{selected ? 'Save list' : 'Create list'}</Text></Pressable>
                  <Pressable onPress={() => void send()} style={styles.secondaryButton}><Text style={styles.secondaryText}>Send</Text></Pressable>
                </View>
              </View>
              <Text style={styles.sectionTitlePadded}>Lists</Text>
              {broadcasts.length === 0 && <Text style={styles.emptyText}>Create a list and choose recipients below.</Text>}
              {broadcasts.map((broadcast) => (
                <BroadcastItem
                  broadcast={broadcast}
                  colors={colors}
                  key={broadcast.id}
                  onDelete={() => void deleteBroadcast(broadcast.id)}
                  onOpen={() => openBroadcast(broadcast)}
                />
              ))}
              <Text style={styles.sectionTitlePadded}>Recipients</Text>
            </View>
          )}
          data={contacts}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const checked = selectedRecipients.includes(item.id);

            return (
              <Pressable onPress={() => toggleContact(item)} style={styles.contactRow}>
                <View style={styles.contactAvatar}><Text style={styles.initial}>{item.name.charAt(0)}</Text></View>
                <View style={styles.contactText}>
                  <Text numberOfLines={1} style={styles.contactName}>{item.name}</Text>
                  <Text numberOfLines={1} style={styles.contactStatus}>{item.status}</Text>
                </View>
                <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={checked ? colors.primary : colors.icon} />
              </Pressable>
            );
          }}
          style={styles.list}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contactAvatar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 21,
      height: 42,
      justifyContent: 'center',
      marginRight: 12,
      width: 42,
    },
    contactName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    contactRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 60,
      paddingHorizontal: 16,
    },
    contactStatus: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    contactText: {
      flex: 1,
      minWidth: 0,
    },
    editor: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      padding: 16,
    },
    editorActions: {
      flexDirection: 'row',
      marginTop: 14,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    header: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 6,
      paddingVertical: 8,
    },
    headerTitle: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
    },
    iconButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    initial: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    input: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      color: colors.text,
      fontSize: 15,
      minHeight: 48,
      paddingVertical: 10,
    },
    keyboard: {
      flex: 1,
    },
    list: {
      backgroundColor: colors.background,
      flex: 1,
    },
    messageInput: {
      minHeight: 76,
      textAlignVertical: 'top',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 18,
      minHeight: 38,
      justifyContent: 'center',
      marginRight: 10,
      paddingHorizontal: 16,
    },
    primaryText: {
      color: colors.badgeText,
      fontSize: 14,
      fontWeight: '700',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      minHeight: 38,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    secondaryText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    sectionTitlePadded: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      paddingHorizontal: 16,
      paddingTop: 18,
      textTransform: 'uppercase',
    },
  });
