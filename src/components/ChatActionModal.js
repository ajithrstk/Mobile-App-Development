import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../utils/colors';

const actionIcons = {
  pin: 'pin-outline',
  mute: 'volume-mute-outline',
  archive: 'archive-outline',
  delete: 'trash-outline',
};

export default function ChatActionModal({ visible, chat, onClose, onAction }) {
  if (!chat) {
    return null;
  }

  const actions = [
    { key: 'pin', label: chat.pinned ? 'Unpin chat' : 'Pin chat' },
    { key: 'mute', label: chat.muted ? 'Unmute chat' : 'Mute chat' },
    { key: 'archive', label: 'Archive chat' },
    { key: 'delete', label: 'Delete chat', danger: true },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text numberOfLines={1} style={styles.title}>{chat.name}</Text>
          {actions.map((action) => (
            <TouchableOpacity
              activeOpacity={0.75}
              key={action.key}
              onPress={() => onAction(action.key)}
              style={styles.action}
            >
              {action.key === 'pin' ? (
                <MaterialCommunityIcons
                  name={actionIcons[action.key]}
                  size={23}
                  color={action.danger ? colors.danger : colors.text}
                />
              ) : (
                <Ionicons
                  name={actionIcons[action.key]}
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

const styles = StyleSheet.create({
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
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
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
