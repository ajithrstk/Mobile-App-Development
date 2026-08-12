import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ChatMessage, MessageMenuAction } from '../types/message';
import type { ThemeColors } from '../utils/colors';
import { getMessagePreview } from '../utils/chat';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type MessageMenuProps = {
  visible: boolean;
  message: ChatMessage | null;
  colors: ThemeColors;
  onClose: () => void;
  onAction: (action: MessageMenuAction) => void;
  onReact: (emoji: string) => void;
};

const actionIcons: Record<MessageMenuAction, IoniconName> = {
  reply: 'return-up-back-outline',
  forward: 'arrow-redo-outline',
  copy: 'copy-outline',
  report: 'flag-outline',
  pin: 'pin-outline',
  share: 'share-social-outline',
  star: 'star-outline',
  delete: 'trash-outline',
};

const quickReactions = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83D\uDE4F'];

export default function MessageMenu({ visible, message, colors, onClose, onAction, onReact }: MessageMenuProps) {
  const styles = createStyles(colors);

  if (!message) {
    return null;
  }

  const actions: Array<{ key: MessageMenuAction; label: string; danger?: boolean; disabled?: boolean }> = [
    { key: 'reply', label: 'Reply' },
    { key: 'forward', label: 'Forward' },
    { key: 'copy', label: 'Copy', disabled: message.kind !== 'text' },
    { key: 'star', label: message.starred ? 'Unstar' : 'Star' },
    { key: 'share', label: 'Share' },
    { key: 'pin', label: 'Pin in group' },
    { key: 'report', label: 'Report' },
    { key: 'delete', label: 'Delete', danger: true },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text numberOfLines={2} style={styles.preview}>{getMessagePreview(message)}</Text>
          <View style={styles.reactionRow}>
            {quickReactions.map((emoji) => (
              <TouchableOpacity
                activeOpacity={0.72}
                key={emoji}
                onPress={() => onReact(emoji)}
                style={styles.reactionButton}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {actions.map((action) => (
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={action.disabled}
              key={action.key}
              onPress={() => onAction(action.key)}
              style={[styles.action, action.disabled && styles.disabledAction]}
            >
              <Ionicons
                name={actionIcons[action.key]}
                size={22}
                color={action.danger ? colors.danger : colors.text}
              />
              <Text style={[styles.actionText, action.danger && styles.dangerText]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
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
      paddingBottom: 28,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    handle: {
      alignSelf: 'center',
      backgroundColor: colors.divider,
      borderRadius: 2,
      height: 4,
      marginBottom: 14,
      width: 44,
    },
    preview: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8,
    },
    reactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    reactionButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    reactionEmoji: {
      fontSize: 22,
      lineHeight: 28,
    },
    action: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 50,
    },
    disabledAction: {
      opacity: 0.35,
    },
    actionText: {
      color: colors.text,
      fontSize: 16,
      marginLeft: 14,
    },
    dangerText: {
      color: colors.danger,
    },
  });
