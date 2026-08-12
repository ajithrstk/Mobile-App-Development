import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useScreenMetric } from '../hooks/useScreenMetric';
import { authActions, useAuth } from '../state/auth/authStore';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfileScreen'>;

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
const fallbackAvatar = require('../../assets/avatars/realistic/male-01.png');

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  useScreenMetric('EditProfileScreen');
  const user = useAuth((state) => state.user);
  const error = useAuth((state) => state.error);
  const [name, setName] = useState(user?.name || 'Chatterly User');
  const [about, setAbout] = useState(user?.about || 'Available');
  const [avatarUri, setAvatarUri] = useState(user?.avatarUri);
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Record<string, number>>({});

  const avatarSource = avatarUri ? { uri: avatarUri } : fallbackAvatar;

  const rememberField = (field: string, y: number) => {
    fieldOffsets.current[field] = y;
  };

  const scrollToField = (field: string) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, (fieldOffsets.current[field] ?? 0) - 26),
      });
    }, 120);
  };

  const saveProfile = async (nextValues?: { name?: string; about?: string; avatarUri?: string }) => {
    const nextName = nextValues?.name ?? name;
    const nextAbout = nextValues?.about ?? about;
    const nextAvatarUri = nextValues && Object.prototype.hasOwnProperty.call(nextValues, 'avatarUri') ? nextValues.avatarUri : avatarUri;

    if (!nextName.trim()) {
      Alert.alert('Name required', 'Enter a profile name.');
      return;
    }

    setSaving(true);
    try {
      await authActions.updateProfile({
        about: nextAbout.trim(),
        avatarUri: nextAvatarUri,
        name: nextName.trim(),
      });
      setName(nextName.trim());
      setAbout(nextAbout.trim());
      setAvatarUri(nextAvatarUri);
      setEditingName(false);
      setEditingAbout(false);
    } catch {
      Alert.alert('Profile not saved', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const chooseProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.86,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const previousAvatarUri = avatarUri;
      const nextAvatarUri = result.assets[0].uri;
      setAvatarUri(nextAvatarUri);

      try {
        await saveProfile({ avatarUri: nextAvatarUri });
      } catch {
        setAvatarUri(previousAvatarUri);
      }
    }
  };

  const openPhotoOptions = () => {
    Alert.alert('Profile picture', 'Choose how you want to update your profile picture.', [
      { text: 'Choose photo', onPress: () => void chooseProfilePhoto() },
      { text: 'Remove photo', onPress: () => void saveProfile({ avatarUri: undefined }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showPhoneAction = () => {
    Alert.alert('Phone number', `${user?.phone || '+91 96559 70277'}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoider}>
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.content}
        >
          <TouchableOpacity activeOpacity={0.78} onPress={openPhotoOptions} style={styles.avatarButton}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={18} color={colors.badgeText} />
            </View>
          </TouchableOpacity>

          <ProfileField
            colors={colors}
            editing={editingName}
            label="Name"
            onChangeText={setName}
            onEdit={() => setEditingName(true)}
            onFocus={() => scrollToField('name')}
            onLayout={(y) => rememberField('name', y)}
            onSave={() => void saveProfile({ name })}
            value={name}
          />

          <ProfileField
            colors={colors}
            editing={editingAbout}
            helper="Until I change it"
            label="About"
            onChangeText={setAbout}
            onEdit={() => setEditingAbout(true)}
            onFocus={() => scrollToField('about')}
            onLayout={(y) => rememberField('about', y)}
            onSave={() => void saveProfile({ about })}
            value={about}
          />

          <View style={styles.phoneBlock}>
            <Text style={styles.sectionLabel}>Phone</Text>
            <View style={styles.phoneRow}>
              <Ionicons name="call" size={21} color={colors.textMuted} />
              <Text numberOfLines={1} style={styles.phoneText}>{user?.phone || '+91 96559 70277'}</Text>
              <TouchableOpacity accessibilityLabel="Copy phone number" onPress={showPhoneAction} style={styles.fieldButton}>
                <Ionicons name="copy-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          {saving && (
            <View style={styles.saving}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.savingText}>Saving profile</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileField({
  colors,
  editing,
  helper,
  label,
  onChangeText,
  onEdit,
  onFocus,
  onLayout,
  onSave,
  value,
}: {
  colors: ThemeColors;
  editing: boolean;
  helper?: string;
  label: string;
  onChangeText: (value: string) => void;
  onEdit: () => void;
  onFocus: () => void;
  onLayout: (y: number) => void;
  onSave: () => void;
  value: string;
}) {
  const styles = createStyles(colors);

  return (
    <View onLayout={(event) => onLayout(event.nativeEvent.layout.y)} style={styles.fieldBlock}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        {editing ? (
          <TextInput
            autoFocus
            multiline={label === 'About'}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onSubmitEditing={label === 'Name' ? onSave : undefined}
            placeholder={label}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={[styles.fieldInput, label === 'About' && styles.aboutInput]}
            value={value}
          />
        ) : (
          <Text numberOfLines={label === 'About' ? 3 : 1} style={styles.fieldValue}>{value}</Text>
        )}
        <TouchableOpacity accessibilityLabel={editing ? `Save ${label}` : `Edit ${label}`} onPress={editing ? onSave : onEdit} style={styles.fieldButton}>
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={25} color={colors.text} />
        </TouchableOpacity>
      </View>
      {helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    aboutInput: {
      minHeight: 42,
      textAlignVertical: 'top',
    },
    avatar: {
      borderRadius: 58,
      height: 116,
      width: 116,
    },
    avatarButton: {
      alignSelf: 'center',
      marginBottom: 28,
      marginTop: 18,
    },
    body: {
      backgroundColor: colors.background,
      flex: 1,
    },
    cameraBadge: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderColor: colors.background,
      borderRadius: 18,
      borderWidth: 2,
      bottom: 1,
      height: 36,
      justifyContent: 'center',
      position: 'absolute',
      right: 2,
      width: 36,
    },
    content: {
      paddingBottom: 36,
      paddingHorizontal: 26,
    },
    error: {
      color: colors.danger,
      fontSize: 14,
      marginTop: 22,
    },
    fieldBlock: {
      marginBottom: 30,
    },
    fieldButton: {
      alignItems: 'center',
      height: 38,
      justifyContent: 'center',
      marginLeft: 10,
      width: 38,
    },
    fieldInput: {
      borderBottomColor: colors.primary,
      borderBottomWidth: 1,
      color: colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '400',
      minHeight: 38,
      padding: 0,
    },
    fieldRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 14,
    },
    fieldValue: {
      color: colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 23,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      minHeight: 56 + androidTopInset,
      paddingHorizontal: 10,
      paddingTop: androidTopInset,
    },
    headerButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      marginRight: 8,
      width: 44,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '400',
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 19,
      marginTop: 10,
    },
    keyboardAvoider: {
      flex: 1,
    },
    phoneBlock: {
      marginTop: 2,
    },
    phoneRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 14,
    },
    phoneText: {
      color: colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '400',
      marginLeft: 20,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    saving: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 20,
    },
    savingText: {
      color: colors.textMuted,
      fontSize: 15,
      marginLeft: 10,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
  });
