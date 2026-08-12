import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo } from 'react';
import type { ContactProfile } from '../types/contact';
import type { ThemeColors } from '../utils/colors';

type ContactListItemProps = {
  contact: ContactProfile;
  colors: ThemeColors;
  compact?: boolean;
  onPress: (contact: ContactProfile) => void;
  onLongPress?: (contact: ContactProfile) => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function ContactListItem({
  contact,
  colors,
  compact = false,
  onLongPress,
  onPress,
}: ContactListItemProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      activeOpacity={0.74}
      onLongPress={onLongPress ? () => onLongPress(contact) : undefined}
      onPress={() => onPress(contact)}
      style={[styles.row, compact && styles.compactRow]}
    >
      <View style={styles.avatarShell}>
        {contact.avatar ? (
          <Image source={contact.avatar} style={[styles.avatar, compact && styles.compactAvatar]} />
        ) : (
          <View style={[styles.avatarFallback, compact && styles.compactAvatar]}>
            <Text style={[styles.avatarText, compact && styles.compactAvatarText]}>{getInitials(contact.name)}</Text>
          </View>
        )}
        {contact.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[styles.name, compact && styles.compactName]}>
            {contact.name}
          </Text>
          {contact.verified && (
            <Ionicons name="checkmark-circle" size={15} color={colors.verified} style={styles.inlineIcon} />
          )}
          {contact.favorite && (
            <Ionicons name="star" size={14} color={colors.accent} style={styles.inlineIcon} />
          )}
        </View>
        <Text numberOfLines={1} style={styles.status}>
          {contact.inviteOnly ? `Invite to Chatterly • ${contact.phone}` : contact.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      minHeight: 74,
      paddingLeft: 16,
    },
    compactRow: {
      minHeight: 62,
      paddingLeft: 0,
      width: 172,
    },
    avatarShell: {
      position: 'relative',
    },
    avatar: {
      borderRadius: 25,
      height: 50,
      width: 50,
    },
    compactAvatar: {
      borderRadius: 22,
      height: 44,
      width: 44,
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
    compactAvatarText: {
      fontSize: 15,
    },
    onlineIndicator: {
      backgroundColor: colors.accent,
      borderColor: colors.background,
      borderRadius: 7,
      borderWidth: 2,
      bottom: 1,
      height: 14,
      position: 'absolute',
      right: 0,
      width: 14,
    },
    content: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flex: 1,
      justifyContent: 'center',
      marginLeft: 14,
      minHeight: 74,
      paddingRight: 16,
    },
    compactContent: {
      borderBottomWidth: 0,
      marginLeft: 10,
      minHeight: 56,
      paddingRight: 8,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minWidth: 0,
    },
    name: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '500',
    },
    compactName: {
      fontSize: 14,
    },
    inlineIcon: {
      marginLeft: 5,
    },
    status: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
  });
