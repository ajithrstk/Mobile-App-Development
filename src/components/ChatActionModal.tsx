import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Chat, ChatAction } from '../types';
import type { ThemeColors } from '../utils/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const actionIcons: Record<ChatAction, IoniconName | MaterialCommunityIconName> = {
  pin: 'pin-outline',
  mute: 'volume-mute-outline',
  archive: 'archive-outline',
  delete: 'trash-outline',
};

type ModalAction = {
  key: ChatAction;
  label: string;
  danger?: boolean;
};

type ChatActionModalProps = {
  visible: boolean;
  chat: Chat | null;
  onClose: () => void;
  onAction: (action: ChatAction) => void;
  colors: ThemeColors;
};

export default function ChatActionModal({ visible, chat, onClose, onAction, colors }: ChatActionModalProps) {
  if (!chat) {
    return null;
  }

  const styles = createStyles(colors);

  const actions: ModalAction[] = [
    { key: 'pin', label: chat.pinned ? 'Unpin chat' : 'Pin chat' },
    { key: 'mute', label: chat.muted ? 'Unmute chat' : 'Mute chat' },
    { key: 'archive', label: chat.archived ? 'Unarchive chat' : 'Archive chat' },
    { key: 'delete', label: 'Delete chat', danger: true },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.profileRow}>
            <Image source={chat.avatar} style={styles.avatar} />
            <View style={styles.profileText}>
              <Text numberOfLines={1} style={styles.title}>{chat.name}</Text>
              <Text style={styles.subtitle}>{chat.online ? 'online' : 'last seen recently'}</Text>
            </View>
          </View>
          {actions.map((action) => (
            <TouchableOpacity
              activeOpacity={0.75}
              key={action.key}
              onPress={() => onAction(action.key)}
              style={styles.action}
            >
              {action.key === 'pin' ? (
                <MaterialCommunityIcons
                  name={actionIcons[action.key] as MaterialCommunityIconName}
                  size={23}
                  color={action.danger ? colors.danger : colors.text}
                />
              ) : (
                <Ionicons
                  name={actionIcons[action.key] as IoniconName}
                  size={23}
                  color={action.danger ? colors.danger : colors.text}
                />
              )}
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
    paddingBottom: 26,
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
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  profileText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
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
