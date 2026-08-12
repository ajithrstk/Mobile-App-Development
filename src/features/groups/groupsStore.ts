import { storageService } from '../../storage/storageService';
import { createStore, useStore } from '../../state/createStore';
import { chatsActions } from '../../state/chats/chatsStore';
import contacts from '../../data/contacts';
import type { Chat } from '../../types';
import { initialGroupsData } from './data';
import type { GroupAnnouncement, GroupMember, GroupProfile, GroupsStateData, GroupTask } from './domain';

type GroupsStatus = 'idle' | 'loading' | 'ready' | 'error';

type GroupsState = {
  data: GroupsStateData;
  selectedGroupId: string;
  status: GroupsStatus;
  error: string | null;
};

const groupsStorageKey = 'chatterly.groups.module';
const MAX_GROUP_MEMBERS = 1024;
const SEEDED_GROUP_IDS = new Set(initialGroupsData.groups.map((group) => group.id));
const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));

function cloneInitialData(): GroupsStateData {
  return JSON.parse(JSON.stringify(initialGroupsData)) as GroupsStateData;
}

const initialData = cloneInitialData();

export const groupsStore = createStore<GroupsState>({
  data: initialData,
  error: null,
  selectedGroupId: initialData.groups[0]?.id ?? '',
  status: 'idle',
});

function persist(data: GroupsStateData): void {
  void storageService.set(groupsStorageKey, data);
}

function updateData(updater: (data: GroupsStateData) => GroupsStateData): GroupsStateData {
  const nextData = updater(groupsStore.getState().data);
  groupsStore.setState({ data: nextData, error: null });
  persist(nextData);
  return nextData;
}

function createChatForGroup(group: GroupProfile): Chat {
  return {
    archived: false,
    avatar: group.avatar,
    id: group.chatId,
    lastMessage: `${group.members.length} members • ${group.description}`,
    latestAt: new Date().toISOString(),
    muted: false,
    name: group.name,
    online: true,
    pinned: false,
    status: group.announcementOnly ? 'delivered' : 'sent',
    time: 'Now',
    unread: 0,
    verified: true,
  };
}

function normalizeMembers(members: GroupMember[]): GroupMember[] {
  return members.map((member) => ({
    ...member,
    avatar: contactsById.get(member.id)?.avatar ?? member.avatar,
  }));
}

function normalizeSavedData(saved: GroupsStateData | null): GroupsStateData {
  const defaults = cloneInitialData();

  if (!saved) {
    return defaults;
  }

  const createdGroups = saved.groups.filter((group) => !SEEDED_GROUP_IDS.has(group.id));

  return {
    ...defaults,
    groups: [
      ...defaults.groups.map((defaultGroup) => {
        const savedGroup = saved.groups.find((group) => group.id === defaultGroup.id);

        return savedGroup
          ? {
              ...defaultGroup,
              announcementOnly: savedGroup.announcementOnly,
              deleted: savedGroup.deleted,
              description: savedGroup.description || defaultGroup.description,
              inviteLink: savedGroup.inviteLink || defaultGroup.inviteLink,
              members: normalizeMembers(defaultGroup.members),
              name: savedGroup.name || defaultGroup.name,
              pinnedMessageIds: savedGroup.pinnedMessageIds ?? defaultGroup.pinnedMessageIds,
            }
          : defaultGroup;
      }),
      ...createdGroups.map((group) => ({
        ...group,
        avatar: defaults.groups[0]?.avatar ?? group.avatar,
        members: normalizeMembers(group.members.slice(0, 6)),
      })),
    ],
  };
}

function buildInviteLink(groupId: string): string {
  return `https://chat.chatterly.local/invite/${groupId}-${Math.random().toString(36).slice(2, 8)}`;
}

