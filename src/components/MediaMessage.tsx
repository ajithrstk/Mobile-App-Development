import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ChatMessage } from '../types/message';
import type { ThemeColors } from '../utils/colors';

type MediaMessageProps = {
  message: ChatMessage;
  colors: ThemeColors;
  width: number;
  onOpen: (message: ChatMessage) => void;
  onRetry: (messageId: string) => void;
  onDownload: (messageId: string) => void;
};

function formatDuration(durationMs?: number | null): string {
  if (!durationMs) {
    return 'Video';
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export default function MediaMessage({ message, colors, width, onOpen, onRetry, onDownload }: MediaMessageProps) {
  const styles = createStyles(colors, width);
  const source = message.mediaUri ? { uri: message.mediaUri } : message.image;
  const transferStatus = message.transferStatus ?? 'complete';
  const transferProgress = Math.round((message.transferProgress ?? 0) * 100);
  const needsDownload = message.sender === 'them' && transferStatus === 'idle';
  const isBusy = transferStatus === 'uploading' || transferStatus === 'downloading';
  const isFailed = transferStatus === 'failed' || message.status === 'failed';

  return (
    <TouchableOpacity activeOpacity={0.82} disabled={!source && message.kind !== 'video'} onPress={() => onOpen(message)}>
      {message.kind === 'image' && source ? (
        <Image source={source as ImageSourcePropType} resizeMode="cover" style={styles.image} />
      ) : (
        <View style={styles.videoPreview}>
          <View style={styles.videoIconShell}>
            <Ionicons name="play" size={25} color={colors.badgeText} />
          </View>
          <View style={styles.videoTextContent}>
            <Text numberOfLines={1} style={styles.videoTitle}>
              {message.fileName ?? 'Video'}
            </Text>
            <Text numberOfLines={1} style={styles.videoSubtitle}>
              {formatDuration(message.durationMs)}
            </Text>
          </View>
        </View>
      )}
      {(isBusy || isFailed || needsDownload) && (
        <View style={styles.transferOverlay}>
          {isBusy && (
            <>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${transferProgress}%` }]} />
              </View>
              <Text style={styles.transferText}>
                {transferStatus === 'uploading' ? 'Uploading' : 'Downloading'} {transferProgress}%
              </Text>
            </>
          )}
          {needsDownload && (
            <TouchableOpacity onPress={() => onDownload(message.id)} style={styles.transferButton}>
              <Ionicons name="download-outline" size={20} color={colors.badgeText} />
              <Text style={styles.transferButtonText}>Download</Text>
            </TouchableOpacity>
          )}
          {isFailed && (
            <TouchableOpacity onPress={() => onRetry(message.id)} style={styles.transferButton}>
              <Ionicons name="refresh-outline" size={20} color={colors.badgeText} />
              <Text style={styles.transferButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors, screenWidth: number) =>
  StyleSheet.create({
    image: {
      borderRadius: 7,
      height: Math.min(screenWidth * 0.48, 250),
      marginBottom: 5,
      width: Math.min(screenWidth * 0.62, 330),
    },
    videoPreview: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#17251F' : '#D5E4DD',
      borderRadius: 7,
      flexDirection: 'row',
      height: Math.min(screenWidth * 0.35, 172),
      marginBottom: 5,
      paddingHorizontal: 14,
      width: Math.min(screenWidth * 0.62, 330),
    },
    videoIconShell: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      marginRight: 12,
      width: 48,
    },
    videoTextContent: {
      flex: 1,
      minWidth: 0,
    },
    videoTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 3,
    },
    videoSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    transferOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: 7,
      bottom: 5,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    progressTrack: {
      backgroundColor: 'rgba(255,255,255,0.32)',
      borderRadius: 3,
      height: 6,
      overflow: 'hidden',
      width: 116,
    },
    progressFill: {
      backgroundColor: colors.accent,
      height: 6,
    },
    transferText: {
      color: colors.badgeText,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 8,
    },
    transferButton: {
      alignItems: 'center',
      flexDirection: 'row',
      padding: 12,
    },
    transferButtonText: {
      color: colors.badgeText,
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 6,
    },
  });
