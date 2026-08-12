import type { ImageSourcePropType } from 'react-native';
import type { Chat } from '../types';

const avatars = {
  ajith: require('../../assets/avatars/realistic/male-01.png'),
  yashwanth: require('../../assets/avatars/realistic/male-02.png'),
  designTeam: require('../../assets/avatars/realistic/group-01.png'),
  mallika: require('../../assets/avatars/realistic/female-01.png'),
  family: require('../../assets/avatars/realistic/group-02.png'),
  bhargavi: require('../../assets/avatars/realistic/female-02.png'),
  productSquad: require('../../assets/avatars/realistic/group-03.png'),
  bharath: require('../../assets/avatars/realistic/male-03.png'),
  sanguBhargav: require('../../assets/avatars/realistic/male-04.png'),
  officeLunch: require('../../assets/avatars/realistic/group-04.png'),
  sabari: require('../../assets/avatars/realistic/male-05.png'),
  sujiSri: require('../../assets/avatars/realistic/female-03.png'),
  collegeFriends: require('../../assets/avatars/realistic/group-05.png'),
  sureshKumar: require('../../assets/avatars/realistic/male-06.png'),
  devStandup: require('../../assets/avatars/realistic/group-06.png'),
  sathish: require('../../assets/avatars/realistic/male-07.png'),
  fitnessGroup: require('../../assets/avatars/realistic/group-07.png'),
  naveen: require('../../assets/avatars/realistic/male-08.png'),
  travelPlan: require('../../assets/avatars/realistic/group-08.png'),
  gokul: require('../../assets/avatars/realistic/male-09.png'),
  bookClub: require('../../assets/avatars/realistic/group-09.png'),
  gowsik: require('../../assets/avatars/realistic/male-10.png'),
  marketingLeads: require('../../assets/avatars/realistic/group-10.png'),
  krishna: require('../../assets/avatars/realistic/male-11.png'),
  seriSeri: require('../../assets/avatars/realistic/male-12.png'),
  arun: require('../../assets/avatars/realistic/male-02.png'),
  aj: require('../../assets/avatars/realistic/male-03.png'),
  ajithArun: require('../../assets/avatars/realistic/male-04.png'),
} satisfies Record<string, ImageSourcePropType>;