export const groupsActions = {
  async initialize(): Promise<void> {
    groupsStore.setState({ status: 'loading' });
    const saved = await storageService.get<GroupsStateData | null>(groupsStorageKey, null);
    const data = normalizeSavedData(saved);

    groupsStore.setState({
      data,
      error: null,
      selectedGroupId: data.groups[0]?.id ?? '',
      status: 'ready',
    });
  },

  selectGroup(groupId: string): void {
    groupsStore.setState({ selectedGroupId: groupId });
  },

  createGroup(name: string): void {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      groupsStore.setState({ error: 'Group name must be at least 3 characters.' });
      return;
    }

    const current = groupsStore.getState().data;
    const template = current.groups[0];
    const timestamp = Date.now();
    const members = template.members.slice(0, 6).map((member, index) => ({
      ...member,
      role: index < 2 ? 'admin' as const : 'member' as const,
    }));
    const group: GroupProfile = {
      admins: members.filter((member) => member.role === 'admin').map((member) => member.id),
      announcementOnly: false,
      avatar: template.avatar,
      chatId: `created-group-${timestamp}`,
      createdAt: new Date(timestamp).toISOString(),
      description: 'New group created in Chatterly Groups.',
      id: `group-created-${timestamp}`,
      inviteLink: buildInviteLink(`group-created-${timestamp}`),
      members,
      name: trimmedName,
      pinnedMessageIds: [],
      updatedAt: new Date(timestamp).toISOString(),
    };

    updateData((data) => ({
      ...data,
      generatedAt: new Date().toISOString(),
      groups: [group, ...data.groups],
    }));
    chatsActions.upsertChat(createChatForGroup(group));
    groupsStore.setState({ selectedGroupId: group.id });
  },

  updateGroup(groupId: string, patch: Partial<Pick<GroupProfile, 'announcementOnly' | 'description' | 'name' | 'pinnedMessageIds'>>): void {
    updateData((data) => ({
      ...data,
      groups: data.groups.map((group) => (
        group.id === groupId
          ? {
              ...group,
              announcementOnly: patch.announcementOnly ?? group.announcementOnly,
              description: patch.description?.trim() || group.description,
              name: patch.name?.trim() || group.name,
              pinnedMessageIds: patch.pinnedMessageIds ?? group.pinnedMessageIds,
              updatedAt: new Date().toISOString(),
            }
          : group
      )),
    }));

    const group = groupsStore.getState().data.groups.find((item) => item.id === groupId);

    if (group) {
      chatsActions.upsertChat(createChatForGroup(group));
    }
  },

  addMember(groupId: string, member: GroupMember): void {
    updateData((data) => ({
      ...data,
      groups: data.groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        if (group.members.length >= MAX_GROUP_MEMBERS || group.members.some((item) => item.id === member.id)) {
          return group;
        }

        return {
          ...group,
          members: [...group.members, { ...member, role: 'member' }],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  removeMember(groupId: string, memberId: string): void {
    updateData((data) => ({
      ...data,
      groups: data.groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const members = group.members.filter((member) => member.id !== memberId);
        const admins = group.admins.filter((adminId) => adminId !== memberId);

        return {
          ...group,
          admins: admins.length > 0 ? admins : members.slice(0, 1).map((member) => member.id),
          members: members.map((member, index) => ({
            ...member,
            role: admins.includes(member.id) || (admins.length === 0 && index === 0) ? 'admin' : 'member',
          })),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  toggleAdmin(groupId: string, memberId: string): void {
    updateData((data) => ({
      ...data,
      groups: data.groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const alreadyAdmin = group.admins.includes(memberId);
        const nextAdmins = alreadyAdmin
          ? group.admins.filter((adminId) => adminId !== memberId)
          : [...group.admins, memberId];
        const guardedAdmins = nextAdmins.length > 0 ? nextAdmins : group.admins;

        return {
          ...group,
          admins: guardedAdmins,
          members: group.members.map((member) => (
            member.id === memberId ? { ...member, role: guardedAdmins.includes(member.id) ? 'admin' : 'member' } : member
          )),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  rotateInviteLink(groupId: string): void {
    this.updateGroup(groupId, { description: groupsStore.getState().data.groups.find((group) => group.id === groupId)?.description ?? '' });
    updateData((data) => ({
      ...data,
      groups: data.groups.map((group) => (
        group.id === groupId ? { ...group, inviteLink: buildInviteLink(group.id), updatedAt: new Date().toISOString() } : group
      )),
    }));
  },

  leaveGroup(groupId: string): void {
    const currentUserId = groupsStore.getState().data.groups.find((group) => group.id === groupId)?.members[0]?.id;

    if (currentUserId) {
      this.removeMember(groupId, currentUserId);
    }
  },

  deleteGroup(groupId: string): void {
    const data = updateData((currentData) => ({
      ...currentData,
      groups: currentData.groups.map((group) => (group.id === groupId ? { ...group, deleted: true } : group)),
    }));
    const nextGroup = data.groups.find((group) => !group.deleted);
    groupsStore.setState({ selectedGroupId: nextGroup?.id ?? '' });
  },

  updateTask(taskId: string, status: GroupTask['status']): void {
    updateData((data) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    }));
  },

  updateAnnouncement(announcementId: string, patch: Partial<GroupAnnouncement>): void {
    updateData((data) => ({
      ...data,
      announcements: data.announcements.map((announcement) => (
        announcement.id === announcementId ? { ...announcement, ...patch } : announcement
      )),
    }));
  },
};

export function useGroups<Selected>(selector: (state: GroupsState) => Selected): Selected {
  return useStore(groupsStore, selector);
}
