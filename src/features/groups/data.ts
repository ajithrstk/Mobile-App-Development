import initialChats from '../../data/chats';
import contacts from '../../data/contacts';
import type { GroupsStateData, GroupMember, GroupProfile } from './domain';

const selectedGroupChatIds = ['3', '5', '7', '10', '15', '13', '17', '21'];
const now = '2026-08-06T10:00:00+05:30';

function buildMembers(groupIndex: number, size: number): GroupMember[] {
  return Array.from({ length: size }, (_, index) => {
    const contact = contacts[(groupIndex * 17 + index) % contacts.length];

    return {
      avatar: contact.avatar,
      id: contact.id,
      joinedAt: new Date(Date.parse(now) - index * 86400000).toISOString(),
      name: contact.name,
      phone: contact.phone,
      role: index < 2 ? 'admin' : 'member',
    };
  });
}

const descriptions: Record<string, string> = {
  '10': 'Food decisions, lunch polls, menu links, and office announcements.',
  '15': 'Daily engineering standups, release blockers, shared files, and action items.',
  '13': 'Reunion plans, college memories, travel ideas, and weekend catch-ups.',
  '17': 'Workout plans, progress checks, meal ideas, and fitness polls.',
  '21': 'Book picks, reading reminders, notes, and monthly discussion plans.',
  '3': 'Design reviews, UI polish, onboarding copy, and shared critique notes.',
  '5': 'Family updates, plans, photos, and read-only announcements when needed.',
  '7': 'Launch planning, product decisions, docs, reminders, and tasks.',
};

export const initialGroups: GroupProfile[] = selectedGroupChatIds.map((chatId, index) => {
  const chat = initialChats.find((item) => item.id === chatId);

  if (!chat) {
    throw new Error(`Missing seed chat ${chatId}`);
  }

  const members = buildMembers(index, [12, 20, 16, 14, 18, 15, 13, 11][index]);

  return {
    admins: members.filter((member) => member.role === 'admin').map((member) => member.id),
    announcementOnly: chatId === '7',
    avatar: chat.avatar,
    chatId,
    createdAt: new Date(Date.parse(now) - (index + 21) * 86400000).toISOString(),
    description: descriptions[chatId],
    id: `group-${chatId}`,
    inviteLink: `https://chat.chatterly.local/invite/group-${chatId}`,
    members,
    name: chat.name,
    pinnedMessageIds: index % 2 === 0 ? ['msg-15'] : [],
    updatedAt: now,
  };
});

