import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import contacts from '../data/contacts';
import { groupsActions, useGroups } from '../features/groups/groupsStore';
import type { GroupAnnouncement, GroupDocument, GroupEvent, GroupMember, GroupProfile, GroupTask } from '../features/groups/domain';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type GroupsScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupsScreen'>;
type GroupTab = 'overview' | 'members' | 'work';

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
const maxMembers = 1024;

function shortDate(value: string | undefined): string {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function firstAvailableContact(group: GroupProfile): GroupMember | null {
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

export default function GroupsScreen({ navigation }: GroupsScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const data = useGroups((state) => state.data);
  const error = useGroups((state) => state.error);
  const selectedGroupId = useGroups((state) => state.selectedGroupId);
  const [tab, setTab] = useState<GroupTab>('overview');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    void groupsActions.initialize();
  }, []);

  const groups = useMemo(() => data.groups.filter((group) => !group.deleted), [data.groups]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const groupTasks = data.tasks.filter((task) => task.groupId === selectedGroup?.id);
  const groupDocuments = data.documents.filter((document) => document.groupId === selectedGroup?.id);
  const groupEvents = data.events.filter((event) => event.groupId === selectedGroup?.id);
  const groupAnnouncements = data.announcements.filter((announcement) => announcement.groupId === selectedGroup?.id);

  const createGroup = () => {
    groupsActions.createGroup(newGroupName);
    setNewGroupName('');
  };

  const addMember = () => {
    if (!selectedGroup) {
      return;
    }

    const member = firstAvailableContact(selectedGroup);

    if (!member) {
      Alert.alert('No contacts available', 'Every demo contact is already in this group.');
      return;
    }

    groupsActions.addMember(selectedGroup.id, member);
  };

  const confirmDelete = () => {
    if (!selectedGroup) {
      return;
    }

    Alert.alert('Delete group?', `${selectedGroup.name} will be removed from the Groups module.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => groupsActions.deleteGroup(selectedGroup.id), style: 'destructive' },
    ]);
  };

  const confirmLeave = () => {
    if (!selectedGroup) {
      return;
    }

    Alert.alert('Leave group?', `You will leave ${selectedGroup.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', onPress: () => groupsActions.leaveGroup(selectedGroup.id), style: 'destructive' },
    ]);
  };

  const openGroupChat = () => {
    if (!selectedGroup) {
      return;
    }

    const chat = {
      archived: false,
      avatar: selectedGroup.avatar,
      id: selectedGroup.chatId,
      lastMessage: selectedGroup.description,
      muted: false,
      name: selectedGroup.name,
      online: true,
      pinned: false,
      status: 'sent' as const,
      time: 'Now',
      unread: 0,
      verified: true,
    };

    navigation.navigate('ChatScreen', { chat });
  };

  const renderGroup = ({ item }: { item: GroupProfile }) => (
    <TouchableOpacity
      activeOpacity={0.76}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedGroup?.id === item.id }}
      onPress={() => groupsActions.selectGroup(item.id)}
      style={[styles.groupCard, selectedGroup?.id === item.id && styles.groupCardActive]}
    >
      <Image source={item.avatar} style={styles.groupAvatar} />
      <Text numberOfLines={1} style={[styles.groupName, selectedGroup?.id === item.id && styles.groupNameActive]}>{item.name}</Text>
      <Text style={[styles.groupMeta, selectedGroup?.id === item.id && styles.groupMetaActive]}>{item.members.length}/{maxMembers}</Text>
    </TouchableOpacity>
  );

  const renderMember = (member: GroupMember) => (
    <View key={member.id} style={styles.memberRow}>
      {member.avatar ? <Image source={member.avatar} style={styles.memberAvatar} /> : <View style={styles.memberFallback}><Text style={styles.memberFallbackText}>{member.name.charAt(0)}</Text></View>}
      <View style={styles.memberText}>
        <Text numberOfLines={1} style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberPhone}>{member.phone}</Text>
      </View>
      <TouchableOpacity onPress={() => groupsActions.toggleAdmin(selectedGroup.id, member.id)} style={styles.iconAction}>
        <MaterialCommunityIcons name={member.role === 'admin' ? 'shield-star' : 'shield-star-outline'} size={21} color={member.role === 'admin' ? colors.primary : colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => groupsActions.removeMember(selectedGroup.id, member.id)} style={styles.iconAction}>
        <Ionicons name="person-remove-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  if (!selectedGroup) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header colors={colors} title="Groups" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No groups</Text>
          <Text style={styles.emptyText}>Create a group to start managing members, admins, invites, and collaboration.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header colors={colors} title="Groups" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.body} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.createRow}>
          <TextInput
            accessibilityLabel="New group name"
            onChangeText={setNewGroupName}
            placeholder="Create group"
            placeholderTextColor={colors.textMuted}
            style={styles.createInput}
            value={newGroupName}
          />
          <TouchableOpacity accessibilityRole="button" onPress={createGroup} style={styles.createButton}>
            <Ionicons name="add" size={22} color={colors.badgeText} />
          </TouchableOpacity>
        </View>
        <FlatList
          contentContainerStyle={styles.groupList}
          data={groups}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          showsHorizontalScrollIndicator={false}
        />
        <View style={styles.profileBlock}>
          <Image source={selectedGroup.avatar} style={styles.profileAvatar} />
          <View style={styles.profileText}>
            <TextInput
              accessibilityLabel="Group name"
              onEndEditing={(event) => groupsActions.updateGroup(selectedGroup.id, { name: event.nativeEvent.text })}
              defaultValue={selectedGroup.name}
              style={styles.profileNameInput}
            />
            <Text style={styles.profileMeta}>{selectedGroup.members.length} members • {selectedGroup.admins.length} admins • capacity {maxMembers}</Text>
          </View>
          <TouchableOpacity accessibilityLabel="Open group chat" onPress={openGroupChat} style={styles.chatButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.badgeText} />
          </TouchableOpacity>
        </View>
        <View style={styles.tabRow}>
          {(['overview', 'members', 'work'] satisfies GroupTab[]).map((item) => (
            <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tabButton, tab === item && styles.tabButtonActive]}>
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {tab === 'overview' && (
          <View>
            <SectionTitle colors={colors} title="Group Info" />
            <View style={styles.panel}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                accessibilityLabel="Group description"
                defaultValue={selectedGroup.description}
                multiline
                onEndEditing={(event) => groupsActions.updateGroup(selectedGroup.id, { description: event.nativeEvent.text })}
                style={styles.descriptionInput}
              />
              <InfoRow colors={colors} icon="image-outline" title="Profile picture" value="Group avatar is active" />
              <InfoRow colors={colors} icon="link-outline" title="Invite link" value={selectedGroup.inviteLink} />
              <TouchableOpacity onPress={() => groupsActions.rotateInviteLink(selectedGroup.id)} style={styles.fullButton}>
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                <Text style={styles.fullButtonText}>Reset invite link</Text>
              </TouchableOpacity>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Announcement only</Text>
                  <Text style={styles.switchSubtitle}>Only admins can post when enabled.</Text>
                </View>
                <Switch
                  onValueChange={(value) => groupsActions.updateGroup(selectedGroup.id, { announcementOnly: value })}
                  value={selectedGroup.announcementOnly}
                />
              </View>
              <View style={styles.actionGrid}>
                <TouchableOpacity onPress={confirmLeave} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Leave group</Text></TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} style={styles.dangerButton}><Text style={styles.dangerButtonText}>Delete group</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {tab === 'members' && (
          <View>
            <SectionTitle colors={colors} title="Members & Admins" actionLabel="Add member" onAction={addMember} />
            <View style={styles.panel}>
              {selectedGroup.members.slice(0, 14).map(renderMember)}
              {selectedGroup.members.length > 14 && (
                <Text style={styles.moreText}>{selectedGroup.members.length - 14} more members loaded lazily for 1024-member support.</Text>
              )}
            </View>
          </View>
        )}
        {tab === 'work' && (
          <View>
            <SectionTitle colors={colors} title="Tasks" />
            {groupTasks.map((task) => <TaskRow key={task.id} colors={colors} task={task} />)}
            <SectionTitle colors={colors} title="Shared Docs" />
            {groupDocuments.map((document) => <DocumentRow key={document.id} colors={colors} document={document} />)}
            <SectionTitle colors={colors} title="Events" />
            {groupEvents.map((event) => <EventRow key={event.id} colors={colors} event={event} />)}
            <SectionTitle colors={colors} title="Announcements" />
            {groupAnnouncements.map((announcement) => <AnnouncementRow key={announcement.id} announcement={announcement} colors={colors} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ colors, onBack, title }: { colors: ThemeColors; onBack: () => void; title: string }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" onPress={onBack} style={styles.headerButton}>
        <Ionicons name="arrow-back" size={24} color={colors.icon} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <MaterialCommunityIcons name="account-group" size={25} color={colors.icon} />
    </View>
  );
}

function SectionTitle({ actionLabel, colors, onAction, title }: { actionLabel?: string; colors: ThemeColors; onAction?: () => void; title: string }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoRow({ colors, icon, title, value }: { colors: ThemeColors; icon: React.ComponentProps<typeof Ionicons>['name']; title: string; value: string }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function TaskRow({ colors, task }: { colors: ThemeColors; task: GroupTask }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.workRow}>
      <Text style={styles.workKicker}>{task.priority} • {task.status}</Text>
      <Text style={styles.workTitle}>{task.title}</Text>
      <Text style={styles.workSubtitle}>Assignees: {task.assignees.join(', ')} • Due {shortDate(task.dueAt)}</Text>
      <View style={styles.statusActions}>
        {(['todo', 'inProgress', 'blocked', 'done'] satisfies GroupTask['status'][]).map((status) => (
          <TouchableOpacity key={status} onPress={() => groupsActions.updateTask(task.id, status)} style={[styles.statusButton, task.status === status && styles.statusButtonActive]}>
            <Text style={[styles.statusButtonText, task.status === status && styles.statusButtonTextActive]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function DocumentRow({ colors, document }: { colors: ThemeColors; document: GroupDocument }) {
  return <CompactWorkRow colors={colors} icon="document-text-outline" meta={`v${document.version}`} subtitle={`Owner ${document.owner} • ${document.reviewers.length} reviewers • ${shortDate(document.updatedAt)}`} title={document.title} />;
}

function EventRow({ colors, event }: { colors: ThemeColors; event: GroupEvent }) {
  return <CompactWorkRow colors={colors} icon="calendar-outline" meta={`${event.rsvp.yes} yes`} subtitle={`Maybe ${event.rsvp.maybe}, no ${event.rsvp.no} • ${shortDate(event.startsAt)}`} title={event.title} />;
}

function AnnouncementRow({ announcement, colors }: { announcement: GroupAnnouncement; colors: ThemeColors }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.workRow}>
      <View style={styles.compactHeader}>
        <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
        <View style={styles.compactText}>
          <Text style={styles.workTitle}>{announcement.title}</Text>
          <Text style={styles.workSubtitle}>{announcement.channel} • reach {announcement.reach} • {announcement.deliveryStatus}</Text>
        </View>
        <Switch
          onValueChange={(readOnly) => groupsActions.updateAnnouncement(announcement.id, { readOnly })}
          value={announcement.readOnly}
        />
      </View>
    </View>
  );
}

function CompactWorkRow({ colors, icon, meta, subtitle, title }: { colors: ThemeColors; icon: React.ComponentProps<typeof Ionicons>['name']; meta: string; subtitle: string; title: string }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.workRow}>
      <View style={styles.compactHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <View style={styles.compactText}>
          <Text style={styles.workTitle}>{title}</Text>
          <Text style={styles.workSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.compactMeta}>{meta}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  actionGrid: { flexDirection: 'row', marginTop: 12 },
  body: { backgroundColor: colors.background, flex: 1 },
  chatButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  compactHeader: { alignItems: 'center', flexDirection: 'row' },
  compactMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginLeft: 8 },
  compactText: { flex: 1, marginLeft: 10, minWidth: 0 },
  content: { paddingBottom: 26 },
  createButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, height: 46, justifyContent: 'center', marginLeft: 8, width: 48 },
  createInput: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, color: colors.text, flex: 1, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  createRow: { alignItems: 'center', flexDirection: 'row', padding: 16 },
  dangerButton: { alignItems: 'center', backgroundColor: colors.danger, borderRadius: 8, flex: 1, justifyContent: 'center', marginLeft: 8, minHeight: 42 },
  dangerButtonText: { color: colors.badgeText, fontSize: 14, fontWeight: '500' },
  descriptionInput: { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 14, lineHeight: 20, minHeight: 76, padding: 10, textAlignVertical: 'top' },
  empty: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '500' },
  errorText: { backgroundColor: colors.surface, color: colors.danger, fontSize: 13, fontWeight: '500', padding: 12 },
  fullButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', marginTop: 10, minHeight: 42 },
  fullButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500', marginLeft: 7 },
  groupAvatar: { borderRadius: 26, height: 52, width: 52 },
  groupCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: 8, borderWidth: 1, marginRight: 10, minHeight: 112, padding: 10, width: 108 },
  groupCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  groupList: { paddingHorizontal: 16, paddingBottom: 12 },
  groupMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 3 },
  groupMetaActive: { color: colors.badgeText },
  groupName: { color: colors.text, fontSize: 13, fontWeight: '500', marginTop: 8 },
  groupNameActive: { color: colors.badgeText },
  header: { alignItems: 'center', backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingBottom: 10, paddingHorizontal: 12, paddingTop: 16 + androidTopInset },
  headerButton: { alignItems: 'center', height: 42, justifyContent: 'center', marginRight: 8, width: 42 },
  headerTitle: { color: colors.text, flex: 1, fontSize: 24, fontWeight: '400' },
  iconAction: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  infoRow: { alignItems: 'center', flexDirection: 'row', minHeight: 52 },
  infoText: { flex: 1, marginLeft: 10, minWidth: 0 },
  infoTitle: { color: colors.text, fontSize: 15, fontWeight: '500' },
  infoValue: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 7, textTransform: 'uppercase' },
  memberAvatar: { borderRadius: 20, height: 40, width: 40 },
  memberFallback: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  memberFallbackText: { color: colors.badgeText, fontSize: 16, fontWeight: '500' },
  memberName: { color: colors.text, fontSize: 15, fontWeight: '500' },
  memberPhone: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  memberRow: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58 },
  memberText: { flex: 1, marginLeft: 10, minWidth: 0 },
  moreText: { color: colors.textMuted, fontSize: 12, fontWeight: '500', paddingVertical: 12, textAlign: 'center' },
  outlineButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 42 },
  outlineButtonText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  panel: { backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },
  profileAvatar: { borderRadius: 32, height: 64, width: 64 },
  profileBlock: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', padding: 16 },
  profileMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 3 },
  profileNameInput: { color: colors.text, fontSize: 22, fontWeight: '500', minHeight: 34, padding: 0 },
  profileText: { flex: 1, marginLeft: 12, minWidth: 0 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  sectionAction: { minHeight: 34, justifyContent: 'center' },
  sectionActionText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 18 },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '500', textTransform: 'uppercase' },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  statusButton: { backgroundColor: colors.surface, borderRadius: 8, marginRight: 7, marginTop: 6, paddingHorizontal: 9, paddingVertical: 7 },
  statusButtonActive: { backgroundColor: colors.primary },
  statusButtonText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  statusButtonTextActive: { color: colors.badgeText },
  switchRow: { alignItems: 'center', flexDirection: 'row', marginTop: 12 },
  switchSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  switchText: { flex: 1, minWidth: 0 },
  switchTitle: { color: colors.text, fontSize: 15, fontWeight: '500' },
  tabButton: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 3, flex: 1, justifyContent: 'center', minHeight: 48 },
  tabButtonActive: { borderBottomColor: colors.primary },
  tabRow: { flexDirection: 'row' },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  tabTextActive: { color: colors.primary },
  workKicker: { color: colors.textMuted, fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  workRow: { backgroundColor: colors.background, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 13 },
  workSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  workTitle: { color: colors.text, fontSize: 16, fontWeight: '500' },
});
