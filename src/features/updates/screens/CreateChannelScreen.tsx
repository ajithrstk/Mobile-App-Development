import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { updatesActions } from '../state/updatesSlice';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateChannelScreen'>;

export default function CreateChannelScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [saving, setSaving] = useState(false);

  async function chooseLogo(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose a channel picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.84,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function save(): Promise<void> {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      const channel = await updatesActions.createChannel({ avatarUri: avatarUri.trim() || undefined, description, name, username });
      navigation.replace('ChannelScreen', { channelId: channel.id });
    } catch (error) {
      Alert.alert('Channel not created', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
          </Pressable>
          <Text style={styles.headerTitle}>New channel</Text>
          <Pressable onPress={() => void save()} style={styles.saveButton}>
            <Text style={styles.saveText}>{saving ? 'Saving' : 'Create'}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => void chooseLogo()} style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={28} color={colors.icon} />
                <Text style={styles.avatarText}>Add photo</Text>
              </>
            )}
          </Pressable>
          <TextInput onChangeText={setName} placeholder="Channel name" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
          <TextInput autoCapitalize="none" onChangeText={setUsername} placeholder="Username" placeholderTextColor={colors.textMuted} style={styles.input} value={username} />
          <TextInput onChangeText={setDescription} placeholder="Description" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline]} multiline value={description} />
          <TextInput autoCapitalize="none" onChangeText={setAvatarUri} placeholder="Picture URL or local media URI" placeholderTextColor={colors.textMuted} style={styles.input} value={avatarUri} />
          <Text style={styles.note}>This uses the typed mock channel adapter until real channel APIs are available.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderRadius: 42,
      height: 84,
      justifyContent: 'center',
      marginBottom: 24,
      overflow: 'hidden',
      width: 84,
    },
    avatarImage: {
      height: 84,
      width: 84,
    },
    avatarText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
    },
    content: {
      padding: 16,
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
      fontSize: 16,
      minHeight: 50,
      paddingVertical: 10,
    },
    keyboard: {
      flex: 1,
    },
    multiline: {
      minHeight: 88,
      textAlignVertical: 'top',
    },
    note: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 20,
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
  });
