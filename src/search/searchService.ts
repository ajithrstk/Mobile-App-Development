import contacts from '../data/contacts';
import initialChats from '../data/chats';
import initialMessages from '../data/messages';
import { messageCache } from '../storage/messageCache';
import { storageKeys } from '../storage/storageKeys';
import { storageService } from '../storage/storageService';
import type { Chat } from '../types';
import type { ContactProfile } from '../types/contact';
import type { ChatMessage, MessageKind } from '../types/message';
import type { Channel } from '../features/updates/types/updates.types';
import { formatMessageTime, getMessagePreview } from '../utils/chat';

export type SearchFilter =
  | 'photos'
  | 'videos'
  | 'documents'
  | 'links'
  | 'audio'
  | 'gifs'
  | 'contacts'
  | 'location'
  | 'polls'
  | 'starred';

export type DateFilter = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

export type GlobalSearchResultType = 'message' | 'contact' | 'group' | 'channel' | 'media' | 'document' | 'link';

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle: string;
  body?: string;
  timestamp?: string;
  chat?: Chat;
  message?: ChatMessage;
  contact?: ContactProfile;
  channel?: Channel;
  url?: string;
  domain?: string;
};

export type SearchInput = {
  query: string;
  filters: SearchFilter[];
  dateFilter: DateFilter;
  customStart?: string;
  customEnd?: string;
  chats?: Chat[];
  channels?: Channel[];
};

const GROUP_CHAT_NAMES = new Set([
  'Design Team',
  'Family',
  'Product Squad',
  'Office Lunch',
  'Dev Standup',
  'College Friends',
  'Fitness Group',
  'Book Club',
  'Travel Plan',
  'Marketing Leads',
]);

const URL_PATTERN = /(https?:\/\/[^\s]+)/i;

function synthesizeMessages(chat: Chat): ChatMessage[] {
  const now = Date.now();

  return initialMessages.map((message, index) => ({
    ...message,
    chatId: chat.id,
    clientId: `${chat.id}-${message.id}`,
    id: `${chat.id}-${message.id}`,
    senderId: message.sender === 'me' ? 'mock-user' : chat.contactId ?? `contact-${chat.id}`,
    timestamp: new Date(now - (initialMessages.length - index) * 1000 * 60 * 16).toISOString(),
  }));
}

async function getMessagesByChat(chats: Chat[]): Promise<Record<string, ChatMessage[]>> {
  const entries = await Promise.all(chats.map(async (chat) => {
    const cachedMessages = await messageCache.loadMessages(chat.id);
    return [chat.id, cachedMessages.length > 0 ? cachedMessages : synthesizeMessages(chat)] as const;
  }));

  return Object.fromEntries(entries);
}

