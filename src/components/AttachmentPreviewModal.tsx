import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { PendingAttachment } from '../services/mediaService';
import { getAttachmentLabel } from '../services/mediaService';
import type { ThemeColors } from '../utils/colors';
import { formatBytes } from '../utils/file';

type AttachmentPreviewModalProps = {
  visible: boolean;
  attachments: PendingAttachment[];
  caption: string;
  colors: ThemeColors;
  onChangeCaption: (caption: string) => void;
  onClose: () => void;
  onRemove: (attachmentId: string) => void;
  onSend: () => void;
};

export default function AttachmentPreviewModal({
  visible,
  attachments,
  caption,
  colors,
  onChangeCaption,
  onClose,
  onRemove,
  onSend,
}: AttachmentPreviewModalProps) {
  const styles = createStyles(colors);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity accessibilityLabel="Close preview" onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Preview</Text>
            <TouchableOpacity
              accessibilityLabel="Send attachments"
              disabled={attachments.length === 0}
              onPress={onSend}
              style={[styles.sendButton, attachments.length === 0 && styles.disabledButton]}
            >
              <Ionicons name="send" size={20} color={colors.badgeText} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal contentContainerStyle={styles.previewRow} showsHorizontalScrollIndicator={false}>
            {attachments.map((attachment) => (
              <View key={attachment.id} style={styles.previewItem}>
                {attachment.kind === 'image' && <Image source={{ uri: attachment.uri }} resizeMode="cover" style={styles.mediaPreview} />}
                {attachment.kind === 'video' && (
                  <View style={styles.mediaPreview}>
                    <View style={styles.playShell}>
                      <Ionicons name="play" size={28} color={colors.badgeText} />
                    </View>
                    <Text numberOfLines={2} style={styles.previewLabel}>{attachment.fileName}</Text>
                  </View>
                )}
                {(attachment.kind === 'file' || attachment.kind === 'audio') && (
                  <View style={styles.filePreview}>
                    <MaterialCommunityIcons
                      name={attachment.kind === 'audio' ? 'file-music-outline' : 'file-document-outline'}
                      size={34}
                      color={colors.primary}
                    />
                    <Text numberOfLines={2} style={styles.fileName}>{attachment.file.name}</Text>
                    <Text style={styles.fileSize}>{formatBytes(attachment.file.size)}</Text>
                  </View>
                )}
                {attachment.kind === 'location' && (
                  <View style={styles.locationPreview}>
                    <Ionicons name="location" size={34} color={colors.danger} />
                    <Text numberOfLines={1} style={styles.fileName}>{attachment.location.title}</Text>
                    <Text numberOfLines={2} style={styles.fileSize}>{attachment.location.address}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => onRemove(attachment.id)} style={styles.removeButton}>
                  <Ionicons name="close" size={18} color={colors.badgeText} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TextInput
            multiline
            onChangeText={onChangeCaption}
            placeholder={`Add a caption to ${attachments.length === 1 ? getAttachmentLabel(attachments[0]) : 'attachments'}`}
            placeholderTextColor={colors.textMuted}
            style={styles.captionInput}
            value={caption}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      maxHeight: '86%',
      paddingBottom: 18,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 58,
      paddingHorizontal: 12,
    },
    iconButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    title: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '500',
      textAlign: 'center',
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 21,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    disabledButton: {
      opacity: 0.4,
    },
    previewRow: {
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    previewItem: {
      marginRight: 10,
      position: 'relative',
    },
    mediaPreview: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      height: 190,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 150,
    },
    playShell: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    previewLabel: {
      bottom: 12,
      color: colors.text,
      fontSize: 13,
      fontWeight: '500',
      left: 12,
      position: 'absolute',
      right: 12,
      textAlign: 'center',
    },
    filePreview: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      height: 190,
      justifyContent: 'center',
      padding: 12,
      width: 150,
    },
    locationPreview: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#1E2C29' : '#E0EEE9',
      borderRadius: 8,
      height: 190,
      justifyContent: 'center',
      padding: 12,
      width: 150,
    },
    fileName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 10,
      textAlign: 'center',
    },
    fileSize: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
    },
    removeButton: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.64)',
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      position: 'absolute',
      right: 6,
      top: 6,
      width: 28,
    },
    captionInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      color: colors.text,
      fontSize: 15,
      marginHorizontal: 14,
      marginTop: 8,
      maxHeight: 96,
      minHeight: 48,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
  });
