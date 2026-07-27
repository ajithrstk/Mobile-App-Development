const avatar = require('../../assets/icon.png');

const chats = [
  { id: '1', name: 'Ajith', lastMessage: 'Can you send the deck before lunch?', time: '10:42 AM', unread: 3, muted: false, pinned: true, archived: false, avatar },
  { id: '2', name: 'Yashwanth', lastMessage: 'That sounds perfect. See you soon.', time: '10:18 AM', unread: 0, muted: true, pinned: true, archived: false, avatar },
  { id: '3', name: 'Design Team', lastMessage: 'Updated the login screens.', time: '9:57 AM', unread: 8, muted: true, pinned: false, archived: false, avatar },
  { id: '4', name: 'Mallika', lastMessage: 'Coffee after the standup?', time: '9:31 AM', unread: 1, muted: false, pinned: false, archived: false, avatar },
  { id: '5', name: 'Family', lastMessage: 'Dinner is at 8 tonight.', time: 'Yesterday', unread: 5, muted: false, pinned: false, archived: false, avatar },
  { id: '6', name: 'Bhargavi', lastMessage: 'I loved the photos from the trip.', time: 'Yesterday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '7', name: 'Product Squad', lastMessage: 'Release notes are ready for review.', time: 'Yesterday', unread: 12, muted: true, pinned: false, archived: false, avatar },
  { id: '8', name: 'Bharath', lastMessage: 'Booked the tickets.', time: 'Sunday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '9', name: 'Sangu Bhargav', lastMessage: 'Let us move the call to 4.', time: 'Sunday', unread: 2, muted: false, pinned: false, archived: false, avatar },
  { id: '10', name: 'Office Lunch', lastMessage: 'Poll closes in 10 minutes.', time: 'Saturday', unread: 0, muted: true, pinned: false, archived: false, avatar },
  { id: '11', name: 'Sabari', lastMessage: 'Great, I will check and reply.', time: 'Saturday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '12', name: 'Suji Sri', lastMessage: 'The file is in the shared folder.', time: 'Friday', unread: 4, muted: false, pinned: false, archived: false, avatar },
  { id: '13', name: 'College Friends', lastMessage: 'Reunion plan is finally happening.', time: 'Friday', unread: 23, muted: true, pinned: false, archived: false, avatar },
  { id: '14', name: 'Suresh Kumar', lastMessage: 'Sending the address now.', time: 'Thursday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '15', name: 'Dev Standup', lastMessage: 'Build is green again.', time: 'Thursday', unread: 6, muted: false, pinned: false, archived: false, avatar },
  { id: '16', name: 'Sathish', lastMessage: 'Haha, that was exactly it.', time: 'Wednesday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '17', name: 'Fitness Group', lastMessage: 'Tomorrow is leg day.', time: 'Wednesday', unread: 9, muted: true, pinned: false, archived: false, avatar },
  { id: '18', name: 'Naveen', lastMessage: 'Please call when free.', time: 'Tuesday', unread: 1, muted: false, pinned: false, archived: false, avatar },
  { id: '19', name: 'Travel Plan', lastMessage: 'I found a nicer stay.', time: 'Tuesday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '20', name: 'Gokul', lastMessage: 'Thanks for the quick help.', time: 'Monday', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '21', name: 'Book Club', lastMessage: 'Next pick is on the list.', time: 'Monday', unread: 7, muted: true, pinned: false, archived: false, avatar },
  { id: '22', name: 'Gowsik', lastMessage: 'Voice note', time: '26/07/26', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '23', name: 'Marketing Leads', lastMessage: 'Campaign numbers look solid.', time: '25/07/26', unread: 15, muted: true, pinned: false, archived: false, avatar },
  { id: '24', name: 'Krishna', lastMessage: 'On my way.', time: '24/07/26', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '25', name: 'Seri Seri', lastMessage: 'I will be there in 15 minutes.', time: '23/07/26', unread: 0, muted: false, pinned: false, archived: false, avatar },
  { id: '26', name: 'Arun', lastMessage: 'Send me the location.', time: '23/07/26', unread: 2, muted: false, pinned: false, archived: false, avatar },
  { id: '27', name: 'Aj', lastMessage: 'Done, check it now.', time: '22/07/26', unread: 0, muted: true, pinned: false, archived: false, avatar },
  { id: '28', name: 'Ajith Arun', lastMessage: 'Let us catch up this weekend.', time: '22/07/26', unread: 1, muted: false, pinned: false, archived: false, avatar },
];

export default chats;
