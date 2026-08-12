import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CallMode } from '../calls/types/call';
import contacts from '../data/contacts';
import { groupsActions, useGroups } from '../features/groups/groupsStore';
import type { GroupMember, GroupProfile } from '../features/groups/domain';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type ChatInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatInfoScreen'>;

const maxMembers = 1024;

function firstAvailableMember(group: GroupProfile): GroupMember | null {
  const existingIds = new Set(group.members.map((member) => member.id));
  const contact = contacts.find((item) => !existingIds.has(item.id));

  if (!contact) {
    return null;
  }

  return {
    avatar: contact.avatar,
    id: contact.id,
    joinedAt: new Date().toISOString(),
    name: contact.name,
    phone: contact.phone,
    role: 'member',
  };
}

function formatGroupCreatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ChatInfoScreen({ navigation, route }: ChatInfoScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chat = route.params.chat;
  const messages = route.params.messages;
  const group = useGroups((state) => state.data.groups.find((item) => item.chatId === chat.id && !item.deleted));
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [draftName, setDraftName] = useState(group?.name ?? chat.name);
  const [draftAbout, setDraftAbout] = useState(group?.description ?? 'Hey there! I am using Chatterly.');
  const mediaMessages = messages.filter((message) => message.kind === 'image' || message.kind === 'video');
  const sharedFiles = messages.filter((message) => message.file);
  const sharedTotal = mediaMessages.length + sharedFiles.length;
  const contact = contacts.find((item) => item.name.toLowerCase() === chat.name.toLowerCase());
  const contactPhone = contact?.phone ?? '+91 79040 06253';
  const contactAbout = "Hello. I'm using WhatsApp Business.";
  const visibleMediaCount = Math.max(sharedTotal, 69);

  useEffect(() => {
    setDraftName(group?.name ?? chat.name);
    setDraftAbout(group?.description ?? 'Hey there! I am using Chatterly.');
  }, [chat.name, group?.description, group?.name]);

  const showAction = (label: string) => {
    Alert.alert(label, `${label} action is ready.`);
  };

  const saveGroupName = () => {
    if (!group) {
      return;
    }

    groupsActions.updateGroup(group.id, { name: draftName });
    setEditingName(false);
  };

  const saveGroupAbout = () => {
    if (!group) {
      return;
    }

    groupsActions.updateGroup(group.id, { description: draftAbout });
    setEditingAbout(false);
  };

  const addMember = () => {
    if (!group) {
      return;
    }

    const nextMember = firstAvailableMember(group);

    if (!nextMember) {
      Alert.alert('No contacts available', 'Every demo contact is already in this group.');
      return;
    }

    groupsActions.addMember(group.id, nextMember);
  };

  const openMemberActions = (member: GroupMember, isCurrentUser: boolean) => {
    if (!group || isCurrentUser) {
      return;
    }

    const isAdmin = group.admins.includes(member.id);
    Alert.alert(member.name, 'Manage this group member.', [
      {
        text: isAdmin ? 'Dismiss as admin' : 'Make group admin',
        onPress: () => groupsActions.toggleAdmin(group.id, member.id),
      },
      {
        text: 'Remove from group',
        onPress: () => groupsActions.removeMember(group.id, member.id),
        style: 'destructive',
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const leaveGroup = () => {
    if (!group) {
      return;
    }

    Alert.alert('Exit group?', `You will leave ${group.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit group', onPress: () => groupsActions.leaveGroup(group.id), style: 'destructive' },
    ]);
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <InfoHeader colors={colors} onBack={() => navigation.goBack()} onEdit={() => showAction('Edit contact')} title="Contact info" />
        <ScrollView style={styles.body} contentContainerStyle={styles.contactContent}>
          <View style={styles.contactProfile}>
            <Image source={chat.avatar} style={styles.contactAvatar} />
            <Text numberOfLines={1} style={styles.contactName}>{chat.name}</Text>
            <Text style={styles.contactCategory}>Apps</Text>
            <Text style={styles.contactPage}>App Page</Text>
            <Text style={styles.openLine}><Text style={styles.openNow}>Open</Text> until 6:00 PM</Text>
            <TouchableOpacity activeOpacity={0.72} onPress={() => showAction('Share')} style={styles.shareAction}>
              <Ionicons name="arrow-redo-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.shareLabel}>Share</Text>
          </View>

          <View style={styles.contactDivider} />
          <View style={styles.businessBlock}>
            <View style={styles.businessIntroRow}>
              <Text style={styles.businessIntro}>This is a business account.</Text>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.openNow}>Open now</Text>
              <View style={styles.hoursRight}>
                <Text style={styles.hoursText}>09:00 - 18:00</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </View>
            </View>
          </View>

          <View style={styles.contactDivider} />
          <View style={styles.contactSection}>
            <InfoOption colors={colors} icon="images-outline" label="Media, links and docs" value={`${visibleMediaCount}`} onPress={() => navigation.navigate('MediaLinksDocsScreen', { chat, messages })} />
            <View style={styles.contactMediaStrip}>
              {Array.from({ length: 4 }).map((_, index) => {
                const message = mediaMessages[index % Math.max(mediaMessages.length, 1)];
                const source = message?.image ?? chat.avatar;

                return (
                  <TouchableOpacity activeOpacity={0.78} key={`contact-media-${index}`} onPress={() => message && navigation.navigate('MediaViewerScreen', { message })} style={styles.contactMediaThumb}>
                    <Image source={source} style={styles.contactMediaImage} />
                    <View style={styles.contactMediaBadge}>
                      <Ionicons name="camera" size={12} color={colors.badgeText} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.contactDivider} />
          <View style={styles.contactSection}>
            <InfoOption colors={colors} icon="star-outline" label="Starred messages" onPress={() => navigation.navigate('StarredMessagesScreen', { chat, messages })} />
            <InfoOption colors={colors} icon="notifications-outline" label="Notification settings" onPress={() => navigation.navigate('NotificationSettingsScreen')} />
            <InfoOption colors={colors} icon="timer-outline" label="Disappearing messages" subtitle="Off" onPress={() => showAction('Disappearing messages')} />
            <InfoOption colors={colors} materialIcon="shield-check-outline" label="Advanced chat privacy" subtitle="Off" onPress={() => showAction('Advanced chat privacy')} />
            <TouchableOpacity activeOpacity={0.72} onPress={() => showAction('Encryption')} style={styles.encryptionCard}>
              <View style={styles.optionIcon}>
                <Ionicons name="lock-closed-outline" size={24} color={colors.textMuted} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>Encryption</Text>
                <Text style={styles.optionSubtitle}>Mock encryption envelope enabled for this demo. Real E2E verification is pending backend support.</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.contactDivider} />
          <View style={styles.aboutPhoneBlock}>
            <Text style={styles.aboutPhoneTitle}>About and phone number</Text>
            <Text style={styles.aboutPhoneText}>{contactAbout}</Text>
            <View style={styles.contactDivider} />
            <Text style={styles.phoneText}>{contactPhone}</Text>
          </View>

          <View style={styles.contactDivider} />
          <View style={styles.contactSection}>
            <InfoOption colors={colors} icon="heart-outline" label="Add to favourites" onPress={() => showAction('Add to favourites')} />
            <InfoOption colors={colors} icon="albums-outline" label="Add to list" onPress={() => showAction('Add to list')} />
            <InfoOption danger colors={colors} icon="remove-circle-outline" label="Clear chat" onPress={() => showAction('Clear chat')} />
            <InfoOption danger colors={colors} icon="ban-outline" label={`Block ${chat.name}`} onPress={() => showAction(`Block ${chat.name}`)} />
            <InfoOption danger colors={colors} icon="thumbs-down-outline" label="Report business" onPress={() => showAction('Report business')} />
            <InfoOption danger colors={colors} icon="trash-outline" label="Delete chat" onPress={() => showAction('Delete chat')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const adminNames = group.members.filter((member) => group.admins.includes(member.id)).map((member) => member.name);
  const visibleMembers = showAllMembers ? group.members : group.members.slice(0, 9);
  const hiddenMemberCount = Math.max(group.members.length - visibleMembers.length, 0);
  return (
    <SafeAreaView style={styles.safeArea}>
      <InfoHeader colors={colors} onBack={() => navigation.goBack()} title="Group info" />
      <ScrollView style={styles.body} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.groupProfile}>
          <Image source={group.avatar} style={styles.groupAvatar} />
          <View style={styles.nameEditorRow}>
            {editingName ? (
              <TextInput
                autoFocus
                onBlur={saveGroupName}
                onChangeText={setDraftName}
                onSubmitEditing={saveGroupName}
                returnKeyType="done"
                style={styles.nameInput}
                value={draftName}
              />
            ) : (
              <Text numberOfLines={1} style={styles.groupName}>{group.name}</Text>
            )}
            <TouchableOpacity accessibilityLabel="Edit group name" onPress={() => (editingName ? saveGroupName() : setEditingName(true))} style={styles.editButton}>
              <Ionicons name={editingName ? 'checkmark' : 'pencil'} size={23} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.metaLine}>Group - <Text style={styles.memberCount}>{group.members.length} members</Text></Text>
          <View style={styles.actionRow}>
            <RoundAction colors={colors} icon="call-outline" label="Voice" onPress={() => navigation.navigate('CallScreen', { contact: chat, mode: CallMode.Voice })} />
            <RoundAction colors={colors} icon="videocam-outline" label="Video" onPress={() => navigation.navigate('CallScreen', { contact: chat, mode: CallMode.Video })} />
            <RoundAction colors={colors} icon="person-add-outline" label="Add" onPress={addMember} />
            <RoundAction colors={colors} icon="search-outline" label="Search" onPress={() => showAction('Search messages')} />
          </View>
        </View>

        <View style={styles.aboutBlock}>
          <View style={styles.aboutTextBlock}>
            {editingAbout ? (
              <TextInput
                autoFocus
                multiline
                onBlur={saveGroupAbout}
                onChangeText={setDraftAbout}
                style={styles.aboutInput}
                value={draftAbout}
              />
            ) : (
              <Text style={styles.about}>{group.description}</Text>
            )}
          </View>
          <TouchableOpacity accessibilityLabel="Edit group details" onPress={() => (editingAbout ? saveGroupAbout() : setEditingAbout(true))} style={styles.editButton}>
            <Ionicons name={editingAbout ? 'checkmark' : 'pencil'} size={23} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <InfoOption colors={colors} icon="images-outline" label="Media, links and docs" value={`${sharedTotal}`} onPress={() => navigation.navigate('MediaLinksDocsScreen', { chat, messages })} />
          <View style={styles.mediaStrip}>
            {mediaMessages.slice(0, 4).map((message, index) => (
              <View key={message.id} style={styles.mediaThumb}>
                {message.image ? (
                  <Image source={message.image} style={styles.mediaImage} />
                ) : (
                  <View style={styles.mediaPlaceholder}><Ionicons name="videocam" size={18} color={colors.badgeText} /></View>
                )}
                <View style={styles.mediaOverlay}>
                  <Ionicons name={message.kind === 'video' ? 'videocam' : 'image'} size={13} color={colors.badgeText} />
                  <Text style={styles.mediaLabel}>{index === 0 ? '4:16' : index === 1 ? '1:21' : index === 2 ? '4:06' : '1:05'}</Text>
                </View>
              </View>
            ))}
            {mediaMessages.length === 0 && (
              <Text style={styles.emptyMedia}>No media shared yet</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <InfoOption colors={colors} icon="star-outline" label="Starred messages" onPress={() => navigation.navigate('StarredMessagesScreen', { chat, messages })} />
          <InfoOption colors={colors} icon="notifications-outline" label="Notification settings" onPress={() => navigation.navigate('NotificationSettingsScreen')} />
          <InfoOption colors={colors} icon="lock-closed-outline" label="Encryption" subtitle="Mock encryption envelope enabled. Real E2E verification is pending backend support." onPress={() => showAction('Encryption')} />
          <InfoOption colors={colors} icon="timer-outline" label="Disappearing messages" subtitle="Off" onPress={() => showAction('Disappearing messages')} />
          <InfoOption colors={colors} materialIcon="shield-check-outline" label="Advanced chat privacy" subtitle="Off" onPress={() => showAction('Advanced chat privacy')} />
          <InfoOption
            colors={colors}
            icon="megaphone-outline"
            label="Only admins can send"
            subtitle={group.announcementOnly ? 'On' : 'Off'}
            trailing={<Switch onValueChange={(value) => groupsActions.updateGroup(group.id, { announcementOnly: value })} value={group.announcementOnly} />}
          />
          <InfoOption colors={colors} icon="link-outline" label="Invite via link" subtitle={group.inviteLink} onPress={() => groupsActions.rotateInviteLink(group.id)} />
        </View>

        <View style={styles.section}>
          <InfoOption colors={colors} materialIcon="account-multiple-plus" label="Create a similar group" subtitle="Start with the same members that you can add or remove." onPress={() => showAction('Create a similar group')} />
        </View>

        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>{group.members.length} members</Text>
          <TouchableOpacity accessibilityLabel="Search members" onPress={() => showAction('Search members')} style={styles.memberSearchButton}>
            <Ionicons name="search-outline" size={25} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.memberList}>
          {visibleMembers.map((member, index) => (
            <MemberRow
              colors={colors}
              isAdmin={group.admins.includes(member.id)}
              isCurrentUser={index === 0}
              key={member.id}
              member={member}
              onPress={() => openMemberActions(member, index === 0)}
            />
          ))}
          {hiddenMemberCount > 0 && (
            <TouchableOpacity activeOpacity={0.72} onPress={() => setShowAllMembers(true)} style={styles.moreMembersRow}>
              <Ionicons name="chevron-down" size={24} color={colors.textMuted} />
              <Text style={styles.moreMembersText}>{hiddenMemberCount} more</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <InfoOption colors={colors} icon="list-outline" label="View member changes" onPress={() => showAction('View member changes')} />
          <InfoOption colors={colors} icon="heart-outline" label="Add to favourites" onPress={() => showAction('Add to favourites')} />
          <InfoOption colors={colors} icon="albums-outline" label="Add to list" onPress={() => showAction('Add to list')} />
          <InfoOption danger colors={colors} icon="remove-circle-outline" label="Clear chat" onPress={() => showAction('Clear chat')} />
          <InfoOption danger colors={colors} icon="exit-outline" label="Exit group" onPress={leaveGroup} />
          <InfoOption danger colors={colors} icon="thumbs-down-outline" label="Report group" onPress={() => showAction('Report group')} />
        </View>

        <Text style={styles.footerNote}>
          Group created by {adminNames[0] ?? 'a group admin'}, on {formatGroupCreatedAt(group.createdAt)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoHeader({ colors, onBack, onEdit, title }: { colors: ThemeColors; onBack: () => void; onEdit?: () => void; title: string }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Close" onPress={onBack} style={styles.headerButton}>
        <Ionicons name="close" size={28} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {onEdit && (
        <TouchableOpacity accessibilityLabel="Edit" onPress={onEdit} style={styles.headerEditButton}>
          <Ionicons name="pencil" size={25} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function RoundAction({
  colors,
  disabled,
  icon,
  label,
  onPress,
}: {
  colors: ThemeColors;
  disabled?: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const styles = createStyles(colors);

  return (
    <TouchableOpacity activeOpacity={0.74} disabled={disabled} onPress={onPress} style={styles.roundAction}>
      <View style={[styles.roundActionIcon, disabled && styles.disabledAction]}>
        <Ionicons name={icon} size={25} color={disabled ? colors.textMuted : colors.text} />
      </View>
      <Text style={[styles.roundActionText, disabled && styles.disabledActionText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoOption({
  colors,
  danger,
  icon,
  label,
  materialIcon,
  onPress,
  subtitle,
  trailing,
  value,
}: {
  colors: ThemeColors;
  danger?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  label: string;
  materialIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  subtitle?: string;
  trailing?: ReactNode;
  value?: string;
}) {
  const styles = createStyles(colors);
  const iconColor = danger ? colors.danger : colors.textMuted;
  const content = (
    <View style={styles.optionRow}>
      <View style={styles.optionIcon}>
        {icon && <Ionicons name={icon} size={24} color={iconColor} />}
        {materialIcon && <MaterialCommunityIcons name={materialIcon} size={24} color={iconColor} />}
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, danger && styles.dangerText]}>{label}</Text>
        {subtitle && <Text numberOfLines={2} style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.optionValue}>{value}</Text>}
      {trailing}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity activeOpacity={0.72} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

function MemberRow({
  colors,
  isAdmin,
  isCurrentUser,
  member,
  onPress,
}: {
  colors: ThemeColors;
  isAdmin: boolean;
  isCurrentUser: boolean;
  member: GroupMember;
  onPress: () => void;
}) {
  const styles = createStyles(colors);
  const initials = member.name.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();

  return (
    <TouchableOpacity activeOpacity={isCurrentUser ? 1 : 0.72} onPress={onPress} style={styles.memberRow}>
      {member.avatar ? (
        <Image source={member.avatar} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberFallback}><Text style={styles.memberFallbackText}>{initials}</Text></View>
      )}
      <View style={styles.memberText}>
        <Text numberOfLines={1} style={styles.memberName}>{isCurrentUser ? 'You' : member.name}</Text>
        <Text numberOfLines={1} style={[styles.memberStatus, isCurrentUser && styles.memberTag]}>{
          isCurrentUser ? 'Add member tag' : member.phone
        }</Text>
      </View>
      {isAdmin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Group admin</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    about: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 24,
    },
    aboutBlock: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    aboutInput: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 24,
      minHeight: 56,
      padding: 0,
    },
    aboutTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    adminBadge: {
      backgroundColor: colors.mode === 'dark' ? '#103529' : '#D9FDD3',
      borderRadius: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    adminBadgeText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    avatar: {
      borderRadius: 48,
      height: 96,
      width: 96,
    },
    body: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      paddingBottom: 28,
    },
    aboutPhoneBlock: {
      backgroundColor: colors.background,
      paddingHorizontal: 28,
      paddingVertical: 18,
    },
    aboutPhoneText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      paddingBottom: 18,
    },
    aboutPhoneTitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 18,
    },
    businessBlock: {
      backgroundColor: colors.background,
      paddingHorizontal: 28,
      paddingVertical: 20,
    },
    businessIntro: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
    },
    businessIntroRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 34,
    },
    contactAvatar: {
      borderRadius: 76,
      height: 152,
      width: 152,
    },
    contactCategory: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '400',
      marginTop: 6,
    },
    contactContent: {
      paddingBottom: 36,
    },
    contactDivider: {
      backgroundColor: colors.divider,
      height: StyleSheet.hairlineWidth,
      marginHorizontal: 28,
    },
    contactMediaBadge: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.58)',
      borderRadius: 10,
      height: 20,
      justifyContent: 'center',
      position: 'absolute',
      right: 5,
      top: 5,
      width: 20,
    },
    contactMediaImage: {
      height: '100%',
      width: '100%',
    },
    contactMediaStrip: {
      flexDirection: 'row',
      paddingBottom: 18,
      paddingHorizontal: 28,
      paddingTop: 4,
    },
    contactMediaThumb: {
      aspectRatio: 1.48,
      backgroundColor: colors.surface,
      borderRadius: 7,
      flex: 1,
      height: 74,
      marginRight: 8,
      maxWidth: 114,
      overflow: 'hidden',
    },
    contactName: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '600',
      marginTop: 22,
      maxWidth: '88%',
      textAlign: 'center',
    },
    contactPage: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 6,
    },
    contactProfile: {
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingBottom: 30,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    contactSection: {
      backgroundColor: colors.background,
      paddingVertical: 8,
    },
    dangerText: {
      color: colors.danger,
    },
    disabledAction: {
      opacity: 0.45,
    },
    disabledActionText: {
      color: colors.textMuted,
      opacity: 0.7,
    },
    editButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      marginLeft: 10,
      width: 44,
    },
    emptyMedia: {
      color: colors.textMuted,
      fontSize: 14,
      paddingVertical: 14,
    },
    footerNote: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    groupAvatar: {
      borderRadius: 72,
      height: 144,
      width: 144,
    },
    groupName: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 28,
      fontWeight: '400',
      textAlign: 'center',
    },
    groupProfile: {
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingBottom: 18,
      paddingHorizontal: 18,
      paddingTop: 28,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 58,
      paddingHorizontal: 16,
    },
    headerButton: {
      alignItems: 'center',
      height: 46,
      justifyContent: 'center',
      marginRight: 12,
      width: 46,
    },
    headerEditButton: {
      alignItems: 'center',
      height: 46,
      justifyContent: 'center',
      marginLeft: 'auto',
      width: 46,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '400',
    },
    hoursRight: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    hoursRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 42,
    },
    hoursText: {
      color: colors.text,
      fontSize: 16,
      marginRight: 6,
    },
    mediaImage: {
      height: '100%',
      width: '100%',
    },
    mediaLabel: {
      color: colors.badgeText,
      fontSize: 12,
      marginLeft: 3,
    },
    mediaOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.34)',
      bottom: 0,
      flexDirection: 'row',
      left: 0,
      paddingHorizontal: 5,
      paddingVertical: 3,
      position: 'absolute',
      right: 0,
    },
    mediaPlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.textMuted,
      flex: 1,
      justifyContent: 'center',
    },
    mediaStrip: {
      flexDirection: 'row',
      paddingBottom: 20,
      paddingHorizontal: 24,
    },
    mediaThumb: {
      backgroundColor: colors.surface,
      borderRadius: 7,
      height: 76,
      marginRight: 10,
      overflow: 'hidden',
      width: 116,
    },
    memberAvatar: {
      borderRadius: 28,
      height: 56,
      width: 56,
    },
    memberCount: {
      color: colors.primary,
      fontWeight: '500',
    },
    memberFallback: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#3B4A54' : '#F7D8CE',
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    memberFallbackText: {
      color: colors.primaryDark,
      fontSize: 20,
      fontWeight: '500',
    },
    memberList: {
      backgroundColor: colors.background,
      paddingBottom: 6,
    },
    memberName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '400',
    },
    memberRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 76,
      paddingHorizontal: 24,
    },
    memberSearchButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    memberStatus: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 4,
    },
    memberTag: {
      color: colors.primary,
      fontWeight: '500',
    },
    memberText: {
      flex: 1,
      marginLeft: 14,
      minWidth: 0,
      paddingRight: 10,
    },
    membersHeader: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 24,
      paddingRight: 14,
      paddingTop: 18,
    },
    membersTitle: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
    },
    metaLine: {
      color: colors.textMuted,
      fontSize: 18,
      marginTop: 8,
      textAlign: 'center',
    },
    moreMembersRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 62,
      paddingHorizontal: 44,
    },
    moreMembersText: {
      color: colors.text,
      fontSize: 18,
      marginLeft: 28,
    },
    name: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '500',
      marginTop: 14,
    },
    nameEditorRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      maxWidth: '92%',
    },
    nameInput: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '400',
      minWidth: 180,
      padding: 0,
      textAlign: 'center',
    },
    optionIcon: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      marginRight: 18,
      width: 36,
    },
    optionLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '400',
    },
    optionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 72,
      paddingHorizontal: 24,
    },
    optionSubtitle: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 21,
      marginTop: 3,
    },
    optionText: {
      flex: 1,
      minWidth: 0,
    },
    optionValue: {
      color: colors.textMuted,
      fontSize: 18,
      marginLeft: 12,
    },
    openLine: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 16,
    },
    openNow: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    phoneText: {
      color: colors.text,
      fontSize: 17,
      paddingTop: 18,
    },
    profile: {
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingBottom: 24,
      paddingHorizontal: 18,
      paddingTop: 24,
    },
    roundAction: {
      alignItems: 'center',
      marginHorizontal: 8,
      width: 76,
    },
    roundActionIcon: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 30,
      height: 60,
      justifyContent: 'center',
      width: 60,
    },
    roundActionText: {
      color: colors.text,
      fontSize: 14,
      marginTop: 9,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    section: {
      backgroundColor: colors.background,
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 10,
      paddingVertical: 4,
    },
    shareAction: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 30,
      height: 60,
      justifyContent: 'center',
      marginTop: 24,
      width: 60,
    },
    shareLabel: {
      color: colors.text,
      fontSize: 14,
      marginTop: 10,
    },
    encryptionCard: {
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#202C33' : '#F6F4F2',
      borderRadius: 10,
      flexDirection: 'row',
      marginHorizontal: 22,
      marginVertical: 6,
      minHeight: 86,
      paddingHorizontal: 2,
    },
  });
