import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Chat } from '../types';
import type { ThemeColors } from '../utils/colors';

type ChatHeaderProps = {
  chat?: Chat;
  colors: ThemeColors;
  selectionCount: number;
  onBack: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onForwardSelected: () => void;
  onOpenInfo: () => void;
  onOpenSearch: () => void;
  onOpenStarred: () => void;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onStarSelected: () => void;
};

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function ChatHeader({
  chat,
  colors,
  selectionCount,
  onBack,
  onClearSelection,
  onDeleteSelected,
  onForwardSelected,
  onOpenInfo,
  onOpenSearch,
  onOpenStarred,
  onStartVideoCall,
  onStartVoiceCall,
  onStarSelected,
}: ChatHeaderProps) {
  const styles = createStyles(colors);

  if (selectionCount > 0) {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={onClearSelection} style={styles.iconButton}>
          <Ionicons name="close" size={26} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.selectionCount}>{selectionCount}</Text>
        <TouchableOpacity onPress={onStarSelected} style={styles.iconButton}>
          <Ionicons name="star-outline" size={23} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onForwardSelected} style={styles.iconButton}>
          <Ionicons name="arrow-redo-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDeleteSelected} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={23} color={colors.icon} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={25} color={colors.icon} />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.72} onPress={onOpenInfo} style={styles.identityButton}>
        <View style={styles.avatarShell}>
          {chat?.avatar ? (
            <Image source={chat.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={21} color={colors.badgeText} />
            </View>
          )}
          {chat?.online && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>{chat?.name ?? 'Chat'}</Text>
            {chat?.verified && (
              <Ionicons name="checkmark-circle" size={15} color={colors.verified} style={styles.verifiedIcon} />
            )}
          </View>
          <Text numberOfLines={1} style={styles.status}>
            {chat?.online ? 'online' : 'last seen today at 9:41 AM'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onStartVoiceCall} style={styles.iconButton}>
        <Ionicons name="call-outline" size={22} color={colors.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onStartVideoCall} style={styles.iconButton}>
        <Ionicons name="videocam-outline" size={23} color={colors.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpenSearch} style={styles.iconButton}>
        <Ionicons name="search-outline" size={22} color={colors.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpenStarred} style={styles.iconButton}>
        <Ionicons name="star-outline" size={22} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 64 + androidTopInset,
      paddingHorizontal: 6,
      paddingTop: androidTopInset,
    },
    backButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 38,
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 40,
    },
    identityButton: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
    },
    avatarShell: {
      marginRight: 10,
    },
    avatar: {
      borderRadius: 19,
      height: 38,
      width: 38,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      justifyContent: 'center',
    },
    onlineIndicator: {
      backgroundColor: colors.accent,
      borderColor: colors.background,
      borderRadius: 6,
      borderWidth: 2,
      bottom: 0,
      height: 12,
      position: 'absolute',
      right: 0,
      width: 12,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    name: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '400',
    },
    verifiedIcon: {
      marginLeft: 5,
    },
    status: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    selectionCount: {
      color: colors.text,
      flex: 1,
      fontSize: 19,
      fontWeight: '400',
      marginLeft: 8,
    },
  });