const chats: Chat[] = [
  { id: '1', name: 'Ajith', lastMessage: 'Can you send the deck before lunch?', time: '10:42 AM', unread: 3, muted: false, pinned: true, archived: false, avatar: avatars.ajith, online: true, verified: true, status: 'read' },
  { id: '2', name: 'Yashwanth', lastMessage: 'That sounds perfect. See you soon.', time: '10:18 AM', unread: 0, muted: true, pinned: true, archived: false, avatar: avatars.yashwanth, online: false, verified: false, status: 'delivered' },
  { id: '3', name: 'Design Team', lastMessage: 'Updated the login screens.', time: '9:57 AM', unread: 8, muted: true, pinned: false, archived: false, avatar: avatars.designTeam, online: true, verified: true, status: 'typing' },
  { id: '4', name: 'Mallika', lastMessage: 'Coffee after the standup?', time: '9:31 AM', unread: 1, muted: false, pinned: false, archived: false, avatar: avatars.mallika, online: true, verified: false, status: 'sent' },
  { id: '5', name: 'Family', lastMessage: 'Dinner is at 8 tonight.', time: 'Yesterday', unread: 5, muted: false, pinned: false, archived: false, avatar: avatars.family, online: false, verified: false, status: 'delivered' },
  { id: '6', name: 'Bhargavi', lastMessage: 'I loved the photos from the trip.', time: 'Yesterday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.bhargavi, online: true, verified: true, status: 'read' },
  { id: '7', name: 'Product Squad', lastMessage: 'Release notes are ready for review.', time: 'Yesterday', unread: 12, muted: true, pinned: false, archived: false, avatar: avatars.productSquad, online: true, verified: true, status: 'typing' },
  { id: '8', name: 'Bharath', lastMessage: 'Booked the tickets.', time: 'Sunday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.bharath, online: false, verified: false, status: 'sent' },
  { id: '9', name: 'Sangu Bhargav', lastMessage: 'Let us move the call to 4.', time: 'Sunday', unread: 2, muted: false, pinned: false, archived: false, avatar: avatars.sanguBhargav, online: true, verified: false, status: 'failed' },
  { id: '10', name: 'Office Lunch', lastMessage: 'Poll closes in 10 minutes.', time: 'Saturday', unread: 0, muted: true, pinned: false, archived: false, avatar: avatars.officeLunch, online: false, verified: false, status: 'delivered' },
  { id: '11', name: 'Sabari', lastMessage: 'Great, I will check and reply.', time: 'Saturday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.sabari, online: true, verified: false, status: 'read' },
  { id: '12', name: 'Suji Sri', lastMessage: 'The file is in the shared folder.', time: 'Friday', unread: 4, muted: false, pinned: false, archived: false, avatar: avatars.sujiSri, online: true, verified: true, status: 'delivered' },
  { id: '13', name: 'College Friends', lastMessage: 'Reunion plan is finally happening.', time: 'Friday', unread: 23, muted: true, pinned: false, archived: false, avatar: avatars.collegeFriends, online: false, verified: false, status: 'read' },
  { id: '14', name: 'Suresh Kumar', lastMessage: 'Sending the address now.', time: 'Thursday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.sureshKumar, online: false, verified: true, status: 'sent' },
  { id: '15', name: 'Dev Standup', lastMessage: 'Build is green again.', time: 'Thursday', unread: 6, muted: false, pinned: false, archived: false, avatar: avatars.devStandup, online: true, verified: true, status: 'read' },
  { id: '16', name: 'Sathish', lastMessage: 'Haha, that was exactly it.', time: 'Wednesday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.sathish, online: false, verified: false, status: 'delivered' },
  { id: '17', name: 'Fitness Group', lastMessage: 'Tomorrow is leg day.', time: 'Wednesday', unread: 9, muted: true, pinned: false, archived: false, avatar: avatars.fitnessGroup, online: true, verified: false, status: 'typing' },
  { id: '18', name: 'Naveen', lastMessage: 'Please call when free.', time: 'Tuesday', unread: 1, muted: false, pinned: false, archived: false, avatar: avatars.naveen, online: true, verified: false, status: 'failed' },
  { id: '19', name: 'Travel Plan', lastMessage: 'I found a nicer stay.', time: 'Tuesday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.travelPlan, online: false, verified: false, status: 'delivered' },
  { id: '20', name: 'Gokul', lastMessage: 'Thanks for the quick help.', time: 'Monday', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.gokul, online: false, verified: false, status: 'read' },
  { id: '21', name: 'Book Club', lastMessage: 'Next pick is on the list.', time: 'Monday', unread: 7, muted: true, pinned: false, archived: false, avatar: avatars.bookClub, online: true, verified: false, status: 'typing' },
  { id: '22', name: 'Gowsik', lastMessage: 'Voice note', time: '26/07/26', unread: 0, muted: false, pinned: false, archived: false, avatar: avatars.gowsik, online: false, verified: false, status: 'sent' },
  { id: '23', name: 'Marketing Leads', lastMessage: 'Campaign numbers look solid.', time: '25/07/26', unread: 15, muted: true, pinned: false, archived: false, avatar: avatars.marketingLeads, online: true, verified: true, status: 'read' },
  { id: '24', name: 'Krishna', lastMessage: 'On my way.', time: '24/07/26', unread: 0, muted: false, pinned: false, archived: true, avatar: avatars.krishna, online: true, verified: false, status: 'delivered' },
  { id: '25', name: 'Seri Seri', lastMessage: 'I will be there in 15 minutes.', time: '23/07/26', unread: 0, muted: false, pinned: false, archived: true, avatar: avatars.seriSeri, online: false, verified: false, status: 'sent' },
  { id: '26', name: 'Arun', lastMessage: 'Send me the location.', time: '23/07/26', unread: 2, muted: false, pinned: false, archived: false, avatar: avatars.arun, online: true, verified: true, status: 'read' },
  { id: '27', name: 'Aj', lastMessage: 'Done, check it now.', time: '22/07/26', unread: 0, muted: true, pinned: false, archived: false, avatar: avatars.aj, online: false, verified: false, status: 'failed' },
  { id: '28', name: 'Ajith Arun', lastMessage: 'Let us catch up this weekend.', time: '22/07/26', unread: 1, muted: false, pinned: false, archived: false, avatar: avatars.ajithArun, online: true, verified: true, status: 'delivered' },
];

export const chatsById = Object.fromEntries(chats.map((chat) => [chat.id, chat])) as Record<string, Chat>;

export default chats;

