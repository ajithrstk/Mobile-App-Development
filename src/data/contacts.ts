import initialChats from './chats';
import type { ImageSourcePropType } from 'react-native';
import type { Chat } from '../types';
import type { ContactProfile } from '../types/contact';

const contactNames = [
  'Aadhya Rao',
  'Aarav Mehta',
  'Abhinav Reddy',
  'Aditi Sharma',
  'Akash Nair',
  'Ananya Iyer',
  'Arjun Patel',
  'Avani Singh',
  'Bala Krishnan',
  'Bhavya Kapoor',
  'Bhuvan Raj',
  'Bina Thomas',
  'Charan Das',
  'Chitra Menon',
  'Chris Fernandes',
  'Chetan Kulkarni',
  'Damini Bose',
  'Darshan Jain',
  'Deepa Narayan',
  'Dev Malhotra',
  'Eesha Verma',
  'Ehan Joseph',
  'Ekta Desai',
  'Esha George',
  'Farah Khan',
  'Firoz Ali',
  'Francis Dsouza',
  'Freda Mary',
  'Gaurav Bhat',
  'Gayatri Pillai',
  'Girish Naidu',
  'Gowri Sankar',
  'Harini Prasad',
  'Harsha Vardhan',
  'Hemanth Kumar',
  'Hiral Shah',
  'Ibrahim Syed',
  'Ira Chopra',
  'Ishan Gupta',
  'Ishita Sen',
  'Jai Ganesh',
  'Janani Murthy',
  'Jeevan Paul',
  'Joel Mathew',
  'Karthik Rao',
  'Kavya Suresh',
  'Kiran Thomas',
  'Komal Agarwal',
  'Lalith Mohan',
  'Lavanya Das',
  'Leena Francis',
  'Lokesh Jain',
  'Madhav Nair',
  'Mahima Reddy',
  'Manasi Joshi',
  'Meera Krishnan',
  'Nandhini Raj',
  'Naveen',
  'Neel Shah',
  'Nisha Kapoor',
  'Omkar Patil',
  'Oviya Mani',
  'Parth Sharma',
  'Pooja Iyer',
  'Pranav Menon',
  'Priya Thomas',
  'Qadir Khan',
  'Quincy Paul',
  'Raghav Bansal',
  'Rhea Dsouza',
  'Rohit Varma',
  'Roshni Nair',
  'Sabari',
  'Sakshi Jain',
  'Sanjay Bose',
  'Shruti Kulkarni',
  'Tanmay Shah',
  'Tara George',
  'Tejas Patel',
  'Trisha Sen',
  'Uma Krishnan',
  'Umesh Rao',
  'Usha Menon',
  'Utkarsh Singh',
  'Vaishnavi Iyer',
  'Varun Raj',
  'Vedant Suresh',
  'Vidya Pillai',
  'Wasim Ali',
  'Wilma Francis',
  'Xavier John',
  'Xena Mathew',
  'Yamini Das',
  'Yashwanth',
  'Yogesh Prasad',
  'Yukti Sharma',
  'Zain Khan',
  'Zara Joseph',
  'Zoya Chopra',
  'Zubin Mehta',
  'Ajith',
  'Ajith Arun',
  'Aj',
  'Arun',
  'Bharath',
  'Bhargavi',
  'Gokul',
  'Gowsik',
  'Krishna',
  'Mallika',
  'Sangu Bhargav',
  'Sathish',
  'Seri Seri',
  'Suji Sri',
  'Suresh Kumar',
  'Aneesh Warrior',
  'Bindu Nambiar',
  'Chandru Ravi',
  'Divya Mohan',
  'Elina Roy',
  'Fathima Noor',
  'Ganesh Iyer',
  'Hema Latha',
  'Indu Menon',
  'Jasmine Peter',
  'Keerthi Bala',
  'Linto Jose',
  'Mithun Das',
  'Nithya Ram',
  'Omar Farooq',
  'Payal Sinha',
  'Ritika Bedi',
  'Sreya Nair',
  'Vimal Raj',
  'Zeeshan Malik',
];

const statuses = [
  'Hey there! I am using Chatterly.',
  'Available',
  'At work',
  'Battery about to die',
  'Busy, call me later',
  'In a meeting',
  'Life is better with coffee',
  'Only messages, please',
  'On the move',
  'Weekend mode soon',
];

