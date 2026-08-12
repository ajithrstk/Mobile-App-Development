import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AttachmentOption, ReplyPreview } from '../types/message';
import type { ThemeColors } from '../utils/colors';

type MessageInputProps = {
  value: string;
  replyTo: ReplyPreview | null;
  colors: ThemeColors;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancelReply: () => void;
  onVoicePress: () => void;
  onAttachmentOptionPress: (option: AttachmentOption) => void;
  onVoiceRecorded: (uri: string | null, durationMs: number) => void;
};

const ATTACHMENT_OPTIONS: Array<{
  key: AttachmentOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { key: 'document', label: 'Document', icon: 'document-text-outline', color: '#6F4BD8' },
  { key: 'camera', label: 'Camera', icon: 'camera-outline', color: '#E04F7A' },
  { key: 'gallery', label: 'Photos & Videos', icon: 'images-outline', color: '#B14AD8' },
  { key: 'audio', label: 'Audio', icon: 'headset-outline', color: '#F1A72B' },
  { key: 'location', label: 'Location', icon: 'location-outline', color: '#22A06B' },
  { key: 'contact', label: 'Contact', icon: 'person-outline', color: '#2A8FDC' },
  { key: 'poll', label: 'Poll', icon: 'stats-chart-outline', color: '#20A4A8' },
];

const ATTACHMENT_ROWS = [
  ATTACHMENT_OPTIONS.slice(0, 4),
  ATTACHMENT_OPTIONS.slice(4),
];

const MIN_VOICE_RECORDING_MS = 650;

