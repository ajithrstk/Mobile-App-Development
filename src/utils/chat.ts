import type { ChatMessage } from '../types/message';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DUMMY_TODAY = '2026-07-30';
const DUMMY_YESTERDAY = '2026-07-29';

function padTimePart(value: number): string {
  return value.toString().padStart(2, '0');
}

export function getMessageDateKey(timestamp: string): string {
  return timestamp.slice(0, 10);
}

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = padTimePart(date.getMinutes());
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${suffix}`;
}

export function formatDateSeparator(timestamp: string): string {
  const dateKey = getMessageDateKey(timestamp);

  if (dateKey === DUMMY_TODAY) {
    return 'Today';
  }

  if (dateKey === DUMMY_YESTERDAY) {
    return 'Yesterday';
  }

  const date = new Date(`${dateKey}T00:00:00+05:30`);

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getMessagePreview(message: ChatMessage): string {
  if (message.kind === 'image') {
    return message.text ? `Photo: ${message.text}` : 'Photo';
  }

  if (message.kind === 'video') {
    return message.text ? `Video: ${message.text}` : 'Video';
  }

  if (message.kind === 'voice') {
    return `Voice message ${message.duration ?? ''}`.trim();
  }

  if (message.kind === 'file') {
    return message.file?.name ?? message.fileName ?? 'Document';
  }

  if (message.kind === 'audio') {
    return message.file?.name ?? message.fileName ?? 'Audio';
  }

  if (message.kind === 'location') {
    return message.location?.title ?? 'Location';
  }

  if (message.kind === 'poll') {
    return message.poll?.question ? `Poll: ${message.poll.question}` : 'Poll';
  }

  return message.text ?? '';
}