export const initialGroupsData: GroupsStateData = {
  announcements: [
    { channel: 'Design Team', deliveryStatus: 'delivered', groupId: 'group-3', id: 'ann-group-1', readOnly: true, reach: 6, scheduledAt: '2026-08-06T18:00:00+05:30', title: 'Prototype review closes tonight' },
    { channel: 'Family', deliveryStatus: 'read', groupId: 'group-5', id: 'ann-group-2', readOnly: true, reach: 5, title: 'Dinner plan moved to 8 PM' },
    { channel: 'Product Squad', deliveryStatus: 'scheduled', groupId: 'group-7', id: 'ann-group-3', readOnly: true, reach: 6, scheduledAt: '2026-08-07T09:00:00+05:30', title: 'Launch freeze starts tomorrow' },
    { channel: 'Office Lunch', deliveryStatus: 'delivered', groupId: 'group-10', id: 'ann-group-4', readOnly: false, reach: 5, title: 'Poll closes in 10 minutes' },
    { channel: 'Dev Standup', deliveryStatus: 'sent', groupId: 'group-15', id: 'ann-group-5', readOnly: false, reach: 6, title: 'Build is green again' },
    { channel: 'College Friends', deliveryStatus: 'read', groupId: 'group-13', id: 'ann-group-6', readOnly: false, reach: 5, title: 'Reunion dates shortlisted' },
    { channel: 'Fitness Group', deliveryStatus: 'delivered', groupId: 'group-17', id: 'ann-group-7', readOnly: false, reach: 6, title: 'Tomorrow is leg day' },
    { channel: 'Book Club', deliveryStatus: 'scheduled', groupId: 'group-21', id: 'ann-group-8', readOnly: true, reach: 5, title: 'Next pick voting starts tonight' },
  ],
  documents: [
    { category: 'document', groupId: 'group-3', id: 'doc-group-1', owner: 'Mallika', reviewers: ['Krishna', 'Yashwanth'], title: 'Onboarding copy review', updatedAt: '2026-08-06T09:10:00+05:30', version: 4 },
    { category: 'media', groupId: 'group-5', id: 'doc-group-2', owner: 'Bhargavi', reviewers: ['Ajith'], title: 'Weekend photos album', updatedAt: '2026-08-05T20:30:00+05:30', version: 2 },
    { category: 'document', groupId: 'group-7', id: 'doc-group-3', owner: 'Suresh', reviewers: ['Arun', 'Ajith'], title: 'Q3 launch deck', updatedAt: '2026-08-06T11:40:00+05:30', version: 7 },
    { category: 'link', groupId: 'group-10', id: 'doc-group-4', owner: 'Naveen', reviewers: ['Sabari'], title: 'Caterer menu links', updatedAt: '2026-08-06T10:15:00+05:30', version: 1 },
    { category: 'document', groupId: 'group-15', id: 'doc-group-5', owner: 'Sathish', reviewers: ['Bharath'], title: 'Websocket retry budget', updatedAt: '2026-08-06T08:45:00+05:30', version: 3 },
  ],
  events: [
    { groupId: 'group-3', id: 'event-group-1', reminderEnabled: true, rsvp: { maybe: 4, no: 1, yes: 18 }, startsAt: '2026-08-07T14:00:00+05:30', title: 'Design critique' },
    { groupId: 'group-5', id: 'event-group-2', reminderEnabled: true, rsvp: { maybe: 3, no: 0, yes: 21 }, startsAt: '2026-08-09T19:30:00+05:30', title: 'Family dinner' },
    { groupId: 'group-7', id: 'event-group-3', reminderEnabled: true, rsvp: { maybe: 8, no: 2, yes: 64 }, startsAt: '2026-08-07T10:30:00+05:30', title: 'Release readiness review' },
    { groupId: 'group-10', id: 'event-group-4', reminderEnabled: false, rsvp: { maybe: 2, no: 1, yes: 22 }, startsAt: '2026-08-06T13:00:00+05:30', title: 'Team lunch' },
    { groupId: 'group-15', id: 'event-group-5', reminderEnabled: true, rsvp: { maybe: 5, no: 0, yes: 42 }, startsAt: '2026-08-07T09:45:00+05:30', title: 'Daily standup' },
  ],
  generatedAt: now,
  groups: initialGroups,
  tasks: [
    { assignees: ['Mallika', 'Krishna'], attachmentCount: 2, commentCount: 8, dueAt: '2026-08-07T12:00:00+05:30', groupId: 'group-3', id: 'task-group-1', priority: 'high', reminderAt: '2026-08-07T09:00:00+05:30', status: 'inProgress', title: 'Review onboarding copy' },
    { assignees: ['Bhargavi'], attachmentCount: 1, commentCount: 3, dueAt: '2026-08-08T17:00:00+05:30', groupId: 'group-5', id: 'task-group-2', priority: 'medium', status: 'todo', title: 'Share travel options' },
    { assignees: ['Suresh'], attachmentCount: 1, commentCount: 4, dueAt: '2026-08-06T15:30:00+05:30', groupId: 'group-7', id: 'task-group-3', priority: 'urgent', status: 'blocked', title: 'Attach Q3 launch deck' },
    { assignees: ['Naveen', 'Sabari'], attachmentCount: 0, commentCount: 11, dueAt: '2026-08-06T12:30:00+05:30', groupId: 'group-10', id: 'task-group-4', priority: 'low', status: 'inProgress', title: 'Finalize lunch poll result' },
    { assignees: ['Arun', 'Ajith'], attachmentCount: 0, commentCount: 2, dueAt: '2026-08-09T10:00:00+05:30', groupId: 'group-15', id: 'task-group-5', priority: 'medium', reminderAt: '2026-08-08T16:00:00+05:30', status: 'todo', title: 'Confirm websocket retry budget' },
  ],
};