export default function MessageInput({
  value,
  replyTo,
  colors,
  onChangeText,
  onSend,
  onCancelReply,
  onVoicePress,
  onAttachmentOptionPress,
  onVoiceRecorded,
}: MessageInputProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const recordingActiveRef = useRef(false);
  const recordingLockedRef = useRef(false);
  const voicePressActiveRef = useRef(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingLocked, setRecordingLocked] = useState(false);
  const [recordingCancelHint, setRecordingCancelHint] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    recordingActiveRef.current = recording;
  }, [recording]);

  useEffect(() => {
    recordingLockedRef.current = recordingLocked;
  }, [recordingLocked]);

  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (recordingStartRef.current) {
        setRecordingDurationMs(Date.now() - recordingStartRef.current);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [recording]);

  const handleSend = () => {
    setAttachmentMenuVisible(false);
    onSend();
  };

  const startRecording = async () => {
    if (recordingActiveRef.current || hasText) {
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Microphone permission needed', 'Please allow microphone access to record voice messages.');
        onVoicePress();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recordingInstance.startAsync();

      recordingRef.current = recordingInstance;
      recordingStartRef.current = Date.now();
      recordingActiveRef.current = true;
      recordingLockedRef.current = false;
      setRecordingDurationMs(0);
      setRecordingLocked(false);
      setRecordingCancelHint(false);
      setRecording(true);
      setAttachmentMenuVisible(false);

      if (!voicePressActiveRef.current && !recordingLockedRef.current) {
        void finishRecording(false);
      }
    } catch {
      Alert.alert('Recording unavailable', 'Voice recording could not be started on this device.');
    }
  };

  const finishRecording = async (send: boolean) => {
    const activeRecording = recordingRef.current;
    const elapsedMs = recordingStartRef.current ? Date.now() - recordingStartRef.current : recordingDurationMs;
    const durationMs = Math.max(elapsedMs, 1000);
    const shouldSend = send && elapsedMs >= MIN_VOICE_RECORDING_MS;

    recordingRef.current = null;
    recordingStartRef.current = null;
    recordingActiveRef.current = false;
    recordingLockedRef.current = false;
    voicePressActiveRef.current = false;
    setRecording(false);
    setRecordingLocked(false);
    setRecordingCancelHint(false);
    setRecordingDurationMs(0);

    if (!activeRecording) {
      return;
    }

    try {
      await activeRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = activeRecording.getURI();

      if (shouldSend) {
        onVoiceRecorded(uri, durationMs);
      }
    } catch {
      if (shouldSend) {
        onVoiceRecorded(null, durationMs);
      }
    }
  };

  useEffect(
    () => () => {
      if (recordingActiveRef.current) {
        void finishRecording(false);
      }
    },
    [],
  );

  const formatRecordingDuration = () => {
    const totalSeconds = Math.max(0, Math.floor(recordingDurationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
  };

  const voicePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !hasText,
        onMoveShouldSetPanResponder: () => recording,
        onPanResponderGrant: () => {
          voicePressActiveRef.current = true;
          void startRecording();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!recordingActiveRef.current) {
            return;
          }

          setRecordingCancelHint(gestureState.dx < -78);

          if (gestureState.dy < -64) {
            recordingLockedRef.current = true;
            setRecordingLocked(true);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          voicePressActiveRef.current = false;

          if (!recordingActiveRef.current) {
            return;
          }

          if (gestureState.dx < -78) {
            void finishRecording(false);
            return;
          }

          if (recordingLockedRef.current || gestureState.dy < -64) {
            recordingLockedRef.current = true;
            setRecordingLocked(true);
            setRecordingCancelHint(false);
            return;
          }

          void finishRecording(true);
        },
        onPanResponderTerminate: () => {
          voicePressActiveRef.current = false;

          if (recordingActiveRef.current && !recordingLockedRef.current) {
            void finishRecording(false);
          }
        },
      }),
    [hasText, recording],
  );

  const handleAttachmentOptionPress = (option: AttachmentOption) => {
    setAttachmentMenuVisible(false);
    onAttachmentOptionPress(option);
  };

  const toggleAttachmentMenu = () => {
    setAttachmentMenuVisible((currentValue) => !currentValue);
  };

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyAccent} />
          <View style={styles.replyText}>
            <Text numberOfLines={1} style={styles.replyTitle}>
              Replying to {replyTo.sender === 'me' ? 'yourself' : 'contact'}
            </Text>
            <Text numberOfLines={1} style={styles.replyBody}>{replyTo.text}</Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.replyCloseButton}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      {recording && (
        <View style={[styles.recordingBar, recordingCancelHint && styles.cancelRecordingBar]}>
          <TouchableOpacity
            accessibilityLabel="Cancel recording"
            disabled={!recordingLocked}
            onPress={() => void finishRecording(false)}
            style={styles.recordingIcon}
          >
            <Ionicons name={recordingCancelHint ? 'trash-outline' : 'mic'} size={20} color={colors.danger} />
          </TouchableOpacity>
          <View style={styles.recordingWave}>
            {Array.from({ length: 18 }).map((_, index) => (
              <View
                key={`recording-wave-${index}`}
                style={[
                  styles.recordingWaveBar,
                  { height: 7 + ((index * 7 + Math.floor(recordingDurationMs / 250)) % 20) },
                ]}
              />
            ))}
          </View>
          <Text style={styles.recordingTime}>{formatRecordingDuration()}</Text>
          <Text style={styles.recordingHint}>
            {recordingLocked ? 'Locked' : recordingCancelHint ? 'Release to cancel' : 'Slide left or up to lock'}
          </Text>
          {recordingLocked && (
            <TouchableOpacity onPress={() => void finishRecording(true)} style={styles.lockedSendButton}>
              <Ionicons name="send" size={18} color={colors.badgeText} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {attachmentMenuVisible && (
        <View style={styles.attachmentMenu}>
          {ATTACHMENT_ROWS.map((row, rowIndex) => (
            <View key={`attachment-row-${rowIndex}`} style={styles.attachmentRow}>
              {row.map((option) => (
                <TouchableOpacity
                  activeOpacity={0.72}
                  key={option.key}
                  onPress={() => handleAttachmentOptionPress(option.key)}
                  style={styles.attachmentOption}
                >
                  <View style={[styles.attachmentIconShell, { backgroundColor: option.color }]}>
                    <Ionicons name={option.icon} size={24} color={colors.badgeText} />
                  </View>
                  <Text numberOfLines={2} style={styles.attachmentLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              {row.length < 4 &&
                Array.from({ length: 4 - row.length }).map((_, index) => (
                  <View
                    key={`attachment-placeholder-${rowIndex}-${index}`}
                    pointerEvents="none"
                    style={styles.attachmentOption}
                  />
                ))}
            </View>
          ))}
        </View>
      )}
      <View style={styles.composerRow}>
        <View style={styles.inputShell}>
          <TextInput
            multiline
            onChangeText={onChangeText}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            returnKeyType="default"
            style={styles.input}
            value={value}
          />
          <TouchableOpacity onPress={toggleAttachmentMenu} style={styles.iconButton}>
            <Ionicons
              name="attach-outline"
              size={24}
              color={attachmentMenuVisible ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="camera-outline" size={23} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {hasText ? (
          <TouchableOpacity
            activeOpacity={0.76}
            onPress={handleSend}
            style={styles.primaryButton}
          >
            <Ionicons name="send" size={20} color={colors.badgeText} />
          </TouchableOpacity>
        ) : (
          <View {...voicePanResponder.panHandlers} style={styles.primaryButton}>
            <MaterialCommunityIcons name="microphone" size={24} color={colors.badgeText} />
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.chatWallpaper,
      paddingBottom: 8,
      paddingHorizontal: 10,
      paddingTop: 7,
    },
    replyPreview: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.background,
      borderRadius: 10,
      flexDirection: 'row',
      marginBottom: 6,
      marginLeft: 2,
      marginRight: 54,
      minHeight: 54,
      overflow: 'hidden',
    },
    recordingBar: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      flexDirection: 'row',
      marginBottom: 6,
      minHeight: 56,
      paddingHorizontal: 10,
    },
    cancelRecordingBar: {
      backgroundColor: colors.mode === 'dark' ? '#2B1818' : '#FBE8E8',
    },
    recordingIcon: {
      alignItems: 'center',
      height: 38,
      justifyContent: 'center',
      width: 32,
    },
    recordingWave: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 8,
    },
    recordingWaveBar: {
      backgroundColor: colors.danger,
      borderRadius: 2,
      width: 3,
    },
    recordingTime: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '500',
      marginRight: 8,
      minWidth: 36,
    },
    recordingHint: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '400',
      maxWidth: 104,
    },
    lockedSendButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 18,
      height: 36,
      justifyContent: 'center',
      marginLeft: 8,
      width: 36,
    },
    replyAccent: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      width: 4,
    },
    replyText: {
      flex: 1,
      paddingHorizontal: 10,
    },
    replyTitle: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 2,
    },
    replyBody: {
      color: colors.textMuted,
      fontSize: 13,
    },
    replyCloseButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    attachmentMenu: {
      backgroundColor: colors.background,
      borderRadius: 16,
      marginBottom: 6,
      paddingBottom: 10,
      paddingHorizontal: 0,
      paddingTop: 12,
    },
    attachmentRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      width: '100%',
    },
    attachmentOption: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-start',
      marginBottom: 10,
      minHeight: 82,
      paddingHorizontal: 4,
    },
    attachmentIconShell: {
      alignItems: 'center',
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      marginBottom: 6,
      width: 48,
    },
    attachmentLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 14,
      minHeight: 28,
      paddingHorizontal: 2,
      textAlign: 'center',
    },
    composerRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
    },
    inputShell: {
      alignItems: 'flex-end',
      backgroundColor: colors.background,
      borderRadius: 24,
      flex: 1,
      flexDirection: 'row',
      minHeight: 48,
      paddingHorizontal: 3,
      paddingVertical: 4,
    },
    iconButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 38,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '400',
      maxHeight: 112,
      minHeight: 38,
      paddingBottom: 8,
      paddingTop: 8,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      marginLeft: 6,
      width: 48,
    },
  });
