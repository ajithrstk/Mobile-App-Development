import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ReplyPreview as ReplyPreviewType } from '../types/message';
import type { ThemeColors } from '../utils/colors';

type ReplyPreviewProps = {
  preview: ReplyPreviewType;
  colors: ThemeColors;
  compact?: boolean;
  onPress?: (messageId: string) => void;
  onClose?: () => void;
};

export default function ReplyPreview({ preview, colors, compact = false, onPress, onClose }: ReplyPreviewProps) {
  const styles = createStyles(colors, compact);
  const content = (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {preview.sender === 'me' ? 'You' : 'Contact'}
        </Text>
        <Text numberOfLines={compact ? 1 : 2} style={styles.text}>
          {preview.text}
        </Text>
      </View>
      {onClose && (
        <TouchableOpacity accessibilityLabel="Cancel reply" onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity activeOpacity={0.72} onPress={() => onPress(preview.id)}>
      {content}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors, compact: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      borderRadius: 6,
      flexDirection: 'row',
      marginBottom: compact ? 5 : 0,
      minHeight: compact ? 42 : 54,
      overflow: 'hidden',
    },
    accent: {
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      width: 4,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      minWidth: 0,
      paddingHorizontal: 8,
    },
    title: {
      color: colors.accent,
      fontSize: compact ? 12 : 13,
      fontWeight: '500',
    },
    text: {
      color: colors.textMuted,
      fontSize: compact ? 12 : 13,
      marginTop: 2,
    },
    closeButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
  });
