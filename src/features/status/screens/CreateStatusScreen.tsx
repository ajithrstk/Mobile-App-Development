import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import contacts from '../../../data/contacts';
import { ConnectionState, networkManager } from '../../../services/network/networkManager';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';
import StatusComposer from '../components/StatusComposer';
import { statusActions, useStatus } from '../state/statusSlice';
import type { StatusMedia, StatusMediaKind, StatusPrivacy, StatusTextStyle } from '../types/status.types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateStatusScreen'>;

const defaultTextStyle: StatusTextStyle = {
  alignment: 'center',
  backgroundColor: '#128C7E',
  color: '#FFFFFF',
  fontFamily: 'system',
  fontSize: 28,
};

export default function CreateStatusScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const savedPrivacy = useStatus((state) => state.privacy);
  const [mode, setMode] = useState<StatusMediaKind>(route.params.initialMode === 'text' ? 'text' : 'image');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [textStyle, setTextStyle] = useState(defaultTextStyle);
  const [media, setMedia] = useState<StatusMedia | null>(null);
  const [privacy, setPrivacy] = useState<StatusPrivacy>(savedPrivacy);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'failed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (route.params.initialMode === 'camera') {
      void pickMedia('camera');
    }

    if (route.params.initialMode === 'gallery') {
      void pickMedia('gallery');
    }

    return () => {
      if (uploadTimer.current) {
        clearInterval(uploadTimer.current);
      }
    };
  }, [route.params.initialMode]);

  async function pickMedia(source: 'camera' | 'gallery'): Promise<void> {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow media access to create a status.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, mediaTypes: ['images', 'videos'], quality: 0.85, videoMaxDuration: 30 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, mediaTypes: ['images', 'videos'], quality: 0.85, videoMaxDuration: 30 });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/') === true;
    setMode(isVideo ? 'video' : 'image');
    setMedia({
      compressed: false,
      durationMs: asset.duration ?? null,
      fileName: asset.fileName ?? (isVideo ? 'Video status' : 'Photo status'),
      height: asset.height,
      thumbnailUri: asset.uri,
      trimEndMs: isVideo ? Math.min(asset.duration ?? 15000, 30000) : undefined,
      trimStartMs: 0,
      uri: asset.uri,
      width: asset.width,
    });
  }

  function cancelUpload(): void {
    if (uploadTimer.current) {
      clearInterval(uploadTimer.current);
      uploadTimer.current = null;
    }

    setUploadStatus('idle');
    setUploadProgress(0);
  }

  function toggleContact(contactId: string): void {
    setPrivacy((current) => ({
      ...current,
      contactIds: current.contactIds.includes(contactId)
        ? current.contactIds.filter((id) => id !== contactId)
        : [...current.contactIds, contactId],
    }));
  }

  function submit(): void {
    if (mode === 'text' && !text.trim()) {
      Alert.alert('Status text required', 'Type something to share.');
      return;
    }

    if (mode !== 'text' && !media) {
      Alert.alert('Photo or video required', 'Choose media from the gallery or camera.');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0.05);
    uploadTimer.current = setInterval(() => {
      setUploadProgress((progress) => {
        const nextProgress = Math.min(1, progress + 0.15);

        if (networkManager.getState() === ConnectionState.Offline && nextProgress > 0.3) {
          if (uploadTimer.current) {
            clearInterval(uploadTimer.current);
            uploadTimer.current = null;
          }
          setUploadStatus('failed');
          return progress;
        }

        if (nextProgress >= 1) {
          if (uploadTimer.current) {
            clearInterval(uploadTimer.current);
            uploadTimer.current = null;
          }

          void statusActions
            .updatePrivacy(privacy)
            .then(() => statusActions.createStatus({
              caption,
              kind: mode,
              media: media ? { ...media, compressed: true } : undefined,
              privacy,
              text,
              textStyle: mode === 'text' ? textStyle : undefined,
            }))
            .then(() => navigation.goBack())
            .catch(() => setUploadStatus('failed'));
        }

        return nextProgress;
      });
    }, 240);
  }

  const privacyPanel = privacyOpen ? (
    <View style={mode === 'text' ? styles.privacyPanel : styles.mediaPrivacyPanel}>
      {(['contacts', 'contacts-except', 'only-share-with'] as StatusPrivacy['mode'][]).map((privacyMode) => (
        <Pressable key={privacyMode} onPress={() => setPrivacy((current) => ({ ...current, mode: privacyMode }))} style={styles.privacyModeRow}>
          <Ionicons name={privacy.mode === privacyMode ? 'radio-button-on' : 'radio-button-off'} size={19} color={mode === 'text' ? colors.primary : '#00A884'} />
          <Text style={mode === 'text' ? styles.privacyModeText : styles.mediaPrivacyModeText}>
            {privacyMode === 'contacts' ? 'My Contacts' : privacyMode === 'contacts-except' ? 'My Contacts Except...' : 'Only Share With...'}
          </Text>
        </Pressable>
      ))}
      {privacy.mode !== 'contacts' && (
        <ScrollView nestedScrollEnabled style={styles.contactList}>
          {contacts.slice(0, 48).map((contact) => (
            <Pressable key={contact.id} onPress={() => toggleContact(contact.id)} style={styles.contactRow}>
              <Text numberOfLines={1} style={mode === 'text' ? styles.contactName : styles.mediaContactName}>{contact.name}</Text>
              <Ionicons name={privacy.contactIds.includes(contact.id) ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={mode === 'text' ? colors.primary : '#00A884'} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  ) : null;

  if (mode === 'text') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={styles.textHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
            <Pressable onPress={() => void pickMedia('gallery')} style={styles.gallerySwitch}>
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={styles.gallerySwitchText}>Gallery</Text>
            </Pressable>
          </View>
          <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
            <View style={styles.textComposerShell}>
              <StatusComposer
                colors={colors}
                onOpenPrivacy={() => setPrivacyOpen((open) => !open)}
                onTextChange={setText}
                onTextStyleChange={setTextStyle}
                privacy={privacy}
                selectedCount={privacy.contactIds.length}
                text={text}
                textStyle={textStyle}
              />
            </View>
          </TouchableWithoutFeedback>
          {privacyPanel}
          <TouchableOpacity activeOpacity={0.82} onPress={submit} style={styles.sendFab}>
            <Ionicons name="send" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mediaSafeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.mediaShell}>
        <View style={styles.mediaToolbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.mediaToolButton}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.mediaToolsRight}>
            <TouchableOpacity onPress={() => void pickMedia('gallery')} style={styles.mediaToolButton}>
              <Ionicons name="crop-outline" size={27} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Emoji', 'Emoji stickers are ready for the real editor adapter.')} style={styles.mediaToolButton}>
              <Ionicons name="happy-outline" size={27} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('text')} style={styles.mediaToolButton}>
              <Text style={styles.textTool}>T</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Draw', 'Drawing tools are ready for the real editor adapter.')} style={styles.mediaToolButton}>
              <Ionicons name="pencil-outline" size={27} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mediaStage}>
          {media ? (
            mode === 'image' ? (
              <Image resizeMode="contain" source={{ uri: media.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.videoPreview}>
                <Ionicons name="play-circle" size={72} color="#FFFFFF" />
                <Text style={styles.videoPreviewText}>{media.fileName ?? 'Video status'}</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyMedia}>
              <Ionicons name="images-outline" size={58} color="rgba(255,255,255,0.76)" />
              <Text style={styles.emptyMediaTitle}>Add to status</Text>
              <View style={styles.emptyActions}>
                <Pressable onPress={() => void pickMedia('gallery')} style={styles.emptyAction}>
                  <Text style={styles.emptyActionText}>Gallery</Text>
                </Pressable>
                <Pressable onPress={() => void pickMedia('camera')} style={styles.emptyAction}>
                  <Text style={styles.emptyActionText}>Camera</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.filterHint}>
          <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
          <Text style={styles.filterText}>Swipe up for filters</Text>
        </View>

        {uploadStatus !== 'idle' && (
          <View style={styles.uploadBox}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
            </View>
            <Text style={styles.uploadText}>{uploadStatus === 'failed' ? 'Upload failed' : `${Math.round(uploadProgress * 100)}%`}</Text>
            <Pressable onPress={uploadStatus === 'failed' ? submit : cancelUpload}>
              <Text style={styles.uploadAction}>{uploadStatus === 'failed' ? 'Retry' : 'Cancel'}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.captionBar}>
          <View style={styles.captionPill}>
            <Ionicons name="image-outline" size={22} color="#6B7780" />
            <TextInput
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor="#6B7780"
              style={styles.captionInput}
              value={caption}
            />
          </View>
          <TouchableOpacity activeOpacity={0.84} onPress={submit} style={styles.mediaSendButton}>
            <Ionicons name="send" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {privacyPanel}
        <Pressable onPress={() => setPrivacyOpen((open) => !open)} style={styles.targetRow}>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          <Text style={styles.targetText}>Status (Contacts)</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    captionBar: {
      alignItems: 'center',
      bottom: 44,
      flexDirection: 'row',
      left: 14,
      position: 'absolute',
      right: 10,
    },
    captionInput: {
      color: '#111B21',
      flex: 1,
      fontSize: 16,
      minHeight: 48,
      paddingHorizontal: 10,
    },
    captionPill: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      flex: 1,
      flexDirection: 'row',
      minHeight: 48,
      paddingLeft: 12,
    },
    contactList: {
      maxHeight: 210,
    },
    contactName: {
      color: colors.text,
      flex: 1,
      fontSize: 14,
    },
    contactRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 40,
    },
    emptyAction: {
      alignItems: 'center',
      borderColor: 'rgba(255,255,255,0.5)',
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'center',
      marginHorizontal: 6,
      minHeight: 38,
      paddingHorizontal: 18,
    },
    emptyActionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    emptyActions: {
      flexDirection: 'row',
      marginTop: 20,
    },
    emptyMedia: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    emptyMediaTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      marginTop: 12,
    },
    filterHint: {
      alignItems: 'center',
      bottom: 106,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    filterText: {
      color: '#FFFFFF',
      fontSize: 14,
      marginTop: -2,
    },
    gallerySwitch: {
      alignItems: 'center',
      flexDirection: 'row',
      marginLeft: 'auto',
      paddingHorizontal: 12,
    },
    gallerySwitchText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 6,
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    keyboard: {
      flex: 1,
    },
    mediaSafeArea: {
      backgroundColor: '#000000',
      flex: 1,
    },
    mediaContactName: {
      color: '#FFFFFF',
      flex: 1,
      fontSize: 14,
    },
    mediaPrivacyModeText: {
      color: '#FFFFFF',
      fontSize: 14,
      marginLeft: 10,
    },
    mediaPrivacyPanel: {
      backgroundColor: 'rgba(0,0,0,0.94)',
      borderTopColor: 'rgba(255,255,255,0.2)',
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: 16,
      paddingVertical: 10,
      position: 'absolute',
      right: 0,
      zIndex: 5,
    },
    mediaSendButton: {
      alignItems: 'center',
      backgroundColor: '#00A884',
      borderColor: '#0B5F52',
      borderRadius: 28,
      borderWidth: 2,
      height: 56,
      justifyContent: 'center',
      marginLeft: 8,
      width: 56,
    },
    mediaShell: {
      backgroundColor: '#000000',
      flex: 1,
    },
    mediaStage: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 104,
    },
    mediaToolButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 48,
    },
    mediaToolbar: {
      alignItems: 'center',
      backgroundColor: '#000000',
      flexDirection: 'row',
      height: 64,
      paddingHorizontal: 8,
      zIndex: 3,
    },
    mediaToolsRight: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    previewImage: {
      height: '100%',
      width: '100%',
    },
    progressFill: {
      backgroundColor: '#00A884',
      height: 4,
    },
    progressTrack: {
      backgroundColor: 'rgba(255,255,255,0.28)',
      borderRadius: 3,
      flex: 1,
      height: 4,
      overflow: 'hidden',
    },
    privacyModeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 40,
    },
    privacyModeText: {
      color: colors.text,
      fontSize: 14,
      marginLeft: 10,
    },
    privacyPanel: {
      backgroundColor: colors.background,
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sendFab: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 28,
      bottom: 20,
      height: 56,
      justifyContent: 'center',
      position: 'absolute',
      right: 20,
      width: 56,
    },
    targetRow: {
      alignItems: 'center',
      bottom: 14,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      position: 'absolute',
      right: 18,
    },
    targetText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 4,
    },
    textHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 56,
      paddingHorizontal: 8,
    },
    textComposerShell: {
      flex: 1,
    },
    textTool: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: '800',
    },
    uploadAction: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    uploadBox: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.72)',
      bottom: 154,
      flexDirection: 'row',
      gap: 10,
      left: 18,
      minHeight: 32,
      paddingHorizontal: 10,
      position: 'absolute',
      right: 18,
    },
    uploadText: {
      color: '#FFFFFF',
      fontSize: 12,
      minWidth: 48,
    },
    videoPreview: {
      alignItems: 'center',
      backgroundColor: '#111111',
      flex: 1,
      justifyContent: 'center',
    },
    videoPreviewText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      marginTop: 10,
    },
  });
