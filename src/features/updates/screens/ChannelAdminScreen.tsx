import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { channelService } from '../services/channelService';
import { updatesActions, useUpdates } from '../state/updatesSlice';
import type { ChannelUpdateKind } from '../types/updates.types';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelAdminScreen'>;

const updateKinds: ChannelUpdateKind[] = ['text', 'image', 'video', 'link'];

export default function ChannelAdminScreen({ navigation, route }: Props) {
  const { channelId } = route.params;
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const channel = useUpdates((state) => state.channels.find((item) => item.id === channelId));
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [adminIds, setAdminIds] = useState('');
  const [followersCanReact, setFollowersCanReact] = useState(true);
  const [followersCanForward, setFollowersCanForward] = useState(true);
  const [notificationsDefaultOn, setNotificationsDefaultOn] = useState(true);
  const [kind, setKind] = useState<ChannelUpdateKind>('text');
  const [updateText, setUpdateText] = useState('');
  const [mediaUri, setMediaUri] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const isAdmin = Boolean(channel && channelService.canAdmin(channel));

  useEffect(() => {
    if (!channel) {
      void updatesActions.initialize();
      return;
    }

    setName(channel.name);
    setUsername(channel.username);
    setDescription(channel.description);
    setAvatarUri(channel.avatarUri ?? '');
    setAdminIds(channel.adminIds.join(', '));
    setFollowersCanForward(channel.permissions?.followersCanForward ?? true);
    setFollowersCanReact(channel.permissions?.followersCanReact ?? true);
    setNotificationsDefaultOn(channel.permissions?.notificationsDefaultOn ?? true);
  }, [channel]);

  async function saveChannel(): Promise<void> {
    if (!channel || saving) {
      return;
    }

    try {
      setSaving(true);
      await updatesActions.updateChannel(channel.id, {
        adminIds: adminIds.split(',').map((item) => item.trim()).filter(Boolean),
        avatarUri: avatarUri.trim() || undefined,
        description,
        name,
        permissions: {
          followersCanForward,
          followersCanReact,
          notificationsDefaultOn,
        },
        username,
      });
      Alert.alert('Saved', 'Channel details updated.');
    } catch (error) {
      Alert.alert('Not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function publish(): Promise<void> {
    if (!channel || !updateText.trim()) {
      Alert.alert('Update required', 'Type a channel update first.');
      return;
    }

    try {
      await updatesActions.publishUpdate({
        channelId: channel.id,
        kind,
        linkPreview: kind === 'link' && linkUrl.trim()
          ? { description: updateText, title: channel.name, url: linkUrl.trim() }
          : undefined,
        mediaUri: mediaUri.trim() || undefined,
        text: updateText,
      });
      setUpdateText('');
      setMediaUri('');
      setLinkUrl('');
      navigation.navigate('ChannelScreen', { channelId: channel.id });
    } catch (error) {
      Alert.alert('Update not published', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  function deleteChannel(): void {
    if (!channel) {
      return;
    }

    Alert.alert('Delete channel?', `${channel.name} and its updates will be removed from the mock cache.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void updatesActions.deleteChannel(channel.id).then(() => navigation.navigate('MainTabs'));
        },
      },
    ]);
  }

  if (channel && !isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.icon} /></Pressable>
          <Text style={styles.headerTitle}>Channel tools</Text>
        </View>
        <View style={styles.empty}><Text style={styles.emptyText}>Only channel owners and admins can manage this channel.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.icon} /></Pressable>
          <Text style={styles.headerTitle}>Channel tools</Text>
          <Pressable onPress={() => void saveChannel()} style={styles.saveButton}><Text style={styles.saveText}>{saving ? 'Saving' : 'Save'}</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Profile</Text>
          <TextInput onChangeText={setName} placeholder="Name" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
          <TextInput autoCapitalize="none" onChangeText={setUsername} placeholder="Username" placeholderTextColor={colors.textMuted} style={styles.input} value={username} />
          <TextInput onChangeText={setDescription} placeholder="Description" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline]} multiline value={description} />
          <TextInput autoCapitalize="none" onChangeText={setAvatarUri} placeholder="Channel picture URI" placeholderTextColor={colors.textMuted} style={styles.input} value={avatarUri} />
          <TextInput autoCapitalize="none" onChangeText={setAdminIds} placeholder="Admin user IDs, comma separated" placeholderTextColor={colors.textMuted} style={styles.input} value={adminIds} />
          <Text style={styles.sectionTitle}>Permissions</Text>
          <SwitchRow colors={colors} label="Followers can react" onValueChange={setFollowersCanReact} value={followersCanReact} />
          <SwitchRow colors={colors} label="Followers can forward" onValueChange={setFollowersCanForward} value={followersCanForward} />
          <SwitchRow colors={colors} label="Notifications default on" onValueChange={setNotificationsDefaultOn} value={notificationsDefaultOn} />
          <Text style={styles.sectionTitle}>Publish update</Text>
          <View style={styles.kindRow}>
            {updateKinds.map((item) => (
              <Pressable key={item} onPress={() => setKind(item)} style={[styles.kindButton, kind === item && styles.kindSelected]}>
                <Text style={[styles.kindText, kind === item && styles.kindTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput onChangeText={setUpdateText} placeholder="Write an update" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline]} multiline value={updateText} />
          {(kind === 'image' || kind === 'video') && <TextInput autoCapitalize="none" onChangeText={setMediaUri} placeholder="Media URI" placeholderTextColor={colors.textMuted} style={styles.input} value={mediaUri} />}
          {kind === 'link' && <TextInput autoCapitalize="none" onChangeText={setLinkUrl} placeholder="Link URL" placeholderTextColor={colors.textMuted} style={styles.input} value={linkUrl} />}
          <Pressable onPress={() => void publish()} style={styles.publishButton}><Text style={styles.publishText}>Publish</Text></Pressable>
          <Pressable onPress={deleteChannel} style={styles.deleteButton}><Text style={styles.deleteText}>Delete channel</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SwitchRow({ colors, label, onValueChange, value }: { colors: ThemeColors; label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchText}>{label}</Text>
      <Switch onValueChange={onValueChange} thumbColor={value ? colors.primary : colors.surface} value={value} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: 16,
      paddingBottom: 36,
    },
    deleteButton: {
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
      marginTop: 12,
    },
    deleteText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '700',
    },
    empty: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: 'center',
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
    kindButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginRight: 8,
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    kindRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 8,
    },
    kindSelected: {
      backgroundColor: colors.primary,
    },
    kindText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    kindTextSelected: {
      color: colors.badgeText,
    },
    multiline: {
      minHeight: 86,
      textAlignVertical: 'top',
    },
    publishButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 20,
      minHeight: 42,
      justifyContent: 'center',
      marginTop: 16,
    },
    publishText: {
      color: colors.badgeText,
      fontSize: 15,
      fontWeight: '700',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    saveButton: {
      alignItems: 'center',
      minHeight: 38,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    saveText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 18,
      textTransform: 'uppercase',
    },
    switchRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 50,
    },
    switchText: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
    },
  });
