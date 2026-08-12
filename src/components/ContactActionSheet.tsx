import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ContactAction, ContactProfile } from '../types/contact';
import type { ThemeColors } from '../utils/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ContactActionSheetProps = {
  colors: ThemeColors;
  contact: ContactProfile | null;
  visible: boolean;
  onAction: (action: ContactAction, contact: ContactProfile) => void;
  onClose: () => void;
};

type SheetAction = {
  key: ContactAction;
  label: string;
  icon: IoniconName;
  danger?: boolean;
};

const actions: SheetAction[] = [
  { key: 'profile', label: 'View Profile', icon: 'person-circle-outline' },
  { key: 'invite', label: 'Invite Contact', icon: 'share-social-outline' },
  { key: 'block', label: 'Block Contact', icon: 'ban-outline', danger: true },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function ContactActionSheet({
  colors,
  contact,
  onAction,
  onClose,
  visible,
}: ContactActionSheetProps) {
  if (!contact) {
    return null;
  }

  const styles = createStyles(colors);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.profileRow}>
            {contact.avatar ? (
              <Image source={contact.avatar} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
              </View>
            )}
            <View style={styles.profileText}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.title}>
                  {contact.name}
                </Text>
                {contact.verified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.verified} style={styles.verifiedIcon} />
                )}
              </View>
              <Text numberOfLines={1} style={styles.subtitle}>
                {contact.online ? 'online' : contact.phone}
              </Text>
            </View>
          </View>
          {actions.map((action) => (
            <TouchableOpacity
              activeOpacity={0.75}
              key={action.key}
              onPress={() => onAction(action.key, contact)}
              style={styles.action}
            >
              <Ionicons name={action.icon} size={23} color={action.danger ? colors.danger : colors.text} />
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
      borderRadius: 25,
      height: 50,
      width: 50,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.primaryDark,
      borderRadius: 25,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    avatarText: {
      color: colors.icon,
      fontSize: 17,
      fontWeight: '500',
    },
    profileText: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    title: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '500',
    },
    verifiedIcon: {
      marginLeft: 5,
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
