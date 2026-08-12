import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ChatMessage, FileCategory } from '../types/message';
import type { ThemeColors } from '../utils/colors';
import { formatBytes } from '../utils/file';

type FileMessageProps = {
  message: ChatMessage;
  colors: ThemeColors;
  onRetry: (messageId: string) => void;
  onDownload: (messageId: string) => void;
};

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const categoryIcons: Record<FileCategory, MaterialIconName> = {
  pdf: 'file-pdf-box',
  doc: 'file-word-box',
  sheet: 'file-excel-box',
  presentation: 'file-powerpoint-box',
  zip: 'folder-zip',
  txt: 'file-document-outline',
  audio: 'file-music-outline',
  generic: 'file-outline',
};

const categoryColors: Record<FileCategory, string> = {
  pdf: '#D64545',
  doc: '#2E74B5',
  sheet: '#16834A',
  presentation: '#D45B27',
  zip: '#8A6D2F',
  txt: '#607D8B',
  audio: '#8A4BD8',
  generic: '#66736F',
};

export default function FileMessage({ message, colors, onRetry, onDownload }: FileMessageProps) {
  const styles = createStyles(colors);
  const file = message.file;
  const transferStatus = message.transferStatus ?? 'complete';
  const transferProgress = Math.round((message.transferProgress ?? 0) * 100);
  const isFailed = transferStatus === 'failed' || message.status === 'failed';
  const isBusy = transferStatus === 'uploading' || transferStatus === 'downloading';
  const needsDownload = message.sender === 'them' && transferStatus === 'idle';
  const category = file?.category ?? (message.kind === 'audio' ? 'audio' : 'generic');

  return (
    <View style={styles.container}>
      <View style={[styles.iconShell, { backgroundColor: categoryColors[category] }]}>
        <MaterialCommunityIcons name={categoryIcons[category]} size={27} color={colors.badgeText} />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {file?.name ?? message.fileName ?? 'Attachment'}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {formatBytes(file?.size)}{isBusy ? ` • ${transferProgress}%` : ''}
        </Text>
        {isBusy && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${transferProgress}%` }]} />
          </View>
        )}
        {isFailed && <Text style={styles.failedText}>Upload failed</Text>}
      </View>
      {needsDownload && (
        <TouchableOpacity onPress={() => onDownload(message.id)} style={styles.actionButton}>
          <Ionicons name="download-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
      {isFailed && (
        <TouchableOpacity onPress={() => onRetry(message.id)} style={styles.actionButton}>
          <Ionicons name="refresh-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderRadius: 7,
      flexDirection: 'row',
      marginBottom: 5,
      minHeight: 68,
      paddingHorizontal: 8,
      width: 280,
    },
    iconShell: {
      alignItems: 'center',
      borderRadius: 8,
      height: 44,
      justifyContent: 'center',
      marginRight: 10,
      width: 44,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 3,
    },
    meta: {
      color: colors.textMuted,
      fontSize: 12,
    },
    progressTrack: {
      backgroundColor: colors.divider,
      borderRadius: 2,
      height: 4,
      marginTop: 7,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: colors.accent,
      height: 4,
    },
    failedText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    actionButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 38,
    },
  });