const existingChatMap = new Map(initialChats.map((chat) => [chat.name.toLowerCase(), chat]));
const femaleNames = new Set([
  'Aadhya', 'Aditi', 'Ananya', 'Avani', 'Bina', 'Bhargavi', 'Chitra', 'Damini', 'Deepa', 'Eesha', 'Ekta', 'Esha', 'Farah', 'Freda',
  'Gayatri', 'Gowri', 'Harini', 'Hiral', 'Ira', 'Ishita', 'Janani', 'Kavya', 'Komal', 'Lavanya', 'Leena', 'Mahima', 'Manasi',
  'Mallika', 'Meera', 'Nandhini', 'Nisha', 'Oviya', 'Pooja', 'Priya', 'Rhea', 'Roshni', 'Sakshi', 'Shruti', 'Suji', 'Tara',
  'Trisha', 'Uma', 'Usha', 'Vaishnavi', 'Vidya', 'Wilma', 'Xena', 'Yamini', 'Yukti', 'Zara', 'Zoya', 'Bindu', 'Divya', 'Elina',
  'Fathima', 'Hema', 'Indu', 'Jasmine', 'Keerthi', 'Nithya', 'Payal', 'Ritika', 'Sreya',
]);

const maleAvatarPool: ImageSourcePropType[] = [
  require('../../assets/avatars/realistic/male-01.png'),
  require('../../assets/avatars/realistic/male-02.png'),
  require('../../assets/avatars/realistic/male-03.png'),
  require('../../assets/avatars/realistic/male-04.png'),
  require('../../assets/avatars/realistic/male-05.png'),
  require('../../assets/avatars/realistic/male-06.png'),
  require('../../assets/avatars/realistic/male-07.png'),
  require('../../assets/avatars/realistic/male-08.png'),
  require('../../assets/avatars/realistic/male-09.png'),
  require('../../assets/avatars/realistic/male-10.png'),
  require('../../assets/avatars/realistic/male-11.png'),
  require('../../assets/avatars/realistic/male-12.png'),
];

const femaleAvatarPool: ImageSourcePropType[] = [
  require('../../assets/avatars/realistic/female-01.png'),
  require('../../assets/avatars/realistic/female-02.png'),
  require('../../assets/avatars/realistic/female-03.png'),
  require('../../assets/avatars/realistic/female-04.png'),
  require('../../assets/avatars/realistic/female-05.png'),
  require('../../assets/avatars/realistic/female-06.png'),
  require('../../assets/avatars/realistic/female-07.png'),
  require('../../assets/avatars/realistic/female-08.png'),
  require('../../assets/avatars/realistic/female-09.png'),
  require('../../assets/avatars/realistic/female-10.png'),
  require('../../assets/avatars/realistic/female-11.png'),
  require('../../assets/avatars/realistic/female-12.png'),
];

function isFemaleName(name: string): boolean {
  const firstName = name.split(' ')[0] ?? name;
  return femaleNames.has(firstName);
}

function profileAvatarFor(name: string, index: number): ImageSourcePropType {
  const pool = isFemaleName(name) ? femaleAvatarPool : maleAvatarPool;
  return pool[index % pool.length];
}

export function getExistingChatForContact(contact: ContactProfile): Chat | undefined {
  return existingChatMap.get(contact.name.toLowerCase());
}

export function getContactChat(contact: ContactProfile): Chat {
  const existingChat = getExistingChatForContact(contact);

  if (existingChat) {
    return {
      ...existingChat,
      avatar: contact.avatar ?? existingChat.avatar,
    };
  }

  return {
    id: `new-${contact.id}`,
    name: contact.name,
    lastMessage: 'Tap to start chatting',
    time: 'Now',
    unread: 0,
    muted: false,
    pinned: false,
    archived: false,
    avatar: contact.avatar ?? maleAvatarPool[0],
    online: contact.online,
    verified: contact.verified,
    status: 'sent',
  };
}

const contacts: ContactProfile[] = contactNames
  .map((name, index) => {
    const existingChat = existingChatMap.get(name.toLowerCase());

    return {
      id: `contact-${index + 1}`,
      name,
      status: existingChat?.lastMessage ?? statuses[index % statuses.length],
      phone: `+91 9${String(870000000 + index * 7919).slice(0, 9)}`,
      online: existingChat?.online ?? index % 4 === 0,
      verified: existingChat?.verified ?? index % 11 === 0,
      favorite: index % 13 === 0 || ['Ajith', 'Bhargavi', 'Yashwanth', 'Mallika'].includes(name),
      recent: index % 9 === 0 || ['Naveen', 'Sabari', 'Suresh Kumar'].includes(name),
      inviteOnly: index % 17 === 0,
      avatar: profileAvatarFor(name, index),
    };
  })
  .sort((first, second) => first.name.localeCompare(second.name));

export default contacts;