function normalize(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function messageSearchText(message: ChatMessage, chat: Chat): string {
  const senderName = message.sender === 'me' ? 'you' : chat.name;

  return [
    senderName,
    chat.name,
    message.kind,
    getMessagePreview(message),
    message.text,
    message.fileName,
    message.file?.name,
    message.file?.mimeType,
    message.location?.title,
    message.location?.address,
    message.contact?.name,
    message.contact?.phone,
    message.linkPreview?.title,
    message.linkPreview?.domain,
    message.linkPreview?.url,
    message.poll?.question,
    message.poll?.options.map((option) => option.text).join(' '),
    new Date(message.timestamp).toLocaleDateString(),
    formatMessageTime(message.timestamp),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function messageMatchesFilter(message: ChatMessage, filter: SearchFilter): boolean {
  const preview = getMessagePreview(message).toLowerCase();
  const hasUrl = Boolean(message.linkPreview || URL_PATTERN.test(message.text ?? ''));
  const kindMatches: Record<SearchFilter, boolean> = {
    audio: message.kind === 'audio' || message.kind === 'voice',
    contacts: message.kind === 'contact' || Boolean(message.contact),
    documents: message.kind === 'file' && message.file?.category !== 'audio',
    gifs: message.kind === 'gif' || preview.includes('gif'),
    links: hasUrl,
    location: message.kind === 'location',
    photos: message.kind === 'image',
    polls: message.kind === 'poll',
    starred: Boolean(message.starred),
    videos: message.kind === 'video',
  };

  return kindMatches[filter];
}

function resultTypeForMessage(message: ChatMessage): GlobalSearchResultType {
  if (message.kind === 'image' || message.kind === 'video' || message.kind === 'gif') {
    return 'media';
  }

  if (message.kind === 'file' || message.kind === 'audio') {
    return 'document';
  }

  if (message.linkPreview || URL_PATTERN.test(message.text ?? '')) {
    return 'link';
  }

  return 'message';
}

function dateStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function matchesDateFilter(timestamp: string, filter: DateFilter, customStart?: string, customEnd?: string): boolean {
  if (filter === 'all') {
    return true;
  }

  const messageDate = new Date(timestamp);
  const today = dateStart(new Date());
  const messageDay = dateStart(messageDate);

  if (filter === 'today') {
    return messageDay.getTime() === today.getTime();
  }

  if (filter === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return messageDay.getTime() === yesterday.getTime();
  }

  if (filter === 'last7' || filter === 'last30') {
    const start = new Date(today);
    start.setDate(today.getDate() - (filter === 'last7' ? 6 : 29));
    return messageDay >= start && messageDay <= today;
  }

  const start = customStart ? dateStart(new Date(`${customStart}T00:00:00`)) : null;
  const end = customEnd ? dateStart(new Date(`${customEnd}T00:00:00`)) : null;
  return (!start || messageDay >= start) && (!end || messageDay <= end);
}

function getUrl(message: ChatMessage): string | undefined {
  return message.linkPreview?.url ?? message.text?.match(URL_PATTERN)?.[1];
}

function getDomain(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

function dedupeResults(results: GlobalSearchResult[]): GlobalSearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.type}:${result.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function searchLocally(input: SearchInput): Promise<GlobalSearchResult[]> {
  const query = normalize(input.query);
  const chats = input.chats?.length ? input.chats : initialChats;
  const channels = input.channels ?? [];
  const filters = new Set(input.filters);
  const allowDirectoryResults = input.dateFilter === 'all';
  const messagesByChat = await getMessagesByChat(chats);
  const results: GlobalSearchResult[] = [];

  chats.forEach((chat) => {
    if (allowDirectoryResults && (filters.size === 0 || filters.has('contacts') || filters.has('starred'))) {
      const chatText = normalize(`${chat.name} ${chat.lastMessage}`);
      const isGroup = GROUP_CHAT_NAMES.has(chat.name);

      if ((!query || chatText.includes(query)) && (!filters.has('contacts') || !isGroup) && !filters.has('starred')) {
        results.push({
          chat,
          id: chat.id,
          subtitle: isGroup ? chat.lastMessage : 'Contact',
          title: chat.name,
          type: isGroup ? 'group' : 'contact',
        });
      }
    }

    (messagesByChat[chat.id] ?? []).forEach((message) => {
      if (message.deleted) {
        return;
      }

      const hasActiveMessageFilter = filters.size > 0;
      const matchesFilters = hasActiveMessageFilter
        ? [...filters].some((filter) => messageMatchesFilter(message, filter))
        : true;

      if (!matchesFilters || !matchesDateFilter(message.timestamp, input.dateFilter, input.customStart, input.customEnd)) {
        return;
      }

      const text = messageSearchText(message, chat);

      if (query && !text.includes(query)) {
        return;
      }

      const url = getUrl(message);
      const domain = message.linkPreview?.domain ?? getDomain(url);

      results.push({
        body: getMessagePreview(message),
        chat,
        domain,
        id: message.id,
        message,
        subtitle: `${message.sender === 'me' ? 'You' : chat.name} in ${chat.name}`,
        timestamp: message.timestamp,
        title: resultTypeForMessage(message) === 'message' ? getMessagePreview(message) : chat.name,
        type: resultTypeForMessage(message),
        url,
      });
    });
  });

  if (allowDirectoryResults && (filters.size === 0 || filters.has('contacts'))) {
    contacts.forEach((contact) => {
      const text = normalize(`${contact.name} ${contact.phone} ${contact.status}`);

      if (!query || text.includes(query)) {
        results.push({
          contact,
          id: contact.id,
          subtitle: contact.status,
          title: contact.name,
          type: 'contact',
        });
      }
    });
  }

  if (allowDirectoryResults && filters.size === 0) {
    channels.forEach((channel) => {
      const text = normalize(`${channel.name} ${channel.username} ${channel.description} ${channel.latestUpdate}`);

      if (!query || text.includes(query)) {
        results.push({
          channel,
          id: channel.id,
          subtitle: channel.latestUpdate ?? channel.description,
          title: channel.name,
          type: 'channel',
        });
      }
    });
  }

  return dedupeResults(results).sort((first, second) => Date.parse(second.timestamp ?? '1970-01-01') - Date.parse(first.timestamp ?? '1970-01-01'));
}

export async function saveRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return getRecentSearches();
  }

  const current = await getRecentSearches();
  const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
  await storageService.set(storageKeys.searchHistory, next);
  return next;
}

export async function getRecentSearches(): Promise<string[]> {
  return storageService.get<string[]>(storageKeys.searchHistory, []);
}

export async function clearRecentSearches(): Promise<void> {
  await storageService.set(storageKeys.searchHistory, []);
}

export function buildSuggestions(recentSearches: string[], query: string, chats: Chat[], channels: Channel[]): string[] {
  const normalizedQuery = normalize(query);
  const seeds = [
    ...recentSearches,
    ...chats.map((chat) => chat.name),
    ...contacts.slice(0, 24).map((contact) => contact.name),
    ...channels.map((channel) => channel.name),
    'photos',
    'documents',
    'links',
    'starred messages',
    'yesterday',
    'poll',
  ];

  return Array.from(new Set(seeds))
    .filter((item) => !normalizedQuery || item.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);
}

export const searchFilterLabels: Record<SearchFilter, string> = {
  audio: 'Audio',
  contacts: 'Contacts',
  documents: 'Documents',
  gifs: 'GIFs',
  links: 'Links',
  location: 'Location',
  photos: 'Photos',
  polls: 'Polls',
  starred: 'Starred',
  videos: 'Videos',
};

export const dateFilterLabels: Record<DateFilter, string> = {
  all: 'Any date',
  custom: 'Custom',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  today: 'Today',
  yesterday: 'Yesterday',
};

export const messageKindLabels: Record<MessageKind, string> = {
  audio: 'Audio',
  contact: 'Contact',
  file: 'Document',
  gif: 'GIF',
  image: 'Photo',
  location: 'Location',
  poll: 'Poll',
  text: 'Message',
  video: 'Video',
  voice: 'Audio',
};
